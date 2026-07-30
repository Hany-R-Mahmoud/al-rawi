<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Apex Yard documentation

Read README.md and docs/portfolio.json before changing this project.
Keep portfolio facts source-backed, update the structured document when the repository changes, and write Unknown / verify instead of guessing.

## Read first

For implementation work, read these repo-owned docs in order as needed:

1. `README.md`
2. `docs/overview.md`
3. `docs/architecture.md`
4. `docs/ai-agent-guide.md`
5. `docs/team-decisions/`

## Project commands

```bash
npm install
npm run dev
npm run lint
npx tsc --noEmit
npm run build
```

There is no declared test command or conventional test directory. Report that
fact when behavior changes are made without automated test coverage.

## Repository conventions

- The application lives under `src/` and uses the `@/*` alias for `src/*`.
- Keep feed subscriptions and preferences local-first unless a documented
  architecture decision changes that boundary.
- Treat public URL fetching, encoding normalization, HTML sanitization, and
  bilingual direction handling as risk-sensitive code.
- Preserve user changes and make focused edits. Update `docs/portfolio.json`
  when source-backed portfolio facts change.
- Read `docs/team-decisions/` before changing durable architecture, API, or
  workflow behavior.

## Unknowns

- Node.js version is not pinned by a repository version file or `engines` field:
  `Unknown / verify`.
- CI, deployment configuration, and a Git remote are not defined in the
  current repository: `Unknown / verify`.
