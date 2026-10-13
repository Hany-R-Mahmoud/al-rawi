# Al-Rawi Revival — device verification and credential handoff

Status: implementation branch only. **Physical-device capture and real Google OAuth MUST be tested before production release.** No mock connection or demo data is included. No GitHub Actions workflows run.

## Architecture

- The existing Next.js web/PWA RSS reader keeps its same-origin API routes and paper/ink theme.
- Android is a Capacitor static export; npm run build:capacitor temporarily moves only the API routes and always restores them in a finally block, and syncs the Android project.
- On Android, CapacitorHttp fetches RSS through the existing production public-fetch backend at https://al-rawi-rss.vercel.app. Confirm this backend before release; its SSRF checks and limits are unchanged.
- The Android NotificationListenerService saves notifications to **native SQLite before** signaling the WebView. Captured notifications survive dismissal and app UI/process death as long as Android delivers them to the listener.
- Native SQLite stores notification titles, text, timestamps, originating apps, and statuses. IndexedDB stores RSS/Gmail/YouTube items and statuses. Search merges them locally.
- Google OAuth uses Android AppAuth/PKCE, with separate read-only scopes per source; tokens are AES-GCM encrypted using Android Keystore and never exposed to the JavaScript bridge. Android backup is disabled.
- Gmail imports header/snippet metadata from a **user-selected Gmail label** (not whole email bodies/attachments); YouTube imports videos from subscribed channels. Imports run only manually or at most every six hours while the app is open/resumed.

## Build

    npm ci
    npm run lint
    npx tsc --noEmit
    npm test
    npm run build
    npm run build:capacitor
    npx cap open android

Native Gradle compile needs JDK 21, Android SDK Platform 36 and Android Studio (or equivalent CLI):

    cd android && ./gradlew assembleDebug

## Real Google setup REQUIRED

1. In Google Cloud Console enable Gmail API and YouTube Data API v3; configure OAuth consent screen, required user/tester list and read-only scopes. Gmail read-only is a restricted scope; Google verification requirements may apply.
2. Create a **Google Android OAuth Client ID** using the Android package com.hany.alrawi and **SHA-1 of the installed APK's signing certificate**. Do not use a web client secret.
3. Provide the public client ID to the Gradle build via an external environment variable: ALRAWI_GOOGLE_ANDROID_CLIENT_ID. Example shell invocation: ALRAWI_GOOGLE_ANDROID_CLIENT_ID=YOUR_ID ./gradlew assembleDebug. Android Studio must also supply the variable to its Gradle process when building there. Rebuild after changing the ID.
4. The AppAuth redirect scheme is automatically derived from the Android client ID: com.googleusercontent.apps.PREFIX:/oauth2redirect. Confirm Google's currently supported redirect scheme/Android client constraints on a device; never switch to an insecure embedded login to bypass an OAuth rejection.
5. In Settings > Connected sources connect Gmail and YouTube with real Google accounts, select an existing newsletter Gmail label and press Refresh now. Verify actual messages and videos appear.
6. **No YouTube API key is needed** for the implemented authenticated Data API requests: OAuth bearer tokens authenticate the subscriptions endpoint. Enable quota and the API in Cloud Console.
7. Disconnect clears the local source grant. For full Google-side revocation, revoke app access from the user's Google Account settings.

Never commit a real token, keystore, client secret, credentials file, .env, or personal notifications.

## Android physical device acceptance — pending

- [ ] Install a newly built APK on a physical Android device; confirm native launch enters the reader and permission onboarding is shown once.
- [ ] Choose Skip. Reader works unchanged and Settings allows access to be enabled later. No aggressive permission re-prompt.
- [ ] Enable notification listener access in Android settings; confirm Al-Rawi reflects permission on return.
- [ ] Generate a real notification (for example, from YouTube). Verify Inbox receives it within seconds, including title/text when Android allows access.
- [ ] Dismiss the notification from Android's shade. Confirm Al-Rawi retains its saved copy.
- [ ] Close/swipe away the app UI, receive a new notification, then reopen and confirm the record was persisted despite no active JavaScript.
- [ ] Reboot; check listener reconnects. Verify saved history and later notifications.
- [ ] Kill/reopen app and verify Save, Done, Archive and Restore persist; search English and Arabic titles/text; confirm Missed means new older than 48 hours.
- [ ] Deny access; RSS remains usable and access can be enabled again in Settings.
- [ ] Test Android 13–16 as available; Android 15+ may redact OTPs and other sensitive data.
- [ ] Use real OAuth consent, test Gmail labels, YouTube subscriptions, token refresh/expiry, disconnect, quotas and error states.
- [ ] Confirm native RSS and article extraction backend calls, including CapacitorHttp transport/CORS.
- [ ] Verify web/PWA build behavior, keyboard shortcuts, feed changes, OPML, desktop/mobile UI, both languages and RTL, light/dark.

## Known limitations

- Force Stop, revoked access, OS/vendor restrictions, powered-off device or lost delivery can cause missing notifications. A dismissed notification from such a gap cannot be reconstructed. No listener can promise 100%.
- The local archive persists **while installed and while app data is retained**, not after uninstall/clear-data. There is no cloud backup or cross-device synchronization.
- Notification text in native SQLite is ordinary local app data, not encrypted like OAuth tokens. Android app sandbox isolation applies but rooted/compromised devices may access it.
- Without a configured real Google Android client ID, the UI shows an unconfigured state. It never fabricates Google connections.
- Up to 500 subscribed YouTube channels and each channel's five latest uploads can be scanned per manual/scheduled sync; no server cron or push integration exists.
- A successful code build does not prove reliability on real Android devices or Google approvals.
