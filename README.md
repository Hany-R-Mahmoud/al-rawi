# Al-Rawi

Al-Rawi is a bilingual, local-first **Android notification Inbox** with optional
links, notes, explicit Android sharing and secondary RSS reading. On Android,
the owner chooses the apps whose *new, eligible* notifications are captured.
Notification text and bounded pictures stay in the phone's private SQLite queue
and IndexedDB; dismissal from the Android shade does not delete saved items.
No Google account connection is involved in notification capture. The web/PWA
cannot access other apps' notifications, but can save links and read RSS feeds.

Reading subscriptions, categories, language, and preferences remain local-first.
Fresh RSS articles and extracted HTML are held in memory for the session.

## Quick start

```bash
npm install
npm run dev
```

Open the local URL printed by Next.js, usually `http://localhost:3000`.

## Main commands

| Command | Purpose |
|---|---|
| `npm run dev` | Start the development server. |
| `npm run lint` | Run the configured ESLint checks. |
| `npx tsc --noEmit` | Run the TypeScript compiler without emitting files. |
| `npm run build` | Create a production build. |
| `npm run start` | Serve a completed production build. |
| `npm run doctor` | Run the optional React Doctor check. |

The test script covers focused library tests; there is no conventional test directory.

## What is implemented

- Landing page at `/` and the **Inbox-first** workspace at `/reader`. Mobile and desktop navigation: Inbox, Saved, Reading, Settings.
- English and Arabic UI with RTL document direction and article direction detection.
- Android-only user-selected notification capture, with bounded on-device pictures/icons and search/read/save/done/archive in Inbox.
- Android Share plus manual links/notes in Inbox; no notifications uploaded to cloud.
- Starter RSS catalog, manual feed URLs, categories, search, refresh, and delete.
- OPML import/export from Settings.
- Same-origin server routes for public RSS fetching and article extraction.
- Legacy Arabic encoding normalization, Readability extraction, and HTML sanitization.
- Light, dark, and system theme preferences.
- Supplied Al-Rawi brand artwork, including a dark-mode contrast variant, is used
  in the app chrome, favicon/app icons, social-share previews, and Vercel Web
  Analytics integration.
- Installable PWA experience with production-only shell caching, Android/iOS
  install guidance, dismissal recovery, and embedded-browser fallbacks.

Earlier versions of the app had no account system, database, environment-variable
contract, cron worker, or server-side feed store. The optional Al-Rawi web account and
manual **RSS-only** backup integration is on `main`, with Google OAuth hosted by the app. Captured notifications and pictures are never included in RSS backup.
The older implementation brief in
[`064-rss-reader-web.md`](064-rss-reader-web.md) describes capabilities that are
not part of the current RSS architecture, including a separate article read-later queue and an IndexedDB RSS offline cache. The Inbox has its own Saved filter.

## Inbox: Android notification capture

The Android test APK can retain notifications from owner-chosen apps after they are cleared from the shade. YouTube and Gmail are selected by default; Android Notification Access must be granted explicitly and apps can be switched on or off in Settings → Captured apps. The native SQLite queue survives a closed WebView and imports into the same IndexedDB Inbox on app open; its saved, done, read and archive controls are unchanged. Notification content stays on-device and is not logged or uploaded. Web/PWA never requests Android notification access. Explicit Share → Al-Rawi and RSS fetching remain separate.

## Privacy and freshness

- Feed subscriptions are persisted in `localStorage` under the app’s reader key.
- Article lists and extracted article content are memory-only; the Content Hub inbox's read/saved states persist in local IndexedDB.
- Refreshing a feed replaces that feed’s current in-memory articles.
- Feed and article URLs pass through same-origin routes that accept public
  HTTP(S) targets, limit redirects and response size, and block private-network
  hosts.
- RSS and extracted HTML are sanitized before rendering.

## Documentation

- [Overview](docs/overview.md)
- [Architecture](docs/architecture.md)
- [Tech stack](docs/tech-stack.md)
- [Project structure](docs/project-structure.md)
- [Local development](docs/local-development.md)
- [Key flows](docs/key-flows.md)
- [Onboarding](docs/onboarding.md)
- [AI agent guide](docs/ai-agent-guide.md)
- [Team decisions](docs/team-decisions/README.md)
- [Portfolio source of truth](docs/portfolio.json)

