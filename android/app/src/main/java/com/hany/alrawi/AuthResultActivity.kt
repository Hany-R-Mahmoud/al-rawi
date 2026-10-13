package com.hany.alrawi

import android.app.Activity
import android.content.Intent
import android.os.Bundle
import net.openid.appauth.AuthorizationResponse
import net.openid.appauth.AuthorizationException
import net.openid.appauth.AuthorizationService
import org.json.JSONObject

/** AppAuth code exchange with PKCE. Tokens never appear in JS or browser URLs. */
class AuthResultActivity : Activity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val source = intent.getStringExtra("source").orEmpty()
        val response = AuthorizationResponse.fromIntent(intent)
        val error = AuthorizationException.fromIntent(intent)
        if (source !in listOf("gmail", "youtube") || response == null || error != null) {
            GoogleSourcesPlugin.signalSourceChanged()
            goBack()
            return
        }
        val authorizationService = AuthorizationService(this)
        authorizationService.performTokenRequest(response.createTokenExchangeRequest()) { result, tokenError ->
            if (result != null && tokenError == null && !result.accessToken.isNullOrBlank()) {
                try {
                    val json = JSONObject()
                    json.put("accessToken", result.accessToken)
                    json.put("refreshToken", result.refreshToken)
                    json.put("expiresAt", result.accessTokenExpirationTime ?: 0L)
                    TokenVault(applicationContext).save(source, json)
                } catch (_: Exception) { /* Disconnected status reported. */ }
            }
            GoogleSourcesPlugin.signalSourceChanged()
            authorizationService.dispose()
            runOnUiThread { goBack() }
        }
    }

    private fun goBack() {
        startActivity(Intent(this, MainActivity::class.java).addFlags(
            Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP
        ))
        finish()
    }
}
