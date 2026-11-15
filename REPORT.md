Done with deferred blockers: 6 — source implementation committed on `restore-notification-capture`; **NOT verified, merged, deployed or delivered as an APK.**

# Al-Rawi — scoped notification capture report (2026-11-15)

## 1. Built vs specs

| Spec | Source implementation | Remaining |
|---|---|---|
| Gap 0 — Recon | Done: read PR #1/#4, historical capture Kotlin code, current manifest/activity/share plugin/inbox/settings/i18n, share import call sites | None for source reconnaissance; local build checks outstanding |
| Gap 1 — native capture | Implemented: `NotificationCaptureService`, package allowlist before reading notification extras, SQLite `captured_notifications`, caps, stable SHA256 key, dedupe, dismissal survival, reconnect, silence on failure; removed `MainActivity.deleteDatabase` | AVD instrumentation and real notification exercise not checked |
| Gap 2 — Capacitor bridge | Implemented: `NotificationCapture` plugin methods, launcher-app visibility, event, `native-capture.ts` store→ack import, same reader triggers as Share plus focus | Native compile, ack-failure and event integration not checked |
| Gap 3 — IndexedDB | Implemented: `notification` source, optional package name, schema version 3, read filter removed, historical version<2 purge untouched, existing state-preserving upsert/RSS boundaries retained | Focused tests written but not executed |
| Gap 4 — onboarding & settings | Implemented: native-only app switches + permission CTA, one-time dismissed Inbox prompt, notification Bell and app label, conditional app-open action; exact supplied capture-copy keys EN/AR | Emulator and 390px RTL/keyboard/200% text checks not performed |
| Gap 5 — docs/claims | Implemented in `README.md`, `docs/architecture.md`, `docs/revival-verification.md`, `docs/portfolio.json`; obsolete no-listener assertions removed from named docs | Narrative requires device confirmation before any release claims |

Unchanged by design: GoogleSourcesPlugin/OAuth, SharedContentPlugin/Share, RSS reader/feed parsing, Neon account/backup, `vercel.json`, package versions, mobile-nav item/order and paper & ink tokens.

### State flows

- Native: posted → allowlisted + non-ongoing/non-summary/nonblank → native pending row → IndexedDB upsert commits → native imported=1 → New/Read/Saved/Done/Archived. Dismissal has no storage action.
- Permission: unknown → not granted / granted. Grant via Android Settings; Sources refreshes on visibility, focus and source changes. Package selection persists immediately.
- Onboarding: not shown → shown → dismissed (localStorage) or granted; dismissed prompt never returns. Permanent Sources entry remains.

## 2. Done bar and Verification journeys

