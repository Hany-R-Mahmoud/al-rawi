# Al-Rawi Content Hub: privacy, build and device acceptance

This branch changes the product from Notification History to a privacy-first Content Hub. Device sharing and real Google account acceptance MUST be tested before shipping. A successful APK build is not proof of Play Protect approval or working OAuth.

## What users get

- Web and Android: public RSS/Atom feeds, including blogs, podcasts and GitHub public release feeds; saved links and notes.
- Android: user-initiated Share -> Al-Rawi for plain text and URLs. Al-Rawi never asks to read other apps' notifications.
- Android optional Google OAuth: selected Gmail newsletter label previews and YouTube subscriptions. Requires real Android OAuth client ID and an eligible account.
- Unified Inbox: All, Unread, Read, Saved, Done, Archived and Search. Read/unread is independent of Saved/Done.
- Item detail: full RSS article when the existing protected backend can extract it; optional on-demand Gmail plain-text email body; YouTube click-to-play privacy-enhanced embed; and Open Original link. Some source pages offer only a preview.

## Removed security-sensitive behavior

- Removed the Android NotificationListenerService and the NotificationCapture Capacitor plugin, including the BIND_NOTIFICATION_LISTENER_SERVICE permission in the manifest.
- On Android app startup, MainActivity deletes the old notifications.db SQLite archive to erase historical notification content from previous versions.
- IndexedDB schema v2 deletes any legacy notification items inadvertently copied into the web database.
- Never read, receive, or archive bank alerts, OTP notifications, WhatsApp notifications or other apps' notifications in the background.

The new SharedContentPlugin receives only ACTION_SEND plain text/HTML shared by user choice, and queues it privately on device until IndexedDB confirms persistence. Shared content is then acknowledged and removed from the queue. The app has internet permission for network sources.

No Android listener offers a permission-free way of reading other apps' notifications. This redesign intentionally gives up that feature. A new APK still needs to be tried without disabling Google Play Protect.

## Privacy and Google permission disclosure

Gmail OAuth uses gmail.readonly, a Google **restricted** scope. Its technical ability covers the whole mailbox, even though Al-Rawi imports from the label the user selects. The label filter is app behavior, NOT Google-enforced least-privilege. Gmail metadata is also restricted, and cannot provide email bodies. Full Gmail plain-text body is downloaded when an item is opened, not continuously.

YouTube uses the separate youtube.readonly scope for subscriptions and latest uploads; quota limits apply. Tokens remain encrypted on device using Android Keystore and never pass to WebView. Do not commit tokens, credentials or secrets.

Google refresh only happens manually or at most once every six hours when the Android app is open or reopened. No WorkManager background sync has been implemented; do not describe it as real-time delivery while closed. Disconnect clears locally stored grants, but already imported entries stay on device. Users can revoke the Google grant from Google Account settings.

There is no cloud synchronization of Inbox items. Data is per device/browser and is lost on uninstall or clearing app/browser data. Android backup is disabled.

## Actual connected sources

- Any public RSS/Atom URL: Web and Android, using the existing secure feed proxy.
- GitHub **public repository releases only**: an Atom feed; no private GitHub account notifications.
- YouTube and Gmail: real but Android-only Google OAuth connectors; without an Android Google OAuth Client ID they are unconfigured, not mocked.
- Other apps: user-initiated Share Sheet or manual paste. No claim of automatic WhatsApp, Outlook, Slack or Telegram integrations.

## Build from the terminal

Requires Node.js, JDK 21 and Android SDK Platform 36 with Build Tools 36. Set JAVA_HOME and ANDROID_HOME (or android/local.properties).

    npm ci
    npm run lint
    npx tsc --noEmit
    npm test
    npm run build
    npm run android:apk

The last command exports the Next.js static site, syncs Capacitor Android/plugins, compiles native code with the Gradle wrapper and copies a debug-signed APK to artifacts/al-rawi-full-test.apk.

To install with USB Debugging:

    adb devices
    adb install -r artifacts/al-rawi-full-test.apk

For Google source connections, create a real Android OAuth client ID for package com.hany.alrawi and the signing certificate SHA-1 in Google Cloud Console, enable Gmail and YouTube Data API v3, set up consent and testers, then build with:

    ALRAWI_GOOGLE_ANDROID_CLIENT_ID=YOUR_ANDROID_CLIENT_ID npm run android:apk

Do not use a web client secret. The debug APK is not a Play Store release APK.

## Physical phone acceptance checklist (pending)

- [ ] Inspect merged APK manifest: no notification listener service or BIND_NOTIFICATION_LISTENER_SERVICE permission.
- [ ] Install the new APK WITHOUT disabling Play Protect; report exact warning if any remains.
- [ ] Upgrade from the previous version and verify no Notification Access prompt or captured notifications remain.
- [ ] Share a URL from Chrome/GitHub/YouTube via Share -> Al-Rawi, both cold and warm app starts; verify it persists after closing/reopening.
- [ ] Test repeated shares, shared text, and failure/retry before native queue ACK.
- [ ] Paste links/notes in Web and Android; confirm local data is searchable and saved.
- [ ] Verify read/unread/saved/done/archive persistence, and refresh does not erase user choices.
- [ ] Open full RSS article where available; verify fallback preview and Open Original when extraction fails.
- [ ] With configured real Google accounts, connect Gmail and YouTube, select a Gmail label, refresh, read an email, watch a video after explicit playback, and disconnect.
- [ ] Check EN/AR, RTL, mobile, desktop, theme, OPML, Reader and PWA behavior.
- [ ] Verify no device-wide notifications are captured or stored.

## Android native page routing regression (corrected after PR #4 initial APK)

**Root cause:** Capacitor Android's WebViewLocalServer defaults to HTML5 mode.
Requests to extensionless paths such as /reader/ resolve to the root index.html
rather than the pre-rendered out/reader/index.html. The previous automatic
NativeEntryRedirect navigated to /reader/ on every mount, which loaded the
Landing again and immediately redirected. On a local Android-server simulation
of the broken APK this produced 81 main-frame navigations in about 3 seconds,
visible flickering and unusable workspace/language controls.

**Fix:** The landing now stays mounted on normal native launches. Each native
internal link uses an explicit static HTML asset URL (/reader/index.html to
enter, /index.html to return). Browser/PWA navigation still uses Next.js URLs
(/reader and /). Only an actual queued Android Share redirects automatically,
once, directly to /reader/index.html. This also handles a new Share intent
when the Landing Page is already open, by listening for explicit native
shareReceived events. On native start the old PWA service
worker and only its static caches are unregistered/removed; subscriptions,
IndexedDB, reading state and other user data are preserved.

Verification after this fix:
- [x] Native-like browser simulation: stable landing after 3.5 seconds, no
      repeated redirects (previously 81 navigations).
- [x] EN <-> AR produces translated page text and the correct LTR/RTL direction.
- [x] Light/dark toggle works without page reloads.
- [x] Both Open Workspace and Enter your reading space open the real Reader
      from a native-like static export server (Capacitor extensionless
      fallback simulated).
- [x] Browser errors and failed asset responses: zero during this navigation.
- [x] Gradle Android Debug APK compiles with corrected static assets.
- [ ] Physical Android device: verify the same behavior after installing the
      new APK and after upgrading an existing installation.
- [ ] Physical Android Share -> Al-Rawi: confirm a queued share opens Reader.
- [ ] Web/PWA routes: verify in browser on standard Next.js server.

This simulated test validates the actual local-server fallback behavior but
does not emulate every Android WebView / OS condition. Do not merge based
only on a successful APK compilation; run the physical-device checks.
