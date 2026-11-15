package com.hany.alrawi

import android.content.Intent
import android.provider.Settings
import androidx.core.app.NotificationManagerCompat
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import org.json.JSONArray
import org.json.JSONObject
import java.lang.ref.WeakReference
import java.text.Collator

@CapacitorPlugin(name = "NotificationCapture")
class NotificationCapturePlugin : Plugin() {
    companion object {
        private var active: WeakReference<NotificationCapturePlugin>? = null

        @JvmStatic
        fun publish() {
            val plugin = active?.get() ?: return
            plugin.activity?.runOnUiThread { plugin.notifyListeners("captureReceived", JSObject()) }
        }
    }

    override fun load() {
        active = WeakReference(this)
    }

    @PluginMethod
    fun isListenerEnabled(call: PluginCall) {
        val enabled = NotificationManagerCompat.getEnabledListenerPackages(context).contains(context.packageName)
        call.resolve(JSObject().put("enabled", enabled))
    }

    @PluginMethod
    fun openListenerSettings(call: PluginCall) {
        try {
            val intent = Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            context.startActivity(intent)
            call.resolve()
        } catch (_: Exception) {
            call.reject("Could not open notification settings")
        }
    }

    @PluginMethod
    fun getCapturePackages(call: PluginCall) {
        call.resolve(JSObject().put("packages", JSONArray(CaptureRules.packages(context))))
    }

    @PluginMethod
    fun setCapturePackages(call: PluginCall) {
        val items = call.getArray("packages") ?: return call.reject("Missing packages")
        val packages = (0 until items.length()).mapNotNull { i ->
            (items.opt(i) as? String)
        }
        val saved = CaptureRules.setPackages(context, packages)
        call.resolve(JSObject().put("packages", JSONArray(saved)))
    }

    @PluginMethod
    fun listLaunchableApps(call: PluginCall) {
        val launcher = Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_LAUNCHER)
        val manager = context.packageManager
        @Suppress("DEPRECATION")
        val found = manager.queryIntentActivities(launcher, 0)
        val compare = Collator.getInstance()
        val apps = found.mapNotNull { entry ->
            val name = entry.activityInfo?.packageName ?: return@mapNotNull null
            if (name == context.packageName) return@mapNotNull null
            name to (entry.loadLabel(manager)?.toString()?.takeIf { it.isNotBlank() } ?: name)
        }.distinctBy { it.first }.sortedWith { a, b ->
            compare.compare(a.second, b.second).takeIf { it != 0 } ?: a.first.compareTo(b.first)
        }
        call.resolve(JSObject().put("apps", JSONArray().also { output ->
            apps.forEach { (name, label) ->
                output.put(JSONObject().put("packageName", name).put("label", label))
            }
        }))
    }

    @PluginMethod
    fun listCaptured(call: PluginCall) {
        val limit = (call.getInt("limit") ?: 500).coerceIn(0, 500)
        try {
            val items = NotificationDb(context).use { it.list(limit) }
            call.resolve(JSObject().put("items", items))
        } catch (_: Exception) {
            call.reject("Could not read captured notifications")
        }
    }

    @PluginMethod
    fun ackImported(call: PluginCall) {
        val items = call.getArray("ids") ?: return call.reject("Missing ids")
        val ids = (0 until items.length()).mapNotNull { items.opt(it) as? String }
        try {
            val remaining = NotificationDb(context).use { it.ack(ids) }
            call.resolve(JSObject().put("remaining", remaining))
        } catch (_: Exception) {
            call.reject("Could not acknowledge captured notifications")
        }
    }

    @PluginMethod
    fun openApp(call: PluginCall) {
        val name = call.getString("packageName") ?: return call.reject("Missing package name")
        try {
            val intent = context.packageManager.getLaunchIntentForPackage(name)
                ?: return call.reject("App cannot be opened")
            context.startActivity(intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
            call.resolve()
        } catch (_: Exception) {
            call.reject("App cannot be opened")
        }
    }
}