| Check | Result | Evidence |
|---|---|---|
| Source files and named tests on feature branch | Static check only | 13 critical file locations and relevant methods retrieved via authenticated GitHub |
| All acceptance checks pass on emulator | **Not checked** | No AVD or local Android SDK |
| npm tests / typecheck / lint / builds | **Not checked** | No local cloned workspace or dependencies |
| 390px UX console/CLS | **Not checked** | No running app/browser/Lighthouse |
| All production referenced images return 200/image/* | **Not checked** | No release; production deliberately unchanged |
| Fresh-eyes agent independently completes journeys | **Not checked** | Separate manual static review only; no device |
| Deferred blocker list with exact unlock | **Pass (documentation)** | `PROGRESS.md` Appendix D |
| Production shipping and live checks | **Not checked** | No main push; pre-merge verification gate is unmet |
| Debug APK and SHA-256 | **Not checked** | No APK produced |
| G-2 independent owner audit | **Handed over** | Cannot assert audit outcome |

| Journey | Status | Checker | Reason |
|---|---|---|---|
| J1 dismissal survives | Not checked | Builder | Needs Android notification and AVD |
| J2 capture list/ongoing/group filters | Not checked | Builder | Rules implemented; instrumentation authored but not executed |
| J3 update dedupe/status preservation | Not checked | Builder | Native and IndexedDB test cases authored, not run |
| J4 process restart + ack once | Not checked | Builder | No testable APK |
| J5 permission/onboarding/settings | Not checked | Builder | No device or rendered UI |
| J6 RSS, Share, Google, web 390px and desktop regressions | Not checked | Builder | No browser/device build |
| J7 real Gmail and YouTube | Handed over | Owner at publish | Private phone/accounts unavailable |
| J8 APK over existing installation | Handed over | Owner at publish | Owner's phone, Play Protect UI and APK needed |

## 3. Commands run and outputs

Connected GitHub API: fetched base branch at `cab3e2db066ce14acfab07cc19098734cf2f94bf`, created `restore-notification-capture`, fetched history and files, and committed implementation, two tests, documentation and handoff on that branch. Static method/filename presence cross-check was completed; this is not equivalent to Kotlin/TypeScript compilation.

Container: `pwd` → `/`; `ls -la /mnt/data` → no mounted clone; `git --version` → 2.47.3; `node --version` → v22.16.0; `npm --version` → 10.9.2; `git ls-remote https://github.com/Hany-R-Mahmoud/al-rawi.git HEAD` → `Could not resolve host: github.com`.

`npm ci`, `npm test`, `npm run lint`, `npx tsc --noEmit`, `npm run build`, `npm run android:apk`, `./gradlew connectedAndroidTest`: **not run**; passing test counts **unknown**; never imply zero failures.

## 4. Files created/changed and risky writes

Created: `android/app/src/main/java/com/hany/alrawi/NotificationDb.kt`, `NotificationCaptureService.kt`, `NotificationCapturePlugin.kt`, `src/lib/native-capture.ts`, `android/app/src/androidTest/java/com/hany/alrawi/NotificationCaptureTest.kt`, `PRODUCT.md`, `PROGRESS.md`, `REPORT.md`.

Changed: `android/app/src/main/AndroidManifest.xml`, `MainActivity.java`; `src/lib/inbox-types.ts`, `inbox-store.ts`, `inbox-store.test.ts`, `i18n.ts`; `src/app/reader/page.tsx`; `src/components/inbox-pane.tsx`, `inbox-detail.tsx`, `sources-settings.tsx`; `README.md`, `docs/architecture.md`, `docs/revival-verification.md`, `docs/portfolio.json`, `AGENTS.md`, `DESIGN.md`.

Risky writes: `NotificationDb.save` (id-keyed SQLite transaction, latest unimported updates, imported no-op and queue cap), `NotificationDb.ack` (idempotent imported=1 after web persistence), `native-capture.ts → upsertInboxItems` (state-preserving IndexedDB transaction) and `CaptureRules.setPackages` (persist selected package JSON). No server writes, no cloud synchronization of notifications.

## 5. Deferred blockers — Appendix D

1. No mounted owner Mac clone. Evidence: empty /mnt/data and container GitHub DNS unavailable; authenticated GitHub connector works. Unlock: `git fetch origin restore-notification-capture && git switch restore-notification-capture` in the existing owner clone; verify clean worktree/head.
2. Local build, Android SDK and APK unavailable. Evidence: source accessible only through GitHub connection, no local project dependencies/AVD. Unlock: run `npm ci && npm test && npm run lint && npx tsc --noEmit && npm run build && npm run android:apk`, then `cd android && ./gradlew connectedAndroidTest` on `Pixel_9_2_16_KB`, run J1–J6 and hash the APK.
3. UI/browser screenshots and performance checks unavailable. Evidence: no running browser/AVD with app. Unlock: test 390px RTL, desktop English, 320px/200% text, accessibility, console, screenshot with synthetic data to `docs/screens/`, Lighthouse CLS and referenced images.
4. Impeccable launcher unavailable. Evidence: executor has no `/impeccable` command. Unlock: locally execute init/audit/polish (max 3 passes), document findings; `PRODUCT.md` is a manual context fallback, not CLI output.
5. Production merge/push/check gated. Evidence: J1–J6, build and APK not verified. Unlock: after green gates, locally merge branch to main, push main only, verify production alias and images. Previous production: `cab3e2db066ce14acfab07cc19098734cf2f94bf`, Vercel `dpl_E6munyDyHUBm1tKfmptbwXVTyVgr`, deployment `https://al-rawi-i52c0rgs6-hany-mahmouds-projects.vercel.app`, alias `https://al-rawi-rss.vercel.app`. Roll back with Vercel Instant Rollback if live regression, then `vercel promote <deployment>` before a subsequent production push.
6. Real-phone acceptance pending. Evidence: cannot use owner's accounts/phone and APK not ready. Unlock: install `artifacts/al-rawi-full-test.apk` produced locally over current build (never bypass Play Protect), test cleared real Gmail/YouTube notifications and statuses, report J7/J8.

Conditional compatibility risk: PR #1 used a version-1 SQLite helper with a different `notifications` schema, whereas PR #4 deleted that historical DB during startup. Direct upgrades bypassing PR #4 are not proven; the run forbids migrations. Do not delete user data as a workaround.

## 6. Red-team, sweep and fresh-eyes

**Plan and red-team:** preferred smallest change: filter Android notifications BEFORE reading extras, store once in app-private SQLite, show only owner's chosen apps, reuse IndexedDB upsert/ack and existing UI. Likely failures: inaccessible device build, Android manifest package visibility, listener lifecycle, a stale v1 SQLite file, and misleading documentation; avoided a network backend, Play Protect evasion, broad capture and new libraries. Real runtime effort is nontrivial because Android builds/AVD and owner-phone checks are required; no paid services or dependency changes.

**Read-only UX/security/code self-check (not a panel verdict):** UI uses existing `paper`, `ink`, `accent2`, Bell icon, bilingual locked copy and same bottom nav. No notification content logged, notification strings render as text (not arbitrary HTML), native package allowlist evaluated before extras. The native plugin acknowledges only after IndexedDB persistence. Serious unresolved checks: Android build, real per-package filtering, dark-mode contrast, keyboard focus, 390px layout, 200% text, screenshot privacy and cloud regression. No owner data or personal notification content was read.

**Fixes during source review:** restored retention instead of startup deletion; removed stale read filter; added Android launcher queries; removed inaccurate no-notification claims; made native test database use a distinct name; added focus refresh and listener reconnect SecurityException handling. No design token values changed or re-derived. No token/Impeccable conflicts applied.

**Impeccable:** init/audit/polish **not run**. **Fresh-eyes verdict:** NOT CHECKED / cannot say PASS; no runnable device/browser. Not performed as a separate agent.

## 7. Not checked

No installed/on-device build, permission granting/revoking, post/dismiss, reboot, selected-app filtering with real senders, native event handling, IndexedDB failure forcing, web/account or Share regressions, APK signing/install, owner-account Gmail/YouTube deliveries, Play Protect prompt, runtime performance, screenshots, Lighthouse, generated assets check or live deployment smoke. No production code was deployed.

## 8. Pre-existing settings retained

Next.js 16.4.2, React 19.2.4, Capacitor 8.5.3; existing Google/Auth and RSS boundaries; `vercel.json` main-only production policy; paper-and-ink design tokens; existing Geist/Georgia/Amiri/Naskh font choices, existing Arabic digit/rendering behavior, `Inbox` status semantics, manual RSS cloud backup and app-native Google connectors. The old IndexedDB version<2 notification purge was intentionally left unchanged, as specified; only version 2→3 retains notifications. No new database migration, external API, dependency upgrade, palette or navbar change.

## 9. Screens and artifacts

No screenshots saved to `docs/screens/`, because no browser or emulator was available; screenshots must contain synthetic notifications only. No APK was built, so `artifacts/al-rawi-full-test.apk` and its SHA-256 are unavailable. Do not treat GitHub text commits as a compiled Android package.
