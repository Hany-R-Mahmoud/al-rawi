# Al-Rawi — notification-first product context (2026-11-17)

The core experience is a private, local-first Inbox for new eligible notifications
from Android apps the owner explicitly selects. Notification Access is granted in
Android Settings; the app filter checks the allowlist **before** reading extras.
The user may keep, search, read, save, complete and archive captured items. Image
availability depends on what the original notification contains; the app may
fall back to a large app icon or no media.

**Navigation:** Inbox (first/default), Saved (same store, filtered), Reading
(secondary RSS/Atom/GitHub releases), Settings (capture apps first, then
preferences, account). On Android a cold launch opens the workspace. On web
landing, Open Inbox enters the same workspace. Passive incoming capture may
refresh the Inbox but must not steal navigation; explicit Share enters Inbox.

**Privacy:** all notification text, pictures and app selection stay on-device.
No Google-source OAuth connection or notification cloud upload. Optional Google
login is solely for a **manual RSS-only** backup on the web, not notification
capture. A browser/PWA cannot obtain Android Notification Access. Explicit app
and original URL launches remain user-triggered.

**Design:** Paper & Ink identity, existing brand and photography, EN/AR, RTL,
light/dark/system; simple information hierarchy, one vertical scroller per view.

**Evidence status:** source changes on feature branch need local Next.js tests,
Android instrumentation, viewport review, Android APK build and owner device
acceptance before any merge or deployment.
