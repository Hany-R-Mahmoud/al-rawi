> **SUPERSEDED — 2026-11-15:** The owner removed native Gmail/YouTube account connections. This file is historical evidence only; its OAuth repair is no longer part of Al-Rawi.

# Android Google source connection repair — 14 November 2026

## Result

The local AppAuth request-construction exception and immutable return callback
are corrected. The rebuilt debug APK launches Google's authorization page for
both Gmail and YouTube on Android 16 with 16 KB memory pages. Neither source
is connected end to end: Google rejects the configured Android client with:

```text
Error 400: invalid_request
Custom URI scheme is not enabled for your Android client.
```

This is the observed error in Google's expanded error details for each source,
not an inference from the app's generic error message. No Google account was
entered, no grant was obtained, and no Google Cloud settings were changed.

## Changes

- `GoogleSourcesPlugin.authorizationRequest` uses AppAuth's `setPrompt`
  method for consent. Only `access_type=offline` remains an additional parameter.
  The original implementation threw before opening authorization:
  `Parameter prompt is directly supported via the authorization request builder, use the builder method instead`.
- Explicit callbacks still target the non-exported `AuthResultActivity`.
  Android 12+ now uses `FLAG_MUTABLE`, allowing AppAuth to attach its response
  or cancellation data. Earlier supported Android versions retain their default
  mutable behavior. PKCE, read-only scopes, native token storage and disconnect
  behavior remain unchanged.
- Added two focused Android instrumentation tests exercising the production
  request/callback helpers rather than a duplicate implementation.

## Environment and artifact

- Existing AVD: `Pixel_9_2_16_KB`, Android 16 / API 36, arm64.
- `adb -s emulator-5554 shell getconf PAGE_SIZE` returned `16384`.
- Test data image: `/tmp/alrawi-16kb-test-userdata.img`. The original AVD data
  was not wiped. The temporary emulator needed a restart with 3072 MB of RAM
  after Android stopped responding during Chrome first-run setup.
- Package: `com.hany.alrawi`, version `1.0` / code `1`.
- Rebuilt artifact: `artifacts/al-rawi-full-test.apk` (debug-signed).
- SHA-256: `73137649d359b50a312033b0d7d8f493df7df0911766ce8d70d1393e8b95255e`.
- Build uses the existing public Android OAuth client ID from the previous APK;
  no new credential was created.

## Executed checks

| Scenario | Verdict | Observed result |
|---|---|---|
| Static web export, native sync and APK assembly | PASS | `npm run android:apk`; Gradle `BUILD SUCCESSFUL` |
| Consent request construction for Gmail and YouTube | PASS | Correct prompt, scope, offline parameter and S256 PKCE challenge |
| Return callback for both sources | PASS | Synthetic AppAuth cancellation data reaches the actual callback activity, preserving source and error; activity finishes |
| Gmail Connect from Settings | PASS for launch; BLOCKED for authorization | Opens Google; Google rejects custom URI scheme before account entry |
| Gmail cancellation from Google page | PASS | Returns to source settings, still disconnected |
| YouTube Connect from Settings | PASS for launch; BLOCKED for authorization | Opens Google; same explicit custom URI scheme rejection |
| Successful OAuth return, token exchange, refresh and content import | BLOCKED | No grant issued by Google |
| Physical Android device | NOT RUN | Emulator-only verification |

The return regression uses a synthetic cancellation, not a successful real
Google login. It proves delivery through Android's PendingIntent mechanism;
it does not certify token exchange or account permissions. No 16 KB-specific
app crash was observed in the executed flow.

Commands (JDK 21 and Android SDK environment supplied):

```sh
npm ci --no-audit --no-fund
npm run android:apk
cd android
./gradlew --no-daemon :app:connectedDebugAndroidTest -Pandroid.testInstrumentationRunnerArguments.class=com.hany.alrawi.GoogleAuthorizationTest
```

The focused instrumentation run completed **2 tests, 0 skipped, 0 failed**.
Build log: `/tmp/alrawi-connect-apk-build.log`.
Test log: `/tmp/alrawi-connect-android-tests.log`.
Generated test report: `android/app/build/reports/androidTests/connected/debug/index.html`.
The earlier failed build ran without installed project dependencies and reported
`Cannot find module '@tailwindcss/postcss'`; installing the lockfile dependencies
resolved that environment failure. No dependency versions or lockfile changed.
No broad UI suite or physical-device certification was performed.

## Remaining owner decision

The existing browser-based Android flow depends on a custom URI scheme.
Google disables that option by default and recommends its native Android
Authorization API instead. Enabling the existing client's custom scheme in
Google Auth Platform / Clients / Android client / Advanced settings is a
configuration option, but Google warns about app-impersonation risks.
Do not describe this APK as fully connected without resolving this boundary
and running a real-account authorization/import test.

Recommended next change: migrate source authorization to Google's native
`AuthorizationClient`, preserving separate Gmail/YouTube read-only consent
and the local-only data boundary. That migration is not included in this repair.
Alternatively, the owner can review the existing client's custom-scheme option
and choose to enable it before a real-account retest. Google Cloud project
settings were not inspected through an authenticated session or changed.

References:

- [AppAuth 0.11.1 request builder](https://github.com/openid/AppAuth-Android/blob/0.11.1/library/java/net/openid/appauth/AuthorizationRequest.java)
- [Android PendingIntent contract](https://developer.android.com/reference/android/app/PendingIntent)
- [Google Android client advanced settings](https://support.google.com/googleapi/answer/6158849?hl=en)
- [Google's native source authorization API](https://developer.android.com/identity/authorization)
