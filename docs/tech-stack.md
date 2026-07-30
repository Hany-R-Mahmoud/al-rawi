# Tech Stack

| Area | Tooling | Evidence |
|---|---|---|
| Language | TypeScript | `tsconfig.json`, `.ts` and `.tsx` sources |
| Runtime | Node.js route runtime; browser client | `runtime = "nodejs"` in both API routes |
| Framework | Next.js `16.2.12`, App Router | `package.json`, `src/app/` |
| UI | React `19.2.4`, Tailwind CSS `4` | `package.json`, `src/app/globals.css` |
| Package manager | npm | `package-lock.json`, npm scripts |
| Build | Next.js build | `npm run build` |
| Lint | ESLint 9 with Next core-web-vitals and TypeScript config | `eslint.config.mjs` |
| Tests | No declared test tool or test script | `package.json`, repository layout |

## Important libraries

- `rss-parser`: RSS/Atom feed parsing.
- `iconv-lite`: legacy encoding decoding, including Windows-1256 and
  ISO-8859-6 paths.
- `@mozilla/readability`: main-content extraction from article HTML.
- `jsdom`: XML/HTML document parsing in server-side utilities.
- `next-themes`: light/dark/system theme state.
- Radix UI and Base UI packages: accessible UI primitives used by components.
- `lucide-react`: interface icons.
- `@vercel/analytics`: Vercel Web Analytics mounted in the root layout.

## Configuration

No application environment variables, database client, Docker configuration,
CI workflow, or deployment configuration was found. Node.js version pinning is
also `Unknown / verify`.
