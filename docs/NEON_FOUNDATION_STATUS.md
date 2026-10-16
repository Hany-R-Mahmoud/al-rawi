# Al-Rawi Neon Foundation — 2026-10-16

## Provisioned
- Dedicated Neon project `al-rawi`: `lucky-haze-33211470`; Frankfurt AWS; PostgreSQL 17; 0.25 CU.
- Default database branch `main`: `br-dark-queen-baaycjls`.
- Managed Better Auth on main; Auth URL: `https://ep-morning-wind-ba530r1h.neonauth.c-8.eu-central-1.aws.neon.tech/neondb/auth`.
- Added trusted origins `https://al-rawi-rss.vercel.app` and `https://al-rawi-hany-mahmouds-projects.vercel.app`.
- Created application schema `rawi` with `user_preferences`, `user_feeds` and `inbox_items`, all keyed by `user_id`.
- Existing Android Google connector, RSS proxy, local IndexedDB and Android builds were intentionally left untouched.

## Not yet completed / do not claim otherwise
- Codex reports Google Cloud project, separate Web/Android OAuth client IDs and Gmail/YouTube API enablement complete. **No Web Client Secret has been supplied to this agent**, and custom Google provider is NOT configured in Neon (still `shared`). See [Google Cloud integration handoff](GOOGLE_CLOUD_TO_INTEGRATION_HANDOFF.md). OAuth testing remains blocked; Google Console has zero test users in the report.
- Vercel environment variable writes were **blocked** by connector safety checks; do not assume `NEON_AUTH_BASE_URL`, `NEON_AUTH_COOKIE_SECRET` or `DATABASE_URL` are installed.
- Web auth client, login UI, protected API handlers, server-side SQL authZ and app cloud sync have **not yet been implemented**.
- Android account sign-in flow has not been implemented; Android GoogleSourcesPlugin is for opt-in Gmail/YouTube sources.
- No code build/device test or production deployment has been performed. The container cannot clone GitHub due to network DNS restrictions.
- Existing schema tables are NOT a secure user API on their own. They have application-level `user_id` columns, **not** row-level security policies; access must only be through authenticated server endpoints deriving user identity from a verified session and applying `WHERE user_id = ...` on every operation. Never expose privileged `DATABASE_URL` to the browser or Android.

## Next ChatGPT implementation sequence (Google Cloud project exists, custom provider pending)
1. Have the local Codex session save the Web secret privately to `.env.local`, verify it is gitignored; add Google test users. Configure the **custom** Google provider in Neon securely with Web client ID + secret (Neon still shows shared Google). Never paste secrets into GitHub/chat.
2. Add `@neondatabase/auth` and Postgres server driver as needed with tested lockfile.
3. For Next.js 16 web runtime, implement Neon-auth same-origin handlers and login/logout/session UI, while ensuring the Capacitor static-export build excludes server routes and cannot emit browser-breaking imports.
4. Provision server-only Vercel envs in appropriate scopes: `NEON_AUTH_BASE_URL`, strong `NEON_AUTH_COOKIE_SECRET`, pooled `DATABASE_URL` (plus public variables only when required). Never commit or log secrets. Use isolated preview credentials/DB branches if previews are deployed.
5. Implement strict authenticated user endpoints for feeds/items/preferences, and an explicit local-to-cloud import/migration flow that does not erase local data.
6. Design native-safe Android account authentication separately from Gmail/YouTube source consent; test the full APK on a device.
7. Validate sign-in/sign-out/session persistence, cross-user isolation, RSS and Android regression, and only then consider deployment/merge.

## Related handoff
- [GOOGLE_CLOUD_TO_INTEGRATION_HANDOFF.md](GOOGLE_CLOUD_TO_INTEGRATION_HANDOFF.md) contains Google project/client IDs, exact callback URL, restrictions, safe secret handling instructions, remaining steps and verification status.

## User expectations
New work in a feature branch / PR, stop before merge/deploy; no GitHub Actions. Provide evidence, not only configuration claims.

## Codex follow-up — 2026-10-16
- Google Cloud Web client remains intact, but its original Web Client Secret is no longer retrievable in Google Console. Codex did **not** add a replacement secret; `.env.local` was left absent; the local checkout on `main` was clean.
- Neon Auth Google provider was independently rechecked and is still **shared**, not custom. No sign-in test has been run.
- **Do not create a new OAuth client.** With explicit user approval, use Google Cloud **Add secret** on the existing Web client and enter the new secret directly into the Neon Auth custom Google provider using a secure UI. A local `.env.local` copy is **not needed** by Neon Managed Auth.
- OAuth app remains External/Testing with no test users reported by Codex; the intended test Google account must be added before acceptance testing.
- See [the updated Google Cloud → integration handoff](GOOGLE_CLOUD_TO_INTEGRATION_HANDOFF.md). No secrets should be committed, printed or pasted into chat.

## Integration progress — 2026-10-16, 14:45 Cairo (after Codex handoff)

**Externally verified:** Neon Auth Google provider is **standard** with the correct Web client ID and redacted secret; production Vercel environment has `NEON_AUTH_BASE_URL`, encrypted `NEON_AUTH_COOKIE_SECRET`, encrypted pooled `DATABASE_URL` (separate restricted `rawi_app` role). Checked this role can SELECT from `rawi.user_feeds`. The Google OAuth app still needs a confirmed test user.

**Code committed only on `feat/neon-auth-foundation`:** Web sign-in, auth callback+proxy, Neon same-origin auth API, account Settings, manual RSS-only backup/restore API scoped by authenticated user ID, and Android static-export build-script exclusions. The existing guest-first reader and native Gmail/YouTube code remain accessible, but regression testing is still pending.

**Blocking tasks:** `package.json` now includes Neon SDK dependencies but **`package-lock.json` has NOT been regenerated** because remote large-file writes were blocked. `npm ci` will fail until a local `npm install` updates the lock. No dependencies, build, tests, Google login, or physical Android tests could run in this sandbox. No merge or Vercel deployment has been executed. Production env values are present but inert until code is deployed with approval. Preview env values were intentionally not provisioned.

**Next:** Follow [NEON_ACCOUNT_IMPLEMENTATION_HANDOFF.md](NEON_ACCOUNT_IMPLEMENTATION_HANDOFF.md) for lockfile regeneration on the local Mac, type/lint/build tests, Google test user, OAuth full login checks, and Android verification. The original static informational paragraphs earlier in this document are historical as of the initial foundation milestone and should not be treated as the latest status.
