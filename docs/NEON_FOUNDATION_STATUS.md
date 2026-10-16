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
