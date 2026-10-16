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

## Update from latest Codex handover — missing Web Client Secret

**Current verified status reported by Codex:** The existing Google Web OAuth Client Secret was not saved and cannot be displayed again; no new secret was added, and `.env.local` is absent. Codex checked that the local `main` branch was clean and `.env.local` is already ignored. ChatGPT additionally rechecked Neon: Google is still a **shared** OAuth provider, NOT a custom provider. **Neither Google Sign In nor a cross-device sync has been tested.**

**Important correction:** Because this project uses **Neon Managed Better Auth**, the Google **Web Client Secret is required by the Neon OAuth provider**, not by the Next.js app or Vercel. There is **no functional requirement to write `GOOGLE_WEB_CLIENT_SECRET` into the project's local `.env.local`** for this managed approach. Avoid creating extra copies of this high-value secret. The earlier request to save it locally is optional only if the user explicitly wants a private backup.

### Next step — needs user authorization before creating new credential

1. After explicit user authorization, open Google Auth Platform → Clients → **existing Web OAuth Client** (`419056937607-pcvpiqrqvs9levm5g28hgvsgkbh3gkmn.apps.googleusercontent.com`); use **Add secret** on that same client. **Do not create another client or project.**
2. Transfer the newly shown Web secret to **Neon Console → project al-rawi → branch main → Auth → Google OAuth (custom provider)** using a secure, authenticated UI workflow. Reuse existing **Web Client ID**; never use the Android client ID or ask the user to paste the secret into chat/issue/PR/logs. Avoid clipboard dumps/screenshots showing the secret.
3. Verify Neon OAuth provider reads `custom` and the callback is still `https://ep-morning-wind-ba530r1h.neonauth.c-8.eu-central-1.aws.neon.tech/neondb/auth/callback/google`.
4. In Google Auth Platform → Audience, add the user's intended Google test account(s) while the app is **External / Testing**. Do not assume support email equals test user email; confirm the actual login account.
5. Verify `git status` stays clean and no secrets were committed. If the user **explicitly requires** a local secret backup, write the actual new secret only to the ignored root `.env.local` using a direct editor operation, and verify `git check-ignore -v -- .env.local`. This backup **alone** does not configure Neon.
6. Stop and report credential-created yes/no, Neon-custom-provider yes/no, test-user-added yes/no, and blockers. **Never return the secret.**

Official Google documentation confirms an unrecoverable Web Client Secret can be replaced by **Add secret** on its existing OAuth client: https://developers.google.com/health/codelabs/make-your-first-api-call-using-oauth2-playground.

## Next Neon integration steps

1. Follow the **missing secret** recovery workflow above; add the actual intended test Google account(s), and confirm the consent-page test scopes and Android SHA-1 on a real device.
2. Configure **Neon Auth Google provider** as **custom** with the existing Google **Web** Client ID and newly generated Web secret, after approval, via secure Neon Console or authenticated workflow. Verify it is no longer `shared`; do not expose any secret.
3. Set **server-only** Vercel environment variables for the correct project: `NEON_AUTH_BASE_URL`, a new strong `NEON_AUTH_COOKIE_SECRET`, and pooled `DATABASE_URL` when user-data routes need it. Separate production from preview databases/credentials. Do not use `NEXT_PUBLIC_` for these.
4. Implement Next.js web session/login/logout via `@neondatabase/auth` (Managed wrapper) and protected server-side user-data routes. Keep RSS/reading as guest/local-first unless the user chooses to sign in.
5. Scope all SQL CRUD operations by authenticated session user ID. Existing `rawi` tables **do not implement per-user authorization on their own**. Never trust a client-supplied `user_id`.
6. Handle local IndexedDB-to-cloud import only with explicit user consent; avoid losing RSS/feed/state data on logout, refresh, or app upgrade.
7. Design **Android account sign-in** separately: current AppAuth native Google source connectors are for Gmail/YouTube access, **not** yet a Neon user session. Do not launch a standard web login inside Android WebView and assume it works.
8. Verify login/redirect/session refresh, server 401 + cross-user access denial, Vercel env scopes, and both Next.js Web and Android static-export builds. Test on a physical Android device. No merge/deploy without acceptance.

## Explicit limitations

The Google Cloud details above come from the Codex/user handover; ChatGPT independently checked Neon/Auth/Vercel state but **not** the Google Cloud Console. `.env.local` has **not** been written or verified on the user's Mac by ChatGPT. No secrets are stored in this repository.
