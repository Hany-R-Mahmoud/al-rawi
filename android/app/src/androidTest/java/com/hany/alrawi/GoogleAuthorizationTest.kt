package com.hany.alrawi

import android.content.Intent
import android.net.Uri
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import net.openid.appauth.AuthorizationException
import net.openid.appauth.AuthorizationServiceConfiguration
import org.junit.Assert.*
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class GoogleAuthorizationTest {
    @Test
    fun bothSourcesBuildConsentRequestsWithPkce() {
        val configuration = AuthorizationServiceConfiguration(
            Uri.parse("https://accounts.google.com/o/oauth2/v2/auth"),
            Uri.parse("https://oauth2.googleapis.com/token")
        )
        for (source in listOf("gmail", "youtube")) {
            val scope = "https://www.googleapis.com/auth/$source.readonly"
            val request = GoogleSourcesPlugin.authorizationRequest(configuration, BuildConfig.GOOGLE_ANDROID_CLIENT_ID, scope)
            val uri = request.toUri()
            assertEquals("consent", uri.getQueryParameter("prompt"))
            assertEquals("offline", uri.getQueryParameter("access_type"))
            assertEquals(scope, uri.getQueryParameter("scope"))
            assertEquals("S256", uri.getQueryParameter("code_challenge_method"))
            assertFalse(uri.getQueryParameter("code_challenge").isNullOrBlank())
        }
    }

    @Test
    fun cancellationPayloadReachesCallbackAndReturnsToApp() {
        val instrumentation = InstrumentationRegistry.getInstrumentation()
        val context = instrumentation.targetContext
        instrumentation.startActivitySync(Intent(context, MainActivity::class.java).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
        for ((index, source) in listOf("gmail", "youtube").withIndex()) {
            val callbackMonitor = instrumentation.addMonitor(AuthResultActivity::class.java.name, null, false)
            val callback = GoogleSourcesPlugin.resultIntent(context, source, 900 + index)
            try {
                assertFalse(callback.isImmutable)
                val error = AuthorizationException.fromTemplate(
                    AuthorizationException.GeneralErrors.USER_CANCELED_AUTH_FLOW, null
                )
                callback.send(context, 0, error.toIntent())
                val activity = instrumentation.waitForMonitorWithTimeout(callbackMonitor, 5000)
                assertNotNull("Callback activity must receive AppAuth's payload", activity)
                assertEquals(source, activity.intent.getStringExtra("source"))
                val received = AuthorizationException.fromIntent(activity.intent)
                assertNotNull("Mutable callback must preserve the authorization result", received)
                assertEquals(error.code, received!!.code)
                instrumentation.waitForIdleSync()
                assertTrue("Cancellation callback must finish after returning to Al-Rawi", activity.isFinishing)
            } finally {
                callback.cancel()
                instrumentation.removeMonitor(callbackMonitor)
            }
        }
    }
}
