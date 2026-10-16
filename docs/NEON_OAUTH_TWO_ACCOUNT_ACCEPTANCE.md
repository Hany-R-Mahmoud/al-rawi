# Al-Rawi — Google OAuth + Two-Account Acceptance (2026-10-16)

## Status

**PREPARED — NOT EXECUTED.** The two real Google test-user email addresses were provided privately in the ChatGPT conversation and are **deliberately not committed in this public repository**. Refer to them as **Account A** and **Account B** in committed files/reports. The Codex handover message supplies the addresses directly.

The active application PR is [#5](https://github.com/Hany-R-Mahmoud/al-rawi/pull/5), branch `feat/neon-auth-foundation`, last verified HEAD `b43f672ffa8dc5537ac3131be041ba4c46fc664e`. Keep the PR Draft and do not deploy/merge during acceptance testing.

## Verified separate test backend

A dedicated Neon database/Auth branch was created and read-verified **without changing `main`**:

- Neon project: `al-rawi` — `lucky-haze-33211470`.
- Production/main branch (do not write test data): `br-dark-queen-baaycjls`.
- **Acceptance test branch:** `test-oauth-isolation-20261016` — `br-rapid-king-banc4nvj`.
- Test Managed Auth base URL:
  ```text
  https://ep-weathered-term-baehkgqq.neonauth.c-8.eu-central-1.aws.neon.tech/neondb/auth
  ```
- **Add this second redirect URI** to the **existing Google Web OAuth client** in Google Cloud Console:
  ```text
  https://ep-weathered-term-baehkgqq.neonauth.c-8.eu-central-1.aws.neon.tech/neondb/auth/callback/google
  ```
- Original **main/production** Google callback URI must remain registered and unchanged.
- Test branch Auth was read-verified to report Google provider type `standard` and same existing Web client ID, with credentials redacted; **not evidence of a successful login**.
- Test branch `allow_localhost: true`; `rawi_app` database role exists on the cloned branch.
- On creation, the test branch had **0 Auth users, 0 RSS feeds and 0 Inbox items**.

## Step A — Google Auth Platform, in authenticated Codex browser

1. Open the **existing** Google Cloud project `al-rawi-511808`.
2. Google Auth Platform → Audience → Test users: add the **two accounts from the private handover message**; confirm both are listed. Keep External / **Testing**.
3. Google Auth Platform → Clients → existing **Web application** OAuth Client (ID ends `kbh3gkmn.apps.googleusercontent.com`): register the exact **test** redirect URI listed above **in addition to** the original main redirect URI. Do **not** create a new project, client, secret, or scopes.
4. Confirm existing Android client and Gmail/YouTube APIs/scopes are unchanged. Identity-only Google login must not request Gmail/YouTube permissions.
5. Report test-user count, status and both callbacks; **do not print account secrets, tokens, cookies or passwords**. No screenshots with account-sensitive data.

Official guidance:
- https://support.google.com/cloud/answer/15549945?hl=en
- https://neon.com/docs/auth/guides/configure-domains.md

## Step B — Local *test-only* Next.js environment

Use the local Mac checkout of the existing PR feature branch; preserve uncommitted changes and never overwrite or publish `.env.local`.

- Run the already-verified `npm ci --strict-peer-deps` and start local Next.js.
- Configure ignored local server variables:
  - `NEON_AUTH_BASE_URL`: **test** Auth URL shown above, not the main Auth URL.
  - `DATABASE_URL`: **test branch** pooled connection URL for the dedicated `rawi_app` role (obtain securely from Neon; never print/commit).
  - `NEON_AUTH_COOKIE_SECRET`: independent strong random **test-only** secret (32+ chars, generated locally), separate from production values and Google Web OAuth secret.
- Preserve unrelated local Web Client credentials, if any; Neon Managed Auth holds the provider's Google secret, not the browser app.
- Do **not** pull Vercel production environment into `.env.local` or point the localhost app at production/main database.
- `http://localhost:3000` is permitted by the test branch's `allow_localhost: true`; verify the actual local port, callback and allowed origin.
- No Vercel deployment required.

## Step C — Two real browser sessions (interactive consent)

Using two independent browser profiles/contexts (do not copy any credentials or cookies between them):

1. In browser A, sign in with Google **Account A** at `http://localhost:3000/auth/sign-in`. Complete any Google sign-in/consent prompts interactively as account owner. Verify redirect to app `/auth/callback`, then `/reader`, and account display.
2. Reload A: session should persist. Check guest /reader access in a signed-out browser separately.
3. In browser A, trigger a manual RSS backup via UI and assert `GET /api/account/backup` returns only A's feed/item data.
4. In browser B, sign in with **Account B**. Before uploading B's data, the backup GET must **NOT show A's rows**.
5. In B, upload a **different title/status** using **the same RSS feed_id and item_id** as A (through the authenticated browser context, no stolen/reused cookies). GET B: B's version only.
6. Back in A, GET again: A's title/status must be unchanged. Account B must not read, overwrite or delete Account A's data.
7. Try including `user_id` in a B POST payload attempting to target A; server must disregard caller-supplied `user_id` and continue using the verified B session.
8. Verify sign-out for each account and subsequent unauthenticated backup GET/POST returns **401** (valid same-origin). Cross-origin POST must return **403**.
9. Check the user explicitly opts in to RSS backup; normal sign-in never uploads Gmail, YouTube, shared notes or auth tokens. Check restore merges data without wiping unrelated IndexedDB entries.
10. Use live test-branch SQL only for non-sensitive assertions (e.g., overlapping `item_id` has two **distinct `user_id`** rows on the **test branch only**) and record aggregate counts, not personal information.
11. Report each test **PASS/FAIL/BLOCKED**, browser/environment, evidence, and remediation. A consent failure or missing login must be reported as NOT TESTED, never simulated as success.

For test items, use harmless unique markers (e.g. `rss:rawi-acceptance-overlap-20261016`) and an HTTP(S) public-looking example URL; never create real Gmail or YouTube records for this data isolation test.

## Stop conditions and cleanup

- Never publish, merge PR #5, deploy Vercel, edit GitHub Actions, or change the Android OAuth client during this stage.
- Do not rotate any credentials, expose secrets, or impersonate accounts.
- If the Google Console/browser needs the account owner's authentication/2FA, leave the challenge for the owner to complete. Never ask for or record passwords.
- The new Neon test branch is temporary. **Do not delete it until results are captured and the owner has approved cleanup**, so failed scenarios can be reproduced.
- Restore local branch/working tree to its prior state; keep local private `.env.local` ignored.
- PR remains **Draft / NOT READY** until web OAuth and two-account isolation have actually passed. Android device acceptance is explicitly deferred.
