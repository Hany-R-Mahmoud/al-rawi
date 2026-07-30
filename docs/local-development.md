# Local Development

## Requirements

- Node.js and npm compatible with the dependency lockfile.
- A network connection is needed to install dependencies and fetch public RSS
  or article URLs while using the reader.

The repository does not pin a Node.js version: `Unknown / verify`.

## Setup

```bash
npm install
```

## Run

```bash
npm run dev
```

Use the local URL printed by Next.js, normally `http://localhost:3000`.

## Verify

```bash
npm run lint
npx tsc --noEmit
npm run build
```

There is no `npm test` script or conventional test directory. `npm run doctor`
is available as an optional React Doctor check.

## Environment

No application environment variables are required or documented. `.env*` files
are ignored by `.gitignore`; do not add secrets to the repository.

Vercel Web Analytics is mounted automatically on Vercel deployments. Enable Web
Analytics in the Vercel project dashboard after the first deployment; local
development does not load the hosted analytics script.

## Troubleshooting

- Feed refresh fails: confirm the feed URL is public HTTP(S), reachable from the
  server, and returns RSS/Atom XML within the route’s size and timeout limits.
- Article extraction fails: confirm the URL returns HTML and that the source has
  a readable article body.
- Subscriptions disappear: they are browser-local; clearing site storage or
  changing browser profiles removes the saved feed list.
- Arabic content looks wrong: check the article’s detected direction and source
  encoding; legacy encoding support is implemented in
  `src/lib/encoding-normalizer.ts`.
