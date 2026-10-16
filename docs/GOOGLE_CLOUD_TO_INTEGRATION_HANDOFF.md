# Al-Rawi — Google Cloud to Neon/Vercel integration handoff

**Date:** 2026-10-16  
**Stage:** Google Cloud setup reported complete by Codex; application integration is **not** complete.  
**Safety:** Never commit, print, paste into issue/PR, or expose any client secret or token.

## Google Cloud configuration (from Codex handover; not independently rechecked in Google Console)

| Item | Value |
| --- | --- |
| Google Cloud project ID | `al-rawi-511808` |
| Google Cloud project number | `419056937607` |
| OAuth app name | Al-Rawi |
| Audience | External |
| Publishing | Testing |
| Test users | **None** (blocks testing with unlisted Google accounts) |
| Support/contact email | `audiobookstrial2@gmail.com` |
| Web OAuth client ID | `419056937607-pcvpiqrqvs9levm5g28hgvsgkbh3gkmn.apps.googleusercontent.com` |
| Android OAuth client ID | `419056937607-q6fdt2n54b8u3l6klr0ekb8n5aunt065.apps.googleusercontent.com` |
| Android package | `com.hany.alrawi` |
| Android SHA-1 | Reported configured for **local debug key**, value not supplied; re-verify on that machine |
| APIs | Gmail API and YouTube Data API v3 reportedly enabled |

**Neon-managed Google Web OAuth redirect URI:**

```text
https://ep-morning-wind-ba530r1h.neonauth.c-8.eu-central-1.aws.neon.tech/neondb/auth/callback/google
```

Scopes are separate:
- **User login**: `openid`, `email`, `profile`.
- **Gmail source opt-in** (Android): `https://www.googleapis.com/auth/gmail.readonly`.
- **YouTube source opt-in** (Android): `https://www.googleapis.com/auth/youtube.readonly`.

Gmail `gmail.readonly` is restricted and can read the mailbox beyond the app-selected label. Google verification / security assessment may be required for public distribution depending on handling. Never attach the Gmail/YouTube scopes to basic Sign In.

## Independently verified integration-side state

- Neon project `lucky-haze-33211470`, branch `br-dark-queen-baaycjls` has **Managed Better Auth** enabled.
- Neon Auth base URL: `https://ep-morning-wind-ba530r1h.neonauth.c-8.eu-central-1.aws.neon.tech/neondb/auth`.
- **Neon Auth Google provider is still `type: shared`**, and has no custom client ID/secret configured. It has **not** been switched to the new Google Web OAuth client.
- Auth trusted origins: `https://al-rawi-rss.vercel.app` and `https://al-rawi-hany-mahmouds-projects.vercel.app`.
- Application schema `rawi` with `user_preferences`, `user_feeds`, `inbox_items` exists.
- Vercel project `al-rawi`: the checked environment-variable listing contained **no app variables**. Configuration is still pending.
- GitHub feature branch `feat/neon-auth-foundation`, PR #5. No login UI, protected per-user data endpoints or cloud sync have been implemented yet.

## Immediate Codex/local-machine task: save the secret

**ChatGPT's container does not have access to the user's macOS checkout or clipboard.** The handover contains no secret value. This task must run inside the existing Codex local session or locally on the Mac.

1. In the local checkout `/Users/hanyramadan/new era/ops/apexyard-portfolio/workspace/al-rawi`, open/create **project-root `.env.local` using an editor/file-write API**. Do not rely on shell heredocs or complex shell redirection rejected by the PreToolUse hook.
2. **Preserve any existing lines** if the file already exists. On a new line add `GOOGLE_WEB_CLIENT_SECRET=` followed by the actual copied **Web** client secret from the authorized private source. Do not include the value in any message, screenshot or tool output. Do not use the Android client ID or Web client ID as a substitute for a secret.
3. `.gitignore` already contains `.env*` and `.env.local`. Confirm the file remains ignored using `git check-ignore -v -- .env.local`; check `git status --short --untracked-files=all` to ensure no secret file is staged or tracked. Never run `git add -f .env.local`.
4. Report only `local secret file created/updated: yes/no`, `gitignored: yes/no`, and `untracked/staged: yes/no` — **not the secret**.
5. **The local `GOOGLE_WEB_CLIENT_SECRET` variable alone does not configure Google login via Managed Neon Auth.** Neon itself must receive the Web client ID and secret as its **custom Google OAuth provider** configuration through a secure authenticated admin channel. Avoid moving the secret via chat, GitHub or build logs.

The rest of this task can proceed without the secret being copied into the ChatGPT conversation.

## Next Neon integration steps

1. In Google Cloud, add the intended test account(s), e.g. `audiobookstrial2@gmail.com` if that is the actual test login, to the External/Testing OAuth application's test users. Confirm the consent-page test scopes and signing certificate SHA-1 on a real device.
2. Configure **Neon Auth Google provider** as **custom** with the Google **Web** client ID and secret, using a secret-safe Neon Console or authenticated CLI workflow. Verify the resulting provider is no longer `shared`; do not expose the secret in this document.
3. Set **server-only** Vercel environment variables for the correct project: `NEON_AUTH_BASE_URL`, a new strong `NEON_AUTH_COOKIE_SECRET`, and pooled `DATABASE_URL` when user-data routes need it. Separate production from preview databases/credentials. Do not use `NEXT_PUBLIC_` for these.
4. Implement Next.js web session/login/logout via `@neondatabase/auth` (Managed wrapper) and protected server-side user-data routes. Keep RSS/reading as guest/local-first unless the user chooses to sign in.
5. Scope all SQL CRUD operations by authenticated session user ID. Existing `rawi` tables **do not implement per-user authorization on their own**. Never trust a client-supplied `user_id`.
6. Handle local IndexedDB-to-cloud import only with explicit user consent; avoid losing RSS/feed/state data on logout, refresh, or app upgrade.
7. Design **Android account sign-in** separately: current AppAuth native Google source connectors are for Gmail/YouTube access, **not** yet a Neon user session. Do not launch a standard web login inside Android WebView and assume it works.
8. Verify login/redirect/session refresh, server 401 + cross-user access denial, Vercel env scopes, and both Next.js Web and Android static-export builds. Test on a physical Android device. No merge/deploy without acceptance.

## Explicit limitations

The Google Cloud details above come from the Codex/user handover; ChatGPT independently checked Neon/Auth/Vercel state but **not** the Google Cloud Console. `.env.local` has **not** been written or verified on the user's Mac by ChatGPT. No secrets are stored in this repository.
