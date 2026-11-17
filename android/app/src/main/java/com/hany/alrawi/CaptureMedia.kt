package com.hany.alrawi

import android.app.Notification
import android.content.Context
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.drawable.Drawable
import android.graphics.drawable.Icon
import android.os.Build
import android.util.Base64
import java.io.ByteArrayOutputStream

/**
 * Optional media from an already eligible notification. No network access, no logging.
 * Base64 payloads are limited to 400 KiB before crossing the native bridge.
 */
object CaptureMedia {
    data class Encoded(val kind: String, val base64: String)

    private const val MAX_BASE64_CHARS = 400 * 1024
    private const val RETRY_BINARY_BYTES = 350 * 1024

    fun from(context: Context, notification: Notification, packageName: String): Encoded? {
        val extras = notification.extras
        val picture: Bitmap? = try {
            @Suppress("DEPRECATION")
            (extras.getParcelable<Bitmap>(Notification.EXTRA_PICTURE))
        } catch (_: Exception) { null }
        if (picture != null) encode(picture, "picture")?.let { return it }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            val pictureIcon = try { extras.getParcelable(Notification.EXTRA_PICTURE_ICON, Icon::class.java) } catch (_: Exception) { null }
            iconBitmap(context, pictureIcon)?.let { encode(it, "picture") }?.let { return it }
        }

        val largeIcon = try { notification.largeIcon } catch (_: Exception) { null }
        iconBitmap(context, largeIcon)?.let { encode(it, "largeIcon") }?.let { return it }
        val legacyIcon: Bitmap? = try {
            @Suppress("DEPRECATION")
            (extras.getParcelable<Bitmap>(Notification.EXTRA_LARGE_ICON))
        } catch (_: Exception) { null }
        legacyIcon?.let { encode(it, "largeIcon") }?.let { return it }

        val appDrawable = try { context.packageManager.getApplicationIcon(packageName) } catch (_: Exception) { null }
        drawableBitmap(appDrawable)?.let { encode(it, "appIcon") }?.let { return it }
        return null
    }

    private fun iconBitmap(context: Context, icon: Icon?): Bitmap? =
        try { drawableBitmap(icon?.loadDrawable(context)) } catch (_: Exception) { null }

    private fun drawableBitmap(drawable: Drawable?): Bitmap? {
        if (drawable == null) return null
        return try {
            val rawWidth = drawable.intrinsicWidth.takeIf { it > 0 } ?: 192
            val rawHeight = drawable.intrinsicHeight.takeIf { it > 0 } ?: 192
            val ratio = minOf(1f, 720f / maxOf(rawWidth, rawHeight))
            val width = maxOf(1, (rawWidth * ratio).toInt())
            val height = maxOf(1, (rawHeight * ratio).toInt())
            val output = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
            val canvas = Canvas(output)
            drawable.setBounds(0, 0, width, height)
            drawable.draw(canvas)
            output
        } catch (_: Exception) { null }
    }

    /** Also exposed to instrumentation without any notification or account. */
    fun encode(source: Bitmap, kind: String): Encoded? {
        if (source.isRecycled || source.width <= 0 || source.height <= 0) return null
        if (kind !in setOf("picture", "largeIcon", "appIcon")) return null
        return try {
            val picture = kind == "picture"
            val first = scale(source, if (picture) 720 else 192)
            val bytes = compress(first, picture, if (picture) 80 else 100)
            val initial = Base64.encodeToString(bytes, Base64.NO_WRAP)
            if (bytes.size <= RETRY_BINARY_BYTES && initial.length <= MAX_BASE64_CHARS) return Encoded(kind, initial)
            if (!picture) return null
            val second = compress(scale(source, 480), true, 70)
            val retry = Base64.encodeToString(second, Base64.NO_WRAP)
            if (retry.length <= MAX_BASE64_CHARS) Encoded(kind, retry) else null
        } catch (_: Exception) { null }
    }

    private fun scale(bitmap: Bitmap, bound: Int): Bitmap {
        val max = maxOf(bitmap.width, bitmap.height)
        if (max <= bound) return bitmap
        val factor = bound.toFloat() / max
        return Bitmap.createScaledBitmap(
            bitmap,
            maxOf(1, (bitmap.width * factor).toInt()),
            maxOf(1, (bitmap.height * factor).toInt()),
            true
        )
    }

    private fun compress(bitmap: Bitmap, picture: Boolean, quality: Int): ByteArray {
        val bytes = ByteArrayOutputStream()
        val format = if (picture) Bitmap.CompressFormat.JPEG else Bitmap.CompressFormat.PNG
        if (!bitmap.compress(format, quality, bytes)) throw IllegalStateException("Image could not be encoded")
        return bytes.toByteArray()
    }
}
