package com.hany.alrawi

import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import java.util.concurrent.Executors

/** Runs without WebView: native SQLite receives every delivered notification. */
class CaptureService : NotificationListenerService() {
    private val worker = Executors.newSingleThreadExecutor()

    override fun onNotificationPosted(sbn: StatusBarNotification) {
        store(sbn)
    }

    override fun onListenerConnected() {
        super.onListenerConnected()
        // Recover notifications still present after Android reconnects the listener.
        try { activeNotifications?.forEach(::store) } catch (_: SecurityException) { }
    }

    private fun store(sbn: StatusBarNotification) {
        worker.execute {
            try {
                if (NotificationDb(applicationContext).save(sbn)) {
                    NotificationCapturePlugin.signalNewNotification()
                }
            } catch (_: Exception) {
                // Never log sensitive notification text (including in release).
            }
        }
    }

    override fun onDestroy() {
        worker.shutdown()
        super.onDestroy()
    }
}
