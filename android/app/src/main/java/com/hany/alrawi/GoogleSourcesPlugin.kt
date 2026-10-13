package com.hany.alrawi

import android.app.PendingIntent
import android.content.Intent
import android.net.Uri
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import net.openid.appauth.AuthorizationRequest
import net.openid.appauth.AuthorizationService
import net.openid.appauth.AuthorizationServiceConfiguration
import net.openid.appauth.ResponseTypeValues
import org.json.JSONObject
import java.io.ByteArrayOutputStream
import java.lang.ref.WeakReference
import java.net.HttpURLConnection
import java.net.URL
import java.net.URLEncoder
import java.util.concurrent.Executors

/** Google OAuth/PKCE. Tokens are encrypted in Android Keystore, never sent to JS. */
@CapacitorPlugin(name = "GoogleSources")
class GoogleSourcesPlugin : Plugin() {
    companion object {
        private val scopes = mapOf(
            "gmail" to "https://www.googleapis.com/auth/gmail.readonly",
            "youtube" to "https://www.googleapis.com/auth/youtube.readonly"
        )
        private var active: WeakReference<GoogleSourcesPlugin>? = null
        fun signalSourceChanged() {
            val plugin = active?.get() ?: return
            plugin.activity?.runOnUiThread { plugin.notifyListeners("sourcesChanged", JSObject()) }
        }
    }

    private val worker = Executors.newSingleThreadExecutor()
    private val configuration = AuthorizationServiceConfiguration(
        Uri.parse("https://accounts.google.com/o/oauth2/v2/auth"),
        Uri.parse("https://oauth2.googleapis.com/token")
    )
    private val clientId get() = BuildConfig.GOOGLE_ANDROID_CLIENT_ID

    override fun load() { active = WeakReference(this) }

    @PluginMethod
    fun status(call: PluginCall) {
        val vault = TokenVault(context)
        val data = JSObject()
        data.put("configured", clientId.isNotBlank())
        data.put("gmail", vault.read("gmail") != null)
        data.put("youtube", vault.read("youtube") != null)
        call.resolve(data)
    }

    @PluginMethod
    fun connect(call: PluginCall) {
        val source = call.getString("source") ?: return call.reject("Missing source")
        val scope = scopes[source] ?: return call.reject("Unknown source")
        if (clientId.isBlank()) return call.reject("Google Android OAuth client ID not configured")
        try {
            val prefix = clientId.removeSuffix(".apps.googleusercontent.com")
            val redirect = Uri.parse("com.googleusercontent.apps." + prefix + ":/oauth2redirect")
            val request = AuthorizationRequest.Builder(
                configuration, clientId, ResponseTypeValues.CODE, redirect
            ).setScope(scope).setAdditionalParameters(
                mapOf("access_type" to "offline", "prompt" to "consent")
            ).build()

            val requestCode = if (source == "gmail") 42 else 43
            fun resultIntent(code: Int) = PendingIntent.getActivity(
                context, code,
                Intent(context, AuthResultActivity::class.java).putExtra("source", source),
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            val service = AuthorizationService(context)
            service.performAuthorizationRequest(request, resultIntent(requestCode), resultIntent(requestCode + 100))
            service.dispose()
            // This resolves only the launch. The source remains disconnected until code exchange completes.
            call.resolve()
        } catch (error: Exception) {
            call.reject("Could not start Google sign-in", error)
        }
    }

    @PluginMethod
    fun disconnect(call: PluginCall) {
        val source = call.getString("source") ?: return call.reject("Missing source")
        if (!scopes.containsKey(source)) return call.reject("Unknown source")
        TokenVault(context).clear(source)
        signalSourceChanged()
        call.resolve()
    }

    @PluginMethod
    fun googleGet(call: PluginCall) {
        val source = call.getString("source") ?: return call.reject("Missing source")
        val address = call.getString("url") ?: return call.reject("Missing URL")
        val parsed = try { Uri.parse(address) } catch (_: Exception) { return call.reject("Invalid URL") }
        val prefix = when (source) {
            "gmail" -> "https://gmail.googleapis.com/gmail/v1/"
            "youtube" -> "https://www.googleapis.com/youtube/v3/"
            else -> return call.reject("Unknown source")
        }
        if (!address.startsWith(prefix) || parsed.scheme != "https") return call.reject("URL not allowed")
        worker.execute {
            try {
                val token = getAccessToken(source)
                val (code, json) = getJson(address, token)
                if (code !in 200..299) call.reject("Google API returned HTTP $code")
                else {
                    val result = JSObject()
                    result.put("data", json)
                    call.resolve(result)
                }
            } catch (_: Exception) {
                call.reject("Google API request failed; check authorization and connectivity")
            }
        }
    }

    @Synchronized
    private fun getAccessToken(source: String): String {
        val vault = TokenVault(context)
        val saved = vault.read(source) ?: throw IllegalStateException("Source disconnected")
        if (saved.optLong("expiresAt", 0) > System.currentTimeMillis() + 60_000L) {
            return saved.getString("accessToken")
        }
        val refresh = saved.optString("refreshToken")
        if (refresh.isBlank()) throw IllegalStateException("Source must reconnect")
        val form = "client_id=" + encode(clientId) +
            "&grant_type=refresh_token&refresh_token=" + encode(refresh)
        val con = (URL("https://oauth2.googleapis.com/token").openConnection() as HttpURLConnection).apply {
            requestMethod = "POST"
            connectTimeout = 10_000
            readTimeout = 15_000
            doOutput = true
            setRequestProperty("Content-Type", "application/x-www-form-urlencoded")
            instanceFollowRedirects = false
        }
        try {
            con.outputStream.use { it.write(form.toByteArray(Charsets.UTF_8)) }
            if (con.responseCode !in 200..299) throw IllegalStateException("Token refresh failed")
            val response = JSONObject(con.inputStream.bufferedReader().use { it.readText() })
            val next = JSONObject()
            next.put("accessToken", response.getString("access_token"))
            next.put("refreshToken", response.optString("refresh_token", refresh))
            next.put("expiresAt", System.currentTimeMillis() + response.optLong("expires_in", 3600) * 1000L)
            vault.save(source, next)
            return next.getString("accessToken")
        } finally { con.disconnect() }
    }

    private fun getJson(address: String, token: String): Pair<Int, String> {
        val con = (URL(address).openConnection() as HttpURLConnection).apply {
            requestMethod = "GET"
            connectTimeout = 10_000
            readTimeout = 15_000
            setRequestProperty("Authorization", "Bearer $token")
            setRequestProperty("Accept", "application/json")
            instanceFollowRedirects = false
        }
        try {
            val status = con.responseCode
            if (status !in 200..299) return Pair(status, "{}")
            val output = ByteArrayOutputStream()
            val buffer = ByteArray(8192)
            con.inputStream.use { input ->
                while (true) {
                    val count = input.read(buffer)
                    if (count < 0) break
                    output.write(buffer, 0, count)
                    if (output.size() > 2_000_000) throw IllegalStateException("Google API response too large")
                }
            }
            return Pair(status, output.toString("UTF-8"))
        } finally { con.disconnect() }
    }

    private fun encode(value: String) = URLEncoder.encode(value, "UTF-8")

    override fun handleOnDestroy() {
        worker.shutdown()
        super.handleOnDestroy()
    }
}
