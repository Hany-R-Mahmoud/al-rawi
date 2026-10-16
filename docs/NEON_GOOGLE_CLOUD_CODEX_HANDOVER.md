# Al-Rawi — Codex Google Cloud Console Handover (2026-10-16)

## Goal
Configure **Google Cloud Console only** so Al-Rawi can offer Google Sign In for web accounts via **Neon Managed Better Auth**, while preserving the existing **separate Android OAuth** permissions for Gmail and YouTube. Do not migrate databases, redesign UI, or deploy code in this task.

## Confirmed resources
- GitHub: `Hany-R-Mahmoud/al-rawi`
- Neon project: `al-rawi`, ID `lucky-haze-33211470`
- Neon branch: `main`, ID `br-dark-queen-baaycjls`
- Neon Auth: Better Auth (provisioned)
- Neon Auth base URL: `https://ep-morning-wind-ba530r1h.neonauth.c-8.eu-central-1.aws.neon.tech/neondb/auth`
- **Google Web OAuth authorized redirect URI for Neon**: `https://ep-morning-wind-ba530r1h.neonauth.c-8.eu-central-1.aws.neon.tech/neondb/auth/callback/google`
- Production website: `https://al-rawi-rss.vercel.app`
- Android application ID: `com.hany.alrawi`
- Android existing OAuth is implemented with AppAuth/PKCE and GoogleSourcesPlugin; it is NOT the same as Neon web login.
- For Web OAuth, use Neon Auth's Google integration, NOT a redirect to a client-side WebView.
- Current APK build supports `ALRAWI_GOOGLE_ANDROID_CLIENT_ID` at build time.

## Codex steps — Google Cloud
1. Open existing or create a new **Google Cloud project** for Al-Rawi. Do not create extra billed resources or enable billing without explicit user approval.
2. Configure Google Auth Platform branding, audience, consent screen and test users. Keep application in testing mode during validation. Document publishing status.
3. Create **Web application OAuth 2.0 client** for Neon-managed Google Sign In. Set the authorized redirect URI EXACTLY to the Neon URL above. Configure authorized JavaScript origins only where applicable; do not substitute the Vercel domain for the Neon callback.
4. Create a separate **Android OAuth 2.0 client** for package `com.hany.alrawi`. Determine actual **SHA-1** for the relevant debug signing certificate (and record it); avoid assuming SHA-1 from a different developer's debug keystore. If release build is needed later it requires its own certificate fingerprint/client configuration.
5. Enable **Gmail API** and **YouTube Data API v3** for Android source access. Confirm any quotas and consent-scopes requirements; do not casually request mailbox scopes as part of basic Sign In.
6. Configure/declare OAuth scopes separately: Sign In (`openid email profile`); YouTube (`https://www.googleapis.com/auth/youtube.readonly`); Gmail (`https://www.googleapis.com/auth/gmail.readonly`). The Gmail scope is restricted: explain verification / testing-user limitations and possible independent security assessment before public launch; do not declare verification completed.
7. Return the Web Client ID and Android Client ID; store **Web Client Secret** securely in Google Cloud/Neon and do NOT commit or paste credentials into GitHub or the handover. Provide the project ID, exact redirect and fingerprint used, consent/tester status, enabled APIs and any blockers.
8. For the Web Google provider, configure **Neon Auth's own Google OAuth provider** using the generated Web client credentials in Neon if Codex has securely authorized access to that specific Neon project. Otherwise hand over the credentials securely for the ChatGPT/Neon integration step. Avoid overwriting the shared provider before credentials are available.
9. **Stop** and report; do not deploy, merge, change database, grant unrelated scopes, or modify production authentication flows without a test plan.

## Important boundaries
- Google Sign In does **not** grant permission to read Gmail/YouTube; those must remain independently opt-in.
- The Android app is a Capacitor static export. The existing Android GoogleSourcesPlugin is for **source connectors**, not yet for Al-Rawi account sign-in. Native user-account sign-in requires a separately designed secure flow; do not assume Web OAuth in an embedded WebView works.
- OAuth client credentials alone do not complete Neon/Vercel app code integration or user-specific cloud sync.
- Do not store Gmail or YouTube access/refresh tokens in the Neon tables prepared here.
- Existing user content is local IndexedDB. Do not wipe or silently upload it.

## Acceptance report to return
Google project ID; consent audience/publishing mode; testers; Web client ID; Android client ID; Android signing SHA-1; registered callback URI(s); enabled APIs; scope/verification status; whether Neon provider configuration succeeded; problems requiring action. NEVER include any client secret, tokens or private key in the report.
