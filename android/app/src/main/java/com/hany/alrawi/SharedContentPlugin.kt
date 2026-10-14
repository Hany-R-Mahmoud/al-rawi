package com.hany.alrawi

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.text.Html
import android.util.Patterns
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import org.json.JSONArray
import org.json.JSONObject
import java.lang.ref.WeakReference
import java.util.UUID

/**
 * Explicit shares only. Does NOT listen to, inspect, or request permission for other apps' notifications.
 * Store shares natively until IndexedDB acknowledges a successful import, even if the WebView is not ready.
 */
@CapacitorPlugin(name = "SharedContent")
class SharedContentPlugin : Plugin() {
    companion object {
        private const val PREFS = "alrawi_explicit_shares"
        private const val QUEUE = "pending_v1"
        private const val MAX_PENDING = 100
        private var active: WeakReference<SharedContentPlugin>? = null

        @JvmStatic
        fun receiveIntent(context: Context, intent: Intent?) {
            if (intent?.action != Intent.ACTION_SEND) return
            if (intent.type != "text/plain" && intent.type != "text/html") return
            val plain = intent.getCharSequenceExtra(Intent.EXTRA_TEXT)?.toString()
                ?: intent.getStringExtra(Intent.EXTRA_HTML_TEXT)?.let {
                    Html.fromHtml(it, Html.FROM_HTML_MODE_LEGACY).toString()
                }
            val body = plain?.trim()?.take(12000).orEmpty()
            val title = intent.getCharSequenceExtra(Intent.EXTRA_SUBJECT)?.toString()?.trim()?.take(280).orEmpty()
            if (body.isBlank() && title.isBlank()) return

            val url = Regex("https?://[^\\s<>\\\"']+").find(body)?.value?.trimEnd('.', ',', ')', ']') ?: ""
            val validatedUrl = try {
                val parsed = Uri.parse(url)
                if (parsed.scheme in listOf("https", "http") && !parsed.host.isNullOrBlank()) url else ""
            } catch (_: Exception) { "" }

            synchronized(SharedContentPlugin::class.java) {
                val preferences = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
                val existing = try { JSONArray(preferences.getString(QUEUE, "[]")) } catch (_: Exception) { JSONArray() }
                val pending = JSONArray()
                for (i in (existing.length() - MAX_PENDING + 1).coerceAtLeast(0) until existing.length()) {
                    pending.put(existing.getJSONObject(i))
                }
                pending.put(JSONObject().apply {
                    put("id", "share:" + UUID.randomUUID().toString())
                    put("title", title.ifBlank {
                        body.lineSequence().firstOrNull().orEmpty().take(140).ifBlank { "Shared item" }
                    })
                    put("text", body)
                    put("url", validatedUrl)
                    put("receivedAt", System.currentTimeMillis())
                })
                preferences.edit().putString(QUEUE, pending.toString()).commit()
            }
            val plugin = active?.get()
            plugin?.activity?.runOnUiThread { plugin.notifyListeners("shareReceived", JSObject()) }
        }
    }

    override fun load() { active = WeakReference(this) }

    @PluginMethod
    fun listPending(call: PluginCall) {
        synchronized(SharedContentPlugin::class.java) {
            val saved = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getString(QUEUE, "[]")
            val items = try { JSONArray(saved) } catch (_: Exception) { JSONArray() }
            call.resolve(JSObject().put("items", items))
        }
    }

    @PluginMethod
    fun ackPending(call: PluginCall) {
        val ids = call.getArray("ids") ?: return call.reject("Missing ids")
        val acknowledged = mutableSetOf<String>()
        for (i in 0 until ids.length()) {
            val id = ids.optString(i)
            if (id.startsWith("share:")) acknowledged.add(id)
        }
        synchronized(SharedContentPlugin::class.java) {
            val preferences = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            val existing = try { JSONArray(preferences.getString(QUEUE, "[]")) } catch (_: Exception) { JSONArray() }
            val remaining = JSONArray()
            for (i in 0 until existing.length()) {
                val item = existing.getJSONObject(i)
                if (!acknowledged.contains(item.optString("id"))) remaining.put(item)
            }
            preferences.edit().putString(QUEUE, remaining.toString()).commit()
            call.resolve(JSObject().put("remaining", remaining.length()))
        }
    }
}
