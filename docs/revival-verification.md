# Al-Rawi Content Hub: privacy, build and device acceptance

Al-Rawi is a privacy-first Content Hub with optional, explicitly scoped Android notification capture. Device sharing and real Google account acceptance MUST be tested before shipping. A successful APK build does not prove Play Protect approval or working OAuth.

## What users get

- Web and Android: public RSS/Atom feeds, including blogs, podcasts and GitHub public release feeds; saved links and notes.
- Android: user-initiated Share -> Al-Rawi for plain text and URLs. Optional Notification Access captures only owner-selected app packages (YouTube and Gmail by default).
- Android optional Google OAuth: selected Gmail newsletter label previews and YouTube subscriptions. Requires real Android OAuth client ID and an eligible account.
- Unified Inbox: All, Unread, Read, Saved, Done, Archived and Search. Read/unread is independent of Saved/Done.
- Item detail: full RSS article when the existing protected backend can extract it; optional on-demand Gmail plain-text email body; YouTube click-to-play privacy-enhanced embed; and Open Original link. Some source pages offer only a preview.

## Scoped native notification capture

Android's `NotificationCaptureService` listens only after the owner grants Notification Access. The allowlist defaults to YouTube and Gmail; the owner can switch either off, add other launchable apps, or leave the list empty. Every posted notification re-reads the list and skips Al-Rawi itself, ongoing notifications, group summaries and blank notifications. Selected titles and text are capped, URLs are validated, and notification IDs deduplicate reposts. Clearing a shade notification does not delete its stored row.

`NotificationDb` queues notifications in the app-private `notifications.db` (maximum 1,000 pending and 500 imported copies). The `NotificationCapture` bridge imports records into the existing IndexedDB Inbox and acknowledges them only after IndexedDB commits; Imported rows cannot overwrite saved/read state on repost. Captured contents stay on-device, without notification-content logging, background cloud uploads or server sync. The optional capture list and Notification Access are independent from Google OAuth. The explicit Share → Al-Rawi path is unchanged.

The Android build is a sideloaded debug test APK: no Play Store availability, Play Protect bypass, or automatic acceptance is claimed. Real Gmail and YouTube notification checks, including dismissal and installation over the existing APK, belong to the owner on a real phone. Android can stop or restrict listener delivery; a missed system delivery cannot be retroactively recovered once removed from the shade.

## Privacy and Google permission disclosure

Gmail OAuth uses gmail.readonly, a Google **restricted** scope. Its technical ability covers the whole mailbox, even though Al-Rawi imports from the label the user selects. The label filter is app behavior, NOT Google-enforced least-privilege. Gmail metadata is also restricted, and cannot provide email bodies. Full Gmail plain-text body is downloaded when an item is opened, not continuously.

YouTube uses the separate youtube.readonly scope for subscriptions and latest uploads; quota limits apply. Tokens remain encrypted on device using Android Keystore and never pass to WebView. Do not commit tokens, credentials or secrets.

Google refresh only happens manually or at most once every six hours when the Android app is open or reopened. No WorkManager background sync has been implemented; do not describe it as real-time delivery while closed. Disconnect clears locally stored grants, but already imported entries stay on device. Users can revoke the Google grant from Google Account settings.

There is no cloud synchronization of Inbox items. Data is per device/browser and is lost on uninstall or clearing app/browser data. Android backup is disabled.

## Actual connected sources

- Any public RSS/Atom URL: Web and Android, using the existing secure feed proxy.
- GitHub **public repository releases only**: an Atom feed; no private GitHub account notifications.
- YouTube and Gmail: real but Android-only Google OAuth connectors; without an Android Google OAuth Client ID they are unconfigured, not mocked.
- Android 16 / 16 KB retest (14 November 2026): the rebuilt connectors open Google, but the configured client rejects the custom URI scheme. Full source authorization/import is blocked pending a provider configuration decision or native authorization migration. See [repair and test evidence](ANDROID_OAUTH_16KB_2026-11-14.md).
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

- [ ] Inspect merged APK manifest: scoped NotificationCaptureService declared with BIND_NOTIFICATION_LISTENER_SERVICE, enabled only after Android permission grant.
- [ ] Install the new APK WITHOUT disabling Play Protect; report exact warning if any remains.
- [ ] Upgrade over the existing test APK; verify the app retains captured items, shows scoped onboarding when needed, and does not delete notifications.db.
- [ ] Share a URL from Chrome/GitHub/YouTube via Share -> Al-Rawi, both cold and warm app starts; verify it persists after closing/reopening.
- [ ] Test repeated shares, shared text, and failure/retry before native queue ACK.
- [ ] Paste links/notes in Web and Android; confirm local data is searchable and saved.
- [ ] Verify read/unread/saved/done/archive persistence, and refresh does not erase user choices.
- [ ] Open full RSS article where available; verify fallback preview and Open Original when extraction fails.
- [ ] With configured real Google accounts, connect Gmail and YouTube, select a Gmail label, refresh, read an email, watch a video after explicit playback, and disconnect.
- [ ] Check EN/AR, RTL, mobile, desktop, theme, OPML, Reader and PWA behavior.
- [ ] Verify only enabled app packages are stored; exclude ongoing/group summaries and confirm shade dismissal survives.

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
