package com.hany.alrawi

import android.content.ContentValues
import android.content.Context
import android.database.sqlite.SQLiteDatabase
import android.database.sqlite.SQLiteOpenHelper
import android.net.Uri
import android.app.Notification
import org.json.JSONArray
import org.json.JSONObject
import java.security.MessageDigest

/** Only the selected packages enter this on-device, bounded pre-import queue. */
object CaptureRules {
    private const val PREFS = "alrawi_capture"
    private const val KEY = "packages_v1"
    private val DEFAULTS = listOf("com.google.android.youtube", "com.google.android.gm")
    private val PACKAGE = Regex("^[A-Za-z][A-Za-z0-9_]*(\\.[A-Za-z][A-Za-z0-9_]*)+$")
    private val LINK = Regex("https?://[^\\s<>\\\"']+")

    fun packages(context: Context): List<String> {
        val raw = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getString(KEY, null)
            ?: return DEFAULTS
        return try {
            val array = JSONArray(raw)
            (0 until array.length()).mapNotNull { array.optString(it).takeIf { p -> PACKAGE.matches(p) } }
                .distinct().take(50)
        } catch (_: Exception) { emptyList() }
    }

    fun setPackages(context: Context, entries: List<String>): List<String> {
        val valid = entries.filter { PACKAGE.matches(it) }.distinct().take(50)
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit()
            .putString(KEY, JSONArray(valid).toString()).commit()
        return valid
    }

    fun eligible(context: Context, packageName: String, flags: Int): Boolean =
        packageName != "com.hany.alrawi" &&
        packages(context).contains(packageName) &&
        flags and Notification.FLAG_ONGOING_EVENT == 0 &&
        flags and Notification.FLAG_GROUP_SUMMARY == 0

    fun text(bigText: String?, normalText: String?): String =
        (bigText?.takeIf { it.isNotBlank() } ?: normalText).orEmpty().trim().take(4000)

    fun title(value: String?): String = value.orEmpty().trim().take(280)

    fun url(text: String): String {
        val candidate = LINK.find(text)?.value?.trimEnd('.', ',', ')', ']') ?: return ""
        return try {
            val parsed = Uri.parse(candidate)
            if (parsed.scheme in listOf("https", "http") && !parsed.host.isNullOrBlank()) candidate else ""
        } catch (_: Exception) { "" }
    }

    fun id(packageName: String, key: String): String {
        val bytes = MessageDigest.getInstance("SHA-256")
            .digest((packageName + "\u0000" + key).toByteArray(Charsets.UTF_8))
        return "notification:" + bytes.joinToString("") { "%02x".format(it.toInt() and 0xff) }
    }
}

class NotificationDb(context: Context, databaseName: String = "notifications.db") : SQLiteOpenHelper(context, databaseName, null, 1) {
    private fun ensureSchema(db: SQLiteDatabase) {
        db.execSQL("""CREATE TABLE IF NOT EXISTS captured_notifications (
            id TEXT PRIMARY KEY, package_name TEXT NOT NULL, app_label TEXT NOT NULL,
            title TEXT NOT NULL, text TEXT NOT NULL, url TEXT NOT NULL DEFAULT '',
            posted_at INTEGER NOT NULL, imported INTEGER NOT NULL DEFAULT 0,
            media_kind TEXT, media_b64 TEXT)""")
        val columns = mutableSetOf<String>()
        db.rawQuery("PRAGMA table_info(captured_notifications)", null).use { cursor ->
            val nameIndex = cursor.getColumnIndexOrThrow("name")
            while (cursor.moveToNext()) columns.add(cursor.getString(nameIndex))
        }
        if ("media_kind" !in columns) db.execSQL("ALTER TABLE captured_notifications ADD COLUMN media_kind TEXT")
        if ("media_b64" !in columns) db.execSQL("ALTER TABLE captured_notifications ADD COLUMN media_b64 TEXT")
        db.execSQL("CREATE INDEX IF NOT EXISTS idx_captured_posted ON captured_notifications(posted_at)")
        db.execSQL("CREATE INDEX IF NOT EXISTS idx_captured_imported ON captured_notifications(imported, posted_at)")
    }

    override fun onCreate(db: SQLiteDatabase) = ensureSchema(db)

