package com.hany.alrawi

import android.content.Intent
import android.provider.Settings
import androidx.core.app.NotificationManagerCompat
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.annotation.CapacitorPlugin
import com.getcapacitor.PluginMethod
import java.lang.ref.WeakReference

@CapacitorPlugin(name = "NotificationCapture")
class NotificationCapturePlugin : Plugin() {
    companion object {
        private var active: WeakReference<NotificationCapturePlugin>? = null
        fun signalNewNotification() {
            val plugin = active?.get() ?: return
            plugin.activity?.runOnUiThread {
                plugin.notifyListeners("notificationReceived", JSObject())
            }
        }
    }

    override fun load() {
        active = WeakReference(this)
    }

    @PluginMethod
    fun isListenerEnabled(call: PluginCall) {
        val enabled = NotificationManagerCompat.getEnabledListenerPackages(context)
            .contains(context.packageName)
        call.resolve(JSObject().put("enabled", enabled))
    }

    @PluginMethod
    fun openListenerSettings(call: PluginCall) {
        try {
            val intent = Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS)
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            context.startActivity(intent)
            call.resolve()
        } catch (error: Exception) {
            call.reject("Cannot open notification access settings", error)
        }
    }

    @PluginMethod
    fun listCaptured(call: PluginCall) {
        try {
            val results = NotificationDb(context).list(
                call.getString("query") ?: "",
                call.getString("view") ?: "today",
                call.getInt("limit") ?: 100,
                call.getInt("offset") ?: 0
            )
            call.resolve(JSObject().put("items", results))
        } catch (error: Exception) {
            call.reject("Could not read notification history", error)
        }
    }

    @PluginMethod
    fun setCapturedStatus(call: PluginCall) {
        val id = call.getString("id") ?: return call.reject("Missing id")
        val status = call.getString("status") ?: return call.reject("Missing status")
        try {
            call.resolve(JSObject().put("updated", NotificationDb(context).updateStatus(id, status)))
        } catch (error: Exception) {
            call.reject("Could not update notification status", error)
        }
    }
}
