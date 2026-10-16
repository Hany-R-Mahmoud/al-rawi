# Al-Rawi — Neon Auth + User Data Integration Handover

**2026-10-16 | Current branch:** `feat/neon-auth-foundation` | [PR #5](https://github.com/Hany-R-Mahmoud/al-rawi/pull/5)

## Verified live infrastructure

- Neon: `al-rawi` project `lucky-haze-33211470`, branch `main` / `br-dark-queen-baaycjls`.
- Managed Better Auth is provisioned with Google **standard/custom** provider, Google Web Client ID ending `kbh3gkmn.apps.googleusercontent.com`; Neon masks the client secret.
- Production trusted website origins: `https://al-rawi-rss.vercel.app`, `https://al-rawi-hany-mahmouds-projects.vercel.app`.
- Vercel project `al-rawi` has **Production-only** `NEON_AUTH_BASE_URL` (Config), `NEON_AUTH_COOKIE_SECRET` (encrypted), `DATABASE_URL` (encrypted).
- The `DATABASE_URL` uses pooled Neon Postgres with dedicated least-privilege role `rawi_app`. This role has USAGE on `rawi` and SELECT/INSERT/UPDATE/DELETE on existing `rawi` tables, not administrative schema rights. Its ability to SELECT `rawi.user_feeds` was tested.
- The `rawi` schema includes `user_feeds`, `inbox_items` and `user_preferences`. These app tables are NOT browser-accessible and do NOT independently enforce user-level RLS; authorization lives in Next server routes.
- No Google login was tested. Google Auth Platform app is in External / Testing and reportedly has **no test users**.

## App source added to this feature branch

- `src/lib/auth/server.ts` and `src/lib/auth/client.ts`: Managed Neon Auth through the official Next.js wrapper.
- `src/app/api/auth/[...path]/route.ts`: same-origin Auth proxy. `src/proxy.ts`: handles callback session verifier only, not the public reader.
- `src/app/auth/sign-in/page.tsx`: bilingual Google login / guest option; `src/app/auth/callback/page.tsx`: OAuth return to reader.
- `src/components/account-settings.tsx`: account state, log in/out, manual RSS backup/restore. `src/components/settings-dialog.tsx` / `workspace-header.tsx` / reader page: account navigation.
- `src/app/api/account/backup/route.ts`: session-protected GET/POST for user-scoped RSS feeds and reading states; restricts POST by Origin/JSON type and limits size/count; server derives `user_id` from session and scopes every SQL command.
- `src/lib/cloud-backup.ts` + `src/lib/inbox-store.ts`: backup RSS only, explicitly initiated by the user, and merge restored RSS reading states without touching Gmail/YouTube/shared items.
- `scripts/build-capacitor.mjs`: temporarily excludes server-only routes and proxy when statically exporting the Android APK, restoring source files in `finally`. Android account login is **not** implemented. Existing native Gmail/YouTube connectors are unchanged.
- `package.json` now pins `@neondatabase/auth@0.5.0-beta` and `@neondatabase/serverless@0.10.4`.

## CRITICAL blocker: dependency lock not regenerated

**`package-lock.json` on this branch is still outdated. DO NOT run `npm ci`, merge this PR, or deploy until the lock is regenerated and builds are validated.** Attempts to write the 533 KB lock through the remote GitHub file connector were blocked by its safety checks. No runtime dependencies are available in ChatGPT's container, and network DNS for npm is unavailable.

**Codex/local-Mac next steps (must preserve secrets):**

```bash
git fetch origin feat/neon-auth-foundation
git switch feat/neon-auth-foundation
npm install
npm run lint
npx tsc --noEmit
npm test
npm run build
npm run build:capacitor
git status --short
```

Review and fix test, type, lint, web build and Android static-export issues ON THIS SAME FEATURE BRANCH. Commit `package-lock.json` and required code fixes only, push branch and stop; never commit `.env.local`. Do not create or enable GitHub Actions/workflows, merge, or deploy. Before returning to local `main` verify it remains clean; do not force-switch and lose local changes. Builds must not disclose environment variables.

If a test needs backend access, add the required `NEON_AUTH_BASE_URL`, `NEON_AUTH_COOKIE_SECRET` and `DATABASE_URL` to **ignored local** config or use supported secure provisioning. Do not publish secret values in the report. The Google Web Client Secret itself is managed by Neon; local `GOOGLE_WEB_CLIENT_SECRET` is only a separate private backup and is not used by this Next.js wrapper.

## Before anyone can claim sign-in works

1. Add the *actual intended test account* to Google Auth Platform Audience while the Google project remains External / Testing. Contact email is NOT automatically a test user.
2. Verify web sign-in: `/auth/sign-in` → Google consent → Neon callback → app `/auth/callback` → `/reader` with a live session; check reload session persistence, sign-out, error states, denied/bad callbacks.
3. Verify server authorization: unauthenticated `GET /api/account/backup` = 401; unauthenticated POST with matching Origin = 401; mismatched Origin = 403; account A cannot retrieve or overwrite account B's records.
4. Confirm manual RSS backup uploads only feed URLs, titles and RSS reading metadata; no Gmail/YouTube data, shared notes, message bodies, Google OAuth tokens or Android secrets.
5. Verify backup/restore with two distinct web browsers. User-chosen restore merges with local IndexedDB and never silently deletes local inbox.
6. Test guest reader, feed refresh, article extraction, OPML, language and theme, mobile navigation, and unconfigured Android account UI.
7. Validate `npm ci` after lockfile update and build both the Next web app and Android static export. A real Android phone/APK check is required before claiming device compatibility.
8. Confirm preview/test deployment isolation before enabling Preview env. **Never point an untrusted preview build at production data.**
9. Since no authorized deployment has occurred, Google OAuth is **NOT TESTED**, app integration is **NOT LIVE**, and production old version is unaffected.
10. After all checks, request approval for eventual Merge/Deployment; do not do either autonomously.

## Scope limits and architecture decision

- Guest-first/local-first remains the default.
- Cloud backup is optional, manual, and for public RSS metadata/read state only (limit 200 recent RSS items per manual upload; server supports max 500). Content-source access is separate Google authorization.
- Android APK's OAuth clients grant opted-in Gmail/YouTube API access, *not* an Al-Rawi account session. Native Al-Rawi login and cross-device sync for Android need separate secure design/implementation; do not try Google Web OAuth inside an embedded WebView.
- No continuous server polling, push notifications, automated background sync, or account data migration.