    override fun onOpen(db: SQLiteDatabase) {
        super.onOpen(db)
        ensureSchema(db)
    }
    override fun onUpgrade(db: SQLiteDatabase, oldVersion: Int, newVersion: Int) {
        // Schema version 1 is normative; do not destroy captured data on upgrade.
    }

    /** Primitives can be exercised by instrumentation without a live notification. */
    fun save(context: Context, packageName: String, key: String, flags: Int,
             label: String, rawTitle: String?, rawText: String?, postTime: Long,
              media: CaptureMedia.Encoded? = null): Boolean {
        if (!CaptureRules.eligible(context, packageName, flags)) return false
        val title = CaptureRules.title(rawTitle)
        val body = CaptureRules.text(null, rawText)
        if (title.isBlank() && body.isBlank()) return false
        val id = CaptureRules.id(packageName, key)
        val db = writableDatabase
        db.beginTransaction()
        try {
            val existing = db.rawQuery("SELECT imported FROM captured_notifications WHERE id = ?", arrayOf(id))
                .use { if (it.moveToFirst()) it.getInt(0) else null }
            if (existing == 1) {
                db.setTransactionSuccessful()
                return false
            }
            if (existing == 0) {
                val update = ContentValues().apply {
                    put("title", title); put("text", body); put("url", CaptureRules.url(body))
                    if (media != null) { put("media_kind", media.kind); put("media_b64", media.base64) }
                }
                db.update("captured_notifications", update, "id = ?", arrayOf(id))
            } else {
                val values = ContentValues().apply {
                    put("id", id); put("package_name", packageName)
                    put("app_label", label); put("title", title); put("text", body)
                    put("url", CaptureRules.url(body))
                    put("posted_at", if (postTime > 0) postTime else System.currentTimeMillis())
                    if (media != null) { put("media_kind", media.kind); put("media_b64", media.base64) }
                    put("imported", 0)
                }
                db.insertOrThrow("captured_notifications", null, values)
                trim(db, 0, 1000)
                trim(db, 1, 500)
            }
            db.setTransactionSuccessful()
            return true
        } finally { db.endTransaction() }
    }

    private fun trim(db: SQLiteDatabase, imported: Int, cap: Int) {
        val count = db.rawQuery("SELECT COUNT(*) FROM captured_notifications WHERE imported = $imported", null)
            .use { if (it.moveToFirst()) it.getInt(0) else 0 }
        val excess = count - cap
        if (excess > 0) db.execSQL("""DELETE FROM captured_notifications WHERE id IN
            (SELECT id FROM captured_notifications WHERE imported = $imported
             ORDER BY posted_at ASC, id ASC LIMIT $excess)""")
    }

    fun list(limit: Int): JSONArray {
        val result = JSONArray()
        readableDatabase.rawQuery("""SELECT id,package_name,app_label,title,text,url,posted_at,media_kind,media_b64
            FROM captured_notifications WHERE imported = 0
            ORDER BY posted_at ASC, id ASC LIMIT ${limit.coerceIn(0,500)}""", null).use { c ->
            while (c.moveToNext()) result.put(JSONObject().apply {
                put("id", c.getString(0)); put("packageName", c.getString(1))
                put("appLabel", c.getString(2)); put("title", c.getString(3))
                put("text", c.getString(4)); put("url", c.getString(5))
                put("postedAt", c.getLong(6))
                if (!c.isNull(7) && !c.isNull(8)) {
                    put("mediaKind", c.getString(7)); put("mediaB64", c.getString(8))
                }
            })
        }
        return result
    }

    fun ack(ids: List<String>): Int {
        val db = writableDatabase
        db.beginTransaction()
        try {
            ids.filter { it.startsWith("notification:") }.distinct().forEach { id ->
                val values = ContentValues().apply { put("imported", 1) }
                db.update("captured_notifications", values, "id = ?", arrayOf(id))
            }
            trim(db, 1, 500)
            val count = db.rawQuery("SELECT COUNT(*) FROM captured_notifications WHERE imported = 0", null)
                .use { if (it.moveToFirst()) it.getInt(0) else 0 }
            db.setTransactionSuccessful()
            return count
        } finally { db.endTransaction() }
    }
}
