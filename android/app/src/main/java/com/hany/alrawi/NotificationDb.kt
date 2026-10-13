package com.hany.alrawi

import android.content.ContentValues
import android.content.Context
import android.database.sqlite.SQLiteDatabase
import android.database.sqlite.SQLiteOpenHelper
import android.service.notification.StatusBarNotification
import android.app.Notification
import org.json.JSONArray
import org.json.JSONObject
import java.security.MessageDigest

/** Listener writes here BEFORE trying to tell the WebView; survives activity/process death. */
class NotificationDb(context: Context) : SQLiteOpenHelper(context.applicationContext, "notifications.db", null, 1) {
    override fun onCreate(db: SQLiteDatabase) {
        db.execSQL("""
            CREATE TABLE notifications (
                id TEXT PRIMARY KEY,
                package_name TEXT NOT NULL,
                title TEXT NOT NULL,
                body TEXT NOT NULL,
                posted_at INTEGER NOT NULL,
                status TEXT NOT NULL DEFAULT 'new'
            )
        """.trimIndent())
        db.execSQL("CREATE INDEX idx_notifications_posted ON notifications(posted_at DESC)")
        db.execSQL("CREATE INDEX idx_notifications_status ON notifications(status, posted_at DESC)")
    }

    override fun onUpgrade(db: SQLiteDatabase, oldVersion: Int, newVersion: Int) {
        // Never silently drop the archive; introduce explicit migrations for future versions.
        throw IllegalStateException("No database migration for $oldVersion to $newVersion")
    }

    @Synchronized
    fun save(notification: StatusBarNotification): Boolean {
        if (notification.packageName == "com.hany.alrawi") return false
        val extras = notification.notification.extras ?: return false
        val title = extras.getCharSequence(Notification.EXTRA_TITLE)?.toString()?.trim().orEmpty()
        val body = extras.getCharSequence(Notification.EXTRA_BIG_TEXT)?.toString()?.trim()
            ?.takeIf { it.isNotBlank() }
            ?: extras.getCharSequence(Notification.EXTRA_TEXT)?.toString()?.trim().orEmpty()
        if (title.isBlank() && body.isBlank()) return false
        val idSource = notification.packageName + "\u0000" + notification.postTime + "\u0000" + title
        val id = MessageDigest.getInstance("SHA-256").digest(idSource.toByteArray(Charsets.UTF_8))
            .joinToString("") { "%02x".format(it) }
        val row = ContentValues().apply {
            put("id", "notification:$id")
            put("package_name", notification.packageName)
            put("title", title)
            put("body", body)
            put("posted_at", notification.postTime)
            put("status", "new")
        }
        return writableDatabase.insertWithOnConflict(
            "notifications", null, row, SQLiteDatabase.CONFLICT_IGNORE
        ) != -1L
    }

    fun updateStatus(id: String, status: String): Boolean {
        require(status in setOf("new", "saved", "done", "archived"))
        val values = ContentValues().apply { put("status", status) }
        return writableDatabase.update("notifications", values, "id = ?", arrayOf(id)) > 0
    }

    fun list(query: String, view: String, limit: Int, offset: Int): JSONArray {
        val filters = mutableListOf<String>()
        val args = mutableListOf<String>()
        val search = query.trim()
        if (search.isNotEmpty()) {
            val escaped = search.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
            filters.add("(title LIKE ? ESCAPE '\\' OR body LIKE ? ESCAPE '\\')")
            args.add("%$escaped%")
            args.add("%$escaped%")
        } else {
            when (view) {
                "missed" -> { filters.add("status = 'new' AND posted_at < ?"); args.add((System.currentTimeMillis() - 48L * 60 * 60 * 1000).toString()) }
                "saved" -> filters.add("status = 'saved'")
                "archived" -> filters.add("status = 'archived'")
                "today" -> filters.add("status != 'archived'")
                "all" -> {}
                else -> throw IllegalArgumentException("Unknown inbox view")
            }
        }
        val selection = if (filters.isEmpty()) null else filters.joinToString(" AND ")
        val rows = JSONArray()
        readableDatabase.query(
            "notifications", arrayOf("id", "package_name", "title", "body", "posted_at", "status"),
            selection, args.toTypedArray(), null, null, "posted_at DESC",
            limit.coerceIn(1, 201).toString() + " OFFSET " + offset.coerceAtLeast(0)
        ).use { cursor ->
            while (cursor.moveToNext()) {
                rows.put(JSONObject().apply {
                    put("id", cursor.getString(0))
                    put("source", "notification")
                    put("packageName", cursor.getString(1))
                    put("title", cursor.getString(2))
                    put("text", cursor.getString(3))
                    put("receivedAt", cursor.getLong(4))
                    put("status", cursor.getString(5))
                })
            }
        }
        return rows
    }
}
