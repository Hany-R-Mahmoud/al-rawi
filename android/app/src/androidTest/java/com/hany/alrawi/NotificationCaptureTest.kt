package com.hany.alrawi

import android.app.Notification
import android.content.Context
import android.content.ContextWrapper
import android.content.SharedPreferences
import android.graphics.Bitmap
import android.database.sqlite.SQLiteDatabase
import android.util.Base64
import kotlin.random.Random
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import org.junit.Assert.*
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class NotificationCaptureTest {
    private val base = InstrumentationRegistry.getInstrumentation().targetContext

    /** Keep preferences separate from the real user; SQLite tests use a dedicated test-only database filename. */
    private val isolated = object : ContextWrapper(base) {
        override fun getSharedPreferences(name: String, mode: Int): SharedPreferences =
            base.getSharedPreferences("notification_capture_test_$name", mode)
    }

    private fun reset() {
        base.deleteDatabase("notification_capture_test.db")
        CaptureRules.setPackages(isolated, listOf("com.google.android.youtube", "com.google.android.gm"))
    }

    @Test fun defaultsAndExplicitPackages() {
        base.getSharedPreferences("notification_capture_test_alrawi_capture", Context.MODE_PRIVATE)
            .edit().remove("packages_v1").commit()
        assertEquals(listOf("com.google.android.youtube", "com.google.android.gm"), CaptureRules.packages(isolated))
        assertTrue(CaptureRules.eligible(isolated, "com.google.android.youtube", 0))
        assertFalse(CaptureRules.eligible(isolated, "com.example.other", 0))
        assertEquals(listOf("com.example.one", "com.example.two"),
            CaptureRules.setPackages(isolated, listOf("com.example.one", "com.example.one", "bad", "com.example.two")))
        assertFalse(CaptureRules.eligible(isolated, "com.google.android.gm", 0))
        assertTrue(CaptureRules.eligible(isolated, "com.example.two", 0))
        assertEquals(emptyList<String>(), CaptureRules.setPackages(isolated, emptyList()))
        assertFalse(CaptureRules.eligible(isolated, "com.example.two", 0))
    }

    @Test fun skippingOngoingSummarySelfAndBlank() {
        reset()
        NotificationDb(isolated, "notification_capture_test.db").use { db ->
            assertFalse(db.save(isolated, "com.example.other", "1", 0, "Other", "Title", "Text", 1))
            assertFalse(db.save(isolated, "com.hany.alrawi", "2", 0, "Self", "Title", "Text", 1))
            assertFalse(db.save(isolated, "com.google.android.gm", "3", Notification.FLAG_ONGOING_EVENT, "Gmail", "Title", "Text", 1))
            assertFalse(db.save(isolated, "com.google.android.gm", "4", Notification.FLAG_GROUP_SUMMARY, "Gmail", "Title", "Text", 1))
            assertFalse(db.save(isolated, "com.google.android.gm", "5", 0, "Gmail", "  ", " ", 1))
            assertEquals(0, db.list(500).length())
        }
    }

    @Test fun extractionCapsAndUrl() {
        assertEquals(280, CaptureRules.title("  " + "A".repeat(300)).length)
        assertEquals(4000, CaptureRules.text(null, " " + "B".repeat(5000)).length)
        assertEquals("long", CaptureRules.text("long", "short"))
        assertEquals("fallback", CaptureRules.text(" ", "fallback"))
        assertEquals("https://example.org/x", CaptureRules.url("See https://example.org/x.,)"))
        assertEquals("", CaptureRules.url("Nothing here"))
    }

    @Test fun dedupesUpdatesAndProtectsImportedRows() {
        reset()
        NotificationDb(isolated, "notification_capture_test.db").use { db ->
            assertTrue(db.save(isolated, "com.google.android.youtube", "stable-key", 0,
                "YouTube", "Old", "Version 1", 11))
            assertTrue(db.save(isolated, "com.google.android.youtube", "stable-key", 0,
                "YouTube", "New", "Version 2", 20))
            assertEquals(1, db.list(500).length())
            val id = CaptureRules.id("com.google.android.youtube", "stable-key")
            assertEquals("New", db.list(500).getJSONObject(0).getString("title"))
            assertEquals("Version 2", db.list(500).getJSONObject(0).getString("text"))
            assertEquals(11, db.list(500).getJSONObject(0).getLong("postedAt"))
            assertEquals(1, db.ack(listOf("not-a-notification")))
            assertEquals(0, db.ack(listOf(id)))
            assertFalse(db.save(isolated, "com.google.android.youtube", "stable-key", 0,
                "YouTube", "Reposted", "Version 3", 21))
            assertEquals(0, db.list(500).length())
        }
    }

    @Test fun existingVersionOneDatabaseGetsCaptureTableWithoutRemovingLegacyRows() {
        reset()
        // Old PR #1 used the same database filename and helper version but a different table.
        base.openOrCreateDatabase("notification_capture_test.db", Context.MODE_PRIVATE, null).use { old ->
            old.execSQL("CREATE TABLE notifications (legacy_id TEXT PRIMARY KEY)")
            old.execSQL("INSERT INTO notifications(legacy_id) VALUES ('kept')")
            old.version = 1
        }
        NotificationDb(isolated, "notification_capture_test.db").use { db ->
            assertTrue(db.save(isolated, "com.google.android.gm", "legacy-case", 0,
                "Gmail", "Synthetic title", "Synthetic text", 123L))
            assertEquals(1, db.list(500).length())
            db.readableDatabase.rawQuery("SELECT legacy_id FROM notifications", null).use { legacy ->
                assertTrue(legacy.moveToFirst())
                assertEquals("kept", legacy.getString(0))
                assertEquals(1, legacy.count)
            }
        }
    }

    @Test fun capsUnimportedAndImportedRows() {
        reset()
        NotificationDb(isolated, "notification_capture_test.db").use { db ->
            for (i in 0 until 1003) {
                db.save(isolated, "com.google.android.gm", "mail-$i", 0, "Gmail", "Title", "Text", i.toLong() + 1)
            }
            assertEquals(500, db.list(500).length())
            val first = db.list(500).getJSONObject(0)
            assertEquals(4, first.getLong("postedAt"))
            val ids = db.list(500)
            db.ack((0 until ids.length()).map { ids.getJSONObject(it).getString("id") })
            val rest = db.list(500)
            db.ack((0 until rest.length()).map { rest.getJSONObject(it).getString("id") })
            // The native store retains at most 500 imported copies even after 1000 acknowledgements.
            val count = db.readableDatabase.rawQuery(
                "SELECT COUNT(*) FROM captured_notifications WHERE imported = 1", null
            ).use { it.moveToFirst(); it.getInt(0) }
            assertEquals(500, count)
            assertEquals(0, db.list(500).length())
        }
    }
    @Test fun pictureEncodingIsBoundedAndTextSurvivesMissingMedia() {
        val bitmap = Bitmap.createBitmap(1400, 1200, Bitmap.Config.ARGB_8888)
        val pixels = IntArray(1400 * 1200)
        val random = Random(62)
        for (i in pixels.indices) pixels[i] = (0xff shl 24) or random.nextInt(0x1000000)
        bitmap.setPixels(pixels, 0, 1400, 0, 0, 1400, 1200)
        val image = CaptureMedia.encode(bitmap, "picture")
        if (image != null) {
            assertTrue(image.base64.length <= 400 * 1024)
            val raw = Base64.decode(image.base64, Base64.NO_WRAP)
            val options = android.graphics.BitmapFactory.Options().apply { inJustDecodeBounds = true }
            android.graphics.BitmapFactory.decodeByteArray(raw, 0, raw.size, options)
            assertTrue(maxOf(options.outWidth, options.outHeight) <= 720)
        }
        reset()
        NotificationDb(isolated, "notification_capture_test.db").use { db ->
            assertTrue(db.save(isolated, "com.google.android.gm", "no-picture", 0,
                "Gmail", "Text stays", "No picture", 44L, null))
            assertEquals("Text stays", db.list(10).getJSONObject(0).getString("title"))
            assertFalse(db.list(10).getJSONObject(0).has("mediaB64"))
        }
    }

    @Test fun existingCapturedTableGetsMediaColumnsWithoutWipingRows() {
        reset()
        base.openOrCreateDatabase("notification_capture_test.db", Context.MODE_PRIVATE, null).use { old ->
            old.execSQL("""CREATE TABLE captured_notifications (
                id TEXT PRIMARY KEY, package_name TEXT NOT NULL, app_label TEXT NOT NULL,
                title TEXT NOT NULL, text TEXT NOT NULL, url TEXT NOT NULL DEFAULT '',
                posted_at INTEGER NOT NULL, imported INTEGER NOT NULL DEFAULT 0)""")
            old.execSQL("""INSERT INTO captured_notifications
                (id,package_name,app_label,title,text,url,posted_at,imported)
                VALUES ('notification:old','com.google.android.gm','Gmail','Old','Still here','',3,0)""")
            old.version = 1
        }
        NotificationDb(isolated, "notification_capture_test.db").use { db ->
            assertEquals("Old", db.list(10).getJSONObject(0).getString("title"))
            db.readableDatabase.rawQuery("PRAGMA table_info(captured_notifications)", null).use { cursor ->
                val columnNames = mutableSetOf<String>()
                val name = cursor.getColumnIndexOrThrow("name")
                while (cursor.moveToNext()) columnNames.add(cursor.getString(name))
                assertTrue("media_kind" in columnNames)
                assertTrue("media_b64" in columnNames)
            }
            val icon = CaptureMedia.Encoded("appIcon", Base64.encodeToString(byteArrayOf(1, 2, 3), Base64.NO_WRAP))
            assertTrue(db.save(isolated, "com.google.android.gm", "icon-new", 0,
                "Gmail", "With icon", "Body", 10L, icon))
            assertTrue(db.list(10).getJSONObject(1).has("mediaB64"))
            // Re-opening the version-one DB is idempotent and retains old rows.
        }
        NotificationDb(isolated, "notification_capture_test.db").use { reopened ->
            assertEquals(2, reopened.list(10).length())
        }
    }

}
