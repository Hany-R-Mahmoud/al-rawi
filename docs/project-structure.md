# Project Structure

```txt
al-rawi/
├── src/app/                 Next.js routes, layout, and global styles
│   └── api/                 Server route handlers for feed and article fetches
├── src/components/          Feature components, providers, and UI primitives
├── src/hooks/               Client interaction hooks
├── src/lib/                 Parsing, fetching, local state, i18n, and types
├── public/                  Static brand, icon, and manifest assets
├── docs/                    Portfolio facts and repo-owned documentation
├── skills/                  Project-local skill material
├── DESIGN.md                Visual and accessibility design notes
├── 064-rss-reader-web.md    Original product/build brief
└── package.json             Scripts and dependencies
```

## Important paths

| Path | Purpose |
|---|---|
| `src/app/page.tsx` | Root route entry; delegates to the landing page. |
| `src/app/landing/page.tsx` | Landing page. |
| `src/app/reader/page.tsx` | Main reader workspace and state orchestration. |
| `src/app/api/feed/route.ts` | Public feed fetch and parse endpoint. |
| `src/app/api/articles/extract/route.ts` | Public article extraction endpoint. |
| `src/components/settings-dialog.tsx` | Theme/language settings and OPML import/export. |
| `src/components/feed-discovery-dialog.tsx` | Catalog, presets, and manual feed entry. |
| `src/lib/public-fetch.ts` | SSRF and resource-limit boundary. |
| `src/lib/feed-parser.ts` | Feed parsing and HTML sanitization. |
| `src/lib/content-extractor.ts` | Readability-based article extraction. |
| `src/lib/local-reader.ts` | Local subscription storage. |
| `src/components/brand-logo.tsx` | Shared Al-Rawi logo used by landing and reader chrome. |
| `public/brand/rawi2*.png` | Light and dark source brand artwork used for the app logo variants. |
| `docs/portfolio.json` | Apex Yard structured portfolio source of truth. |

## Entry points

- `/`: landing page.
- `/reader`: client-side RSS reader.
- `GET /api/feed?url=<public-feed-url>`: parsed feed JSON.
- `POST /api/articles/extract` with `{ "url": "..." }`: extracted article JSON.

## Ignore as source

`.next/`, `node_modules/`, build output, caches, and TypeScript incremental
artifacts are generated or local-only. The `legacy/` directory is empty in the
current workspace; `supabase/` contains no application source files.
