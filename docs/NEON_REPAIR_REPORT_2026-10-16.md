# Neon integration repair — 2026-10-16

Status: **NOT READY**. Google OAuth and two-account cloud isolation remain
unverified. Android device testing is deferred by the user.

## Repairs

- Update Next.js/eslint-config-next to 16.4.2 and Sharp to 0.35.5; apply
  compatible transitive security fixes in the regenerated lockfile.
- Keep Neon Auth 0.5.0-beta with Better Auth/core 1.6.23, utils 0.4.2,
  better-call 1.3.7 and better-fetch 1.3.1, matching their peer contracts.
  Pin transitive better-auth-ui to 3.3.4: 3.4.0 introduces drifting api-key
  peers and better-call 2.0.2. Al-Rawi uses its own account UI and Neon Next
  exports, not these UI components. Optional Vitest is pinned to 4.1.11 within
  Better Auth's supported peer range.
- Override only xcode's uuid to 11.1.1, retaining its CommonJS v4 API.
- Select the latest 200 RSS records, including archived, before applying the
  backup limit. Previously listInbox(..., 5) meant five pages (250 records),
  not five records; newer private entries could crowd out eligible RSS.
- Add an upload regression test for empty/one/many RSS and 300 newer Gmail
  records. Preserve sign-out navigation while satisfying the new lint rule.
- Correct obsolete notification-capture wording in the APK script.

## Audit

Runtime audit: **0 findings**. Full audit: **5 high findings**, all one
development-only chain: eslint-config-next → @next/eslint-plugin-next →
fast-glob → micromatch → braces.
[Leaf advisory](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm).
Latest published braces is still 3.0.3 and affected. Audit fix with force
suggests Next ESLint 14, an inappropriate downgrade for Next 16.
No warning suppression, legacy-peer-deps, audit exclusions or advisory edits.

## Verification and limits

- Clean install with npm 11.6.2: `npm ci --strict-peer-deps` passed without
  peer-conflict warnings. Deprecation warnings from transitive packages remain.
  `npm ls` confirms a valid Better Auth tree with no api-key package installed.
- Xcode UUID compatibility passed using its real generateUuid method with an
  empty project fixture; no iOS build was performed.
- Lint and TypeScript passed; focused tests passed 25/25.
- Web build passed with explicit non-secret Auth placeholders. Without them,
  it failed because cookies.secret was missing. This does not prove OAuth.
- Capacitor export/sync passed, with the usual static-export headers warning.
- Source review confirms backup GET/POST use the server session ID and SQL
  reads/writes/conflict keys include user_id. This is not a live isolation test.
- Local IndexedDB stays browser/device storage; sign-out does not erase it.
  Cloud account isolation is a separate server boundary.
- No physical-device/configured native Google-source APK claim is made.
- .env.local contents were not inspected or changed. No merge, deployment,
  Google audience change or database mutation occurred.

## Remaining acceptance

1. Supply two intended Google test accounts and configure the testing audience;
   verify consent/callback, session persistence, sign-out, denial and errors.
2. Verify cloud read/write isolation with both accounts and overlapping IDs
   in an authorized test environment.
3. Resolve the braces tooling advisory when a compatible fix exists, or
   explicitly review/accept its exposure.
4. Android device and configured native source testing remain deferred.

<!-- Verification execution group: TOKEN_POLICY_BATCHED_EXECUTION -->
