# Al-Rawi — isolated build/security validation (2026-10-16)

**Feature branch:** `feat/neon-auth-foundation` | [Draft PR #5](https://github.com/Hany-R-Mahmoud/al-rawi/pull/5)

## Verified in temporary Vercel Sandbox

Vercel Sandbox was created with a **public, read-only clone of this feature branch**, 1 vCPU, Node.js 24.21.0, npm 11.19.0, **no production environment secrets**. A fake nonworking cookie secret, localhost database URL and the public Neon Auth URL were used strictly for Next.js compilation and localhost guest/anonymous HTTP tests. This was **not a Vercel deployment**.

- `npm install --no-audit --no-fund`: PASS; regenerated `package-lock.json` locally in the sandbox.
- `npm ci --no-audit --no-fund`: PASS with that regenerated lockfile.
- `npm run lint`: PASS.
- `npx tsc --noEmit`: PASS.
- `npm test`: **24/24 PASS**, including 5 origin-security tests added in this iteration.
- `npm run build`: PASS (Next.js 16.2.12, auth and backup routes present).
- `npm run build:capacitor`: PASS (static output and Capacitor sync). Confirmed `src/app/api`, `src/app/auth`, and `src/proxy.ts` restored after export.
- Anonymous localhost web smoke tests after final code change:
  - `GET /reader` -> **200** (guest accessible).
  - `GET /auth/sign-in` -> **200**.
  - `GET /api/account/backup` -> **401** without session.
  - `POST /api/account/backup` with matching Origin but no session -> **401**.
  - `POST /api/account/backup` with foreign Origin -> **403**.
- **Bug found and fixed:** Next.js canonicalized the request URL to `localhost` while the user-facing `Host` was `127.0.0.1`, resulting in an incorrect 403 for a legitimate same-origin POST. New `src/lib/server-origin.ts`, `server-origin.test.ts`, and guarded handler allow the matching request Host while still rejecting cross-site origins.

## Remaining blockers — NOT ready to merge/deploy

1. **The regenerated `package-lock.json` is NOT committed to GitHub.** Both GitHub connector large-file writes and anonymous sandbox git push were unavailable (the sandbox has no GitHub write credentials). The checked-in lockfile remains stale and **`npm ci` will fail on the branch checkout until a local agent runs `npm install` and commits the lockfile**. The working generated file existed only inside the temporary test sandbox and is discarded when the sandbox is stopped.
2. npm install / `npm ls` reported **transitive Better Auth peer version conflicts** (e.g. `@better-auth/core@1.7.x` vs `better-auth@1.6.23`, `better-call` mismatches). Despite a passing install, TypeScript, unit and build suite, this needs deliberate package version review against the current Neon-auth SDK/Neon docs before production release; avoid arbitrary transitive overrides.
3. **No Google end-to-end login test.** Google Auth Platform remains External/Testing with no confirmed test users. The Neon custom/standard Google provider was configured, but a real account login and session restore are still unverified.
4. **No real per-user cloud persistence test** (no authenticated account in this sandbox), no account A/B isolation integration test, no consent-flow test.
5. **No full Android APK build or physical device test.** The Capacitor static export and sync passed; Android Gradle build and native credential checks were not performed.
6. No automatic sync / Android account sign-in has been implemented. RSS backup/restore is optional and manual.
7. Production env values were configured on Vercel earlier. **No deployment or merge was performed**; `main` remains unchanged.

## Next Codex/local validation instructions

Work only on existing branch `feat/neon-auth-foundation` and [PR #5](https://github.com/Hany-R-Mahmoud/al-rawi/pull/5).

```bash
git fetch origin feat/neon-auth-foundation
git switch feat/neon-auth-foundation
npm install
git add package-lock.json
git commit -m "chore(deps): refresh Neon Auth lockfile"
npm ci
npm run lint
npx tsc --noEmit
npm test
npm run build
npm run build:capacitor
```

Review peer-version warnings and run the actual `npm run android:apk` build and device checks with the separately configured Google Android client when feasible. Push on the **same branch**, then stop. No GitHub Actions, merge, deployment, unrelated project changes, code-review comment fixes, or secret commits. `npm install` must be run with network access; verify the local `.env.local` remains ignored and private. Report command results and commit SHA.

**Important:** the sandbox validation shows the code can compile and anonymous requests are protected; it does **not** prove Google authentication or authorized multiuser backup works.
