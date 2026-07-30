# AI Agent Guide

## Read first

- [`README.md`](../README.md)
- [`docs/overview.md`](overview.md)
- [`docs/architecture.md`](architecture.md)
- [`docs/project-structure.md`](project-structure.md)
- [`docs/team-decisions/`](team-decisions/README.md)
- [`AGENTS.md`](../AGENTS.md)

## Safe edit boundaries

- Keep focused documentation and source edits inside the existing project
  structure.
- Preserve the local-first subscription boundary unless the user explicitly
  requests a new persistence architecture.
- Update `docs/portfolio.json` when title, summary, status, category, stack, or
  feature facts change.
- Update architecture and flow docs when durable route, storage, security, or
  workflow behavior changes.

## Risky areas

- `src/lib/public-fetch.ts` and both API routes: public URL validation, SSRF
  protection, redirect limits, timeouts, and response-size limits.
- `src/lib/feed-parser.ts` and `src/lib/content-extractor.ts`: untrusted HTML,
  sanitization, and rendered content.
- `src/lib/encoding-normalizer.ts`: legacy Arabic encodings and direction
  detection.
- `src/app/reader/page.tsx`: browser-only state, refresh replacement behavior,
  and article extraction lifecycle.
- `src/components/language-provider.tsx`: persisted language and RTL document
  direction.

## Verification commands

```bash
npm run lint
npx tsc --noEmit
npm run build
```

The declared test command covers focused library tests. Report the absence of
broader mounted UI and real-device coverage rather than inventing it.

## Rules

- Inspect relevant source and existing docs before editing.
- Read team decisions before durable architecture, API, or workflow changes.
- Do not invent commands, environment variables, services, APIs, or product
  capabilities.
- Use `Unknown / verify` for facts that source and repository configuration do
  not establish.
- Preserve user changes and avoid broad rewrites during documentation work.
