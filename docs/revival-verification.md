# Al-Rawi Content Hub: privacy, build and device acceptance

Al-Rawi is a privacy-first Content Hub with optional, explicitly scoped Android notification capture. Device sharing and notification capture need real-device acceptance. A successful APK build does not prove Play Protect approval.

## What users get

- Web and Android: public RSS/Atom feeds, including blogs, podcasts and GitHub public release feeds; saved links and notes.
- Android: user-initiated Share -> Al-Rawi for plain text and URLs. Optional Notification Access captures only owner-selected app packages (YouTube and Gmail by default).
- Android: Gmail and YouTube notifications arrive from the selected apps only; no account connection.
- Unified Inbox: All, Unread, Read, Saved, Done, Archived and Search. Read/unread is independent of Saved/Done.
- Item detail: full RSS article when the existing protected backend can extract it; stored previews of legacy Gmail items; YouTube click-to-play privacy-enhanced embed; and Open Original link. Some source pages offer only a preview.

## Scoped native notification capture

Android's `NotificationCaptureService` listens only after the owner grants Notification Access. The allowlist defaults to YouTube and Gmail; the owner can switch either off, add other launchable apps, or leave the list empty. Every posted notification re-reads the list and skips Al-Rawi itself, ongoing notifications, group summaries and blank notifications. Selected titles and text are capped, URLs are validated, and notification IDs deduplicate reposts. Clearing a shade notification does not delete its stored row.

`NotificationDb` queues notifications in the app-private `notifications.db` (maximum 1,000 pending and 500 imported copies). The `NotificationCapture` bridge imports records into the existing IndexedDB Inbox and acknowledges them only after IndexedDB commits; Imported rows cannot overwrite saved/read state on repost. Captured contents stay on-device, without notification-content logging, background cloud uploads or server sync. The capture list and Android Notification Access do not connect to any Google account. The explicit Share → Al-Rawi path is unchanged.

The Android build is a sideloaded debug test APK: no Play Store availability, Play Protect bypass, or automatic acceptance is claimed. Real Gmail and YouTube notification checks, including dismissal and installation over the existing APK, belong to the owner on a real phone. Android can stop or restrict listener delivery; a missed system delivery cannot be retroactively recovered once removed from the shade.

## Device-only privacy

Al-Rawi has no Android Gmail or YouTube account connector and stores no new Google
source tokens. Only notifications from owner-selected installed apps are captured,
and they are not uploaded. Previously imported Gmail/YouTube Inbox items remain
locally readable, but their source data is not refreshed from any account.
There is no cloud synchronization of captured Inbox items. Android backup is disabled.

## Actual content sources

- Any public RSS/Atom URL: Web and Android, using the existing secure feed proxy.
- GitHub **public repository releases only**: an Atom feed; no private GitHub account notifications.
- Other apps: user-initiated Share Sheet or manual paste; optional notification capture only from installed apps selected in the allowlist.

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

No Android Google client ID or source account consent is needed. The debug APK is not a Play Store release APK.

## Physical phone acceptance checklist (pending)

- [ ] Inspect merged APK manifest: scoped NotificationCaptureService declared with BIND_NOTIFICATION_LISTENER_SERVICE, enabled only after Android permission grant.
- [ ] Install the new APK WITHOUT disabling Play Protect; report exact warning if any remains.
- [ ] Upgrade over the existing test APK; verify the app retains captured items, shows scoped onboarding when needed, and does not delete notifications.db.
- [ ] Share a URL from Chrome/GitHub/YouTube via Share -> Al-Rawi, both cold and warm app starts; verify it persists after closing/reopening.
- [ ] Test repeated shares, shared text, and failure/retry before native queue ACK.
- [ ] Paste links/notes in Web and Android; confirm local data is searchable and saved.
- [ ] Verify read/unread/saved/done/archive persistence, and refresh does not erase user choices.
- [ ] Open full RSS article where available; verify fallback preview and Open Original when extraction fails.
- [ ] Grant Notification Access, choose Gmail and YouTube apps, dismiss their notifications, and verify saved/read/done/archive states.
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