## Portfolio snapshot

- Status: showcase
- Category: Web
- Source of truth: [`docs/portfolio.json`](docs/portfolio.json)

## Privacy-first Content Hub (Android and Web)

Al-Rawi organizes **source content** and optionally notifications from owner-selected Android apps. Follow
RSS/Atom feeds and GitHub public releases, or explicitly save a link or note. Gmail and YouTube reach the Inbox only through notifications from their apps. Items have independent
Read/Unread and Saved/Done/Archived states. Opening an Inbox card shows an
in-app view if the source permits it or a link to the original.

Android supports user-granted, package-scoped notification capture with an on-device pre-import SQLite queue. Android also receives user-initiated Share -> Al-Rawi text/URL intents;
Web uses a paste action. The Android app never connects to Gmail or YouTube accounts; selected notifications are device-only. The separate optional Al-Rawi web sign-in and manual RSS backup are unchanged.

Follow the [Content Hub privacy and device guide](docs/revival-verification.md)
before installing a new debug APK.

### Android APK from the terminal (no Android Studio UI)

Install Node.js, JDK 21 and Android SDK Platform 36 with Build Tools 36.
Set JAVA_HOME and ANDROID_HOME (or configure android/local.properties).

Run these commands from the repository root:

~~~bash
npm ci
npm run android:apk
~~~

The **android:apk** command builds the static Next.js app, runs Capacitor
sync for the native Android plugins, compiles Kotlin/Java with the Gradle
wrapper, and produces:

~~~text
artifacts/al-rawi-full-test.apk
~~~

To install on an Android phone with USB debugging enabled:

~~~bash
adb devices
adb install -r artifacts/al-rawi-full-test.apk
~~~

This is a **debug-signed APK for testing**, not a release build or Play Store
package. No Google source OAuth client ID is required. Uninstalling an existing
build can delete local data, so do not uninstall casually. See the
[device acceptance guide](docs/revival-verification.md).

### Hero image quality

The previous highly compressed 4 KB Hero was replaced by two newly generated
full-resolution editorial photographs:

- Desktop/large screens: public/visuals/reading-desk-v2.webp (1448 x 1086).
- Mobile: public/visuals/reading-desk-mobile-v2.webp (1122 x 1402).

Both use the existing Paper & Ink aesthetic. New filenames prevent stale
browser image optimization caches. They are shipped in both the web and
Capacitor Android builds; the Android app needs rebuilding to include them.

## Optional web account and manual RSS backup

Google login for the web uses app-hosted Better Auth and an optional **manual** RSS backup/restore feature. Public RSS reading stays guest-first and local-first. Each authenticated account has its own user-scoped feed and RSS state records in Neon. Captured notifications and existing legacy Inbox items are **never** uploaded by the RSS backup endpoint.

There is **no automated cross-device sync** and **no Android user-account login** yet. Android notification capture remains independent of the web account. See [integration status and required tests](docs/NEON_ACCOUNT_IMPLEMENTATION_HANDOFF.md).

Historical dependency repairs and verification limits are recorded in the
[integration repair report](docs/NEON_REPAIR_REPORT_2026-10-16.md). Google OAuth
and two-account isolation passed on the dedicated Neon test branch. The
authenticated forged `user_id` backup POST check remains pending before merge
or deployment.

Google web login now uses app-hosted Better Auth at `https://al-rawi-rss.vercel.app/api/auth/callback/google`, reusing the existing `neon_auth` tables and account IDs. The server requires `DATABASE_URL`, `BETTER_AUTH_URL`, `BETTER_AUTH_SECRET`, `GOOGLE_CLIENT_ID`, and `GOOGLE_CLIENT_SECRET`. Production variables are provisioned in Vercel, not in GitHub. Keep local values in the gitignored `.env.local`; never expose secrets in browser variables or untrusted previews. Existing users sign in again after this migration. Full Google login and authenticated backup acceptance on the new flow remain unverified.
