# Onboarding

## First-day reading path

1. [`README.md`](../README.md)
2. [`docs/overview.md`](overview.md)
3. [`docs/project-structure.md`](project-structure.md)
4. [`docs/local-development.md`](local-development.md)
5. [`docs/key-flows.md`](key-flows.md)
6. [`DESIGN.md`](../DESIGN.md)
7. [`docs/team-decisions/README.md`](team-decisions/README.md)

## First local run

```bash
npm install
npm run dev
```

Open `/reader`, add a catalog feed, refresh it, select an article, and try the
J/K/O/M//R shortcuts. Use Settings to test language, theme, and OPML behavior.

## Safe first change

Documentation, a translation string in `src/lib/i18n.ts`, or a small presentational
component change is a reasonable first contribution. Run lint, typecheck, and a
production build after source changes.

## Common pitfalls

- Do not assume the original product brief is an implementation specification;
  compare it with `src/` first.
- Do not add a database, auth, cron worker, or offline cache without a durable
  decision and corresponding architecture updates.
- Public URL handling is security-sensitive; preserve validation and resource
  limits when changing feed or article fetching.
- Article content is untrusted HTML. Preserve sanitization before rendering.
- Language and article direction are separate concerns: the UI language changes
  the document direction, while article direction is inferred per article.

## Team decisions

Durable agreements live in [`docs/team-decisions/`](team-decisions/).
