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

## Revival feature branch: Android notification inbox

This implementation adds an Inbox for Android notifications and durable RSS,
Gmail, and YouTube source items, preserving the paper/ink theme and EN/AR/RTL
reader. Android notifications are captured by a native Kotlin listener and
written directly to on-device SQLite, rather than depending on the WebView
being open. Web-sourced items are kept in local IndexedDB. Google sources
require real OAuth credentials; no mock integrations are used.

Use npm run build:capacitor to build and sync the Android native project;
npm run build remains the Next.js web/PWA build. Build prerequisites, Google
setup and device tests (pending before release) are documented at
[Revival verification](docs/revival-verification.md).
