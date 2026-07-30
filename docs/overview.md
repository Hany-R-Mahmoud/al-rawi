# Overview

## Purpose

Al-Rawi is a bilingual, local-first RSS reader for collecting public feeds and
reading their articles in a focused three-pane workspace. Feed subscriptions
and preferences are stored in the browser. Feed results and extracted article
content are fetched on demand and kept in memory for the current session.

## Current user experience

- `/` presents the bilingual landing page.
- `/reader` provides feed navigation, an article list, and a reader pane.
- Users can add feeds from the starter catalog, enter a public RSS URL, or
  import OPML from Settings.
- Users can search the current in-memory article list, refresh feeds, mark
  articles read/unread, open the original article, and remove feeds.
- English/Arabic language selection changes document language and direction;
  article language and direction are inferred from article text.
- Light, dark, and system themes are available.

## Runtime components

| Component | Source | Responsibility |
|---|---|---|
| Landing page | `src/app/landing/page.tsx` | Product entry page and navigation to the reader. |
| Reader page | `src/app/reader/page.tsx` | Client state, feed refresh, filtering, article selection, and layout. |
| Feed route | `src/app/api/feed/route.ts` | Fetches and parses a public RSS/Atom resource. |
| Article route | `src/app/api/articles/extract/route.ts` | Fetches public HTML and returns sanitized Readability content. |
| Browser state | `src/lib/local-reader.ts`, `src/components/language-provider.tsx` | Persists feed subscriptions and language preference locally. |

## Explicit current boundaries

The source does not currently contain authentication, a database, a scheduled
worker, server-side subscription storage, IndexedDB caching, or a read-later
queue. Those capabilities appear in the older product brief
[`064-rss-reader-web.md`](../064-rss-reader-web.md) and should be treated as
future scope, not current behavior.

## Unknowns

- Production hosting, domain, and deployment workflow: `Unknown / verify`.
- Supported browser matrix and minimum Node.js version: `Unknown / verify`.
