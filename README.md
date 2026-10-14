# Al-Rawi

Al-Rawi is a bilingual, local-first RSS reader. Feed subscriptions, categories,
language, and reading preferences stay in the browser; fresh articles and
extracted article HTML are held in memory for the current session.

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

- Landing page at `/` and the reader workspace at `/reader`.
- English and Arabic UI with RTL document direction and article direction detection.
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

The app has no account system, database, environment-variable contract, cron
worker, or server-side feed store. The older implementation brief in
[`064-rss-reader-web.md`](064-rss-reader-web.md) describes capabilities that are
not present in the current source, including a read-later queue and IndexedDB
offline cache.

## Privacy and freshness

- Feed subscriptions are persisted in `localStorage` under the app’s reader key.
- Article lists, read state, and extracted article content are memory-only.
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

Al-Rawi organizes **source content**, not other apps' notifications. Follow
RSS/Atom feeds, GitHub public releases, YouTube subscriptions or a chosen
Gmail label, or explicitly save a link or note. Items have independent
Read/Unread and Saved/Done/Archived states. Opening an Inbox card shows an
in-app view if the source permits it or a link to the original.

Android no longer has NotificationListenerService or Notification Access.
The old sensitive captured-notification database is removed on app upgrade.
Android instead receives only user-initiated Share -> Al-Rawi text/URL intents;
Web uses a paste action. Google source connectors are still Android-only and
require real OAuth; no credentials, mock records or cross-device sync are
included. Gmail readonly is a restricted scope that is broader than the
chosen label; see the privacy guide for the precise boundary.

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
artifacts/al-rawi-debug.apk
~~~

To install on an Android phone with USB debugging enabled:

~~~bash
adb devices
adb install -r artifacts/al-rawi-debug.apk
~~~

This is a **debug-signed APK for testing**, not a release build or Play Store
package. If you want the Gmail/YouTube native OAuth connectors, supply a real
Google Android OAuth client ID at build time (example for macOS/Linux):

~~~bash
ALRAWI_GOOGLE_ANDROID_CLIENT_ID=YOUR_ANDROID_CLIENT_ID npm run android:apk
~~~

Without that ID, these Google sources report unconfigured; RSS and the native
sharing and the local Inbox can still be tested. The debug certificate's SHA-1 must
match your Google Cloud Android OAuth client configuration. Uninstalling an
existing build (e.g. to resolve different signing keys) deletes locally stored
data, so do not uninstall casually. See the
[device acceptance guide](docs/revival-verification.md).

### Hero image quality

The previous highly compressed 4 KB Hero was replaced by two newly generated
full-resolution editorial photographs:

- Desktop/large screens: public/visuals/reading-desk-v2.webp (1448 x 1086).
- Mobile: public/visuals/reading-desk-mobile-v2.webp (1122 x 1402).

Both use the existing Paper & Ink aesthetic. New filenames prevent stale
browser image optimization caches. They are shipped in both the web and
Capacitor Android builds; the Android app needs rebuilding to include them.
