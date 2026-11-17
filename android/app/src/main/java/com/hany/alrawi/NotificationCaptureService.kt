package com.hany.alrawi

import android.app.Notification
import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import java.util.concurrent.Executors

/** Notification Access is user-granted in Android Settings; unchosen apps are never persisted. */
class NotificationCaptureService : NotificationListenerService() {
    private val executor = Executors.newSingleThreadExecutor()

    override fun onNotificationPosted(sbn: StatusBarNotification?) {
        if (sbn != null) enqueue(sbn)
    }

    override fun onListenerConnected() {
        super.onListenerConnected()
        try { activeNotifications?.forEach { enqueue(it) } } catch (_: SecurityException) { }
    }

    private fun enqueue(sbn: StatusBarNotification) {
        executor.execute {
            try {
                // Filter BEFORE reading potentially sensitive extras from other apps.
                if (!CaptureRules.eligible(applicationContext, sbn.packageName, sbn.notification.flags)) return@execute
                val extras = sbn.notification.extras
                val title = extras.getCharSequence(Notification.EXTRA_TITLE)?.toString()
                val body = CaptureRules.text(
                    extras.getCharSequence(Notification.EXTRA_BIG_TEXT)?.toString(),
                    extras.getCharSequence(Notification.EXTRA_TEXT)?.toString()
                )
                val label = try {
                    packageManager.getApplicationLabel(packageManager.getApplicationInfo(sbn.packageName, 0)).toString()
                } catch (_: Exception) { sbn.packageName }
                val media = CaptureMedia.from(applicationContext, sbn.notification, sbn.packageName)
                if (NotificationDb(applicationContext).use { db ->
                    db.save(applicationContext, sbn.packageName, sbn.key, sbn.notification.flags,
                        label, title, body, sbn.postTime, media)
                }) NotificationCapturePlugin.publish()
            } catch (_: Exception) {
                // Never crash the system listener and never log content or an exception message.
            }
        }
    }

    // Dismissal never deletes the on-device pre-import record.
    override fun onNotificationRemoved(sbn: StatusBarNotification?) = Unit

    override fun onDestroy() {
        executor.shutdown()
        super.onDestroy()
    }
}
