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


---

## Follow-up: remove native Google account connections (2026-11-15)

**Implementation on `remove-google-connections`: done; local Android/web gate verification and APK generation deferred.** This follow-up supersedes earlier claims in this report that native Gmail/YouTube OAuth source connectors remain present. The separate Al-Rawi Better Auth web sign-in and manual RSS backup remain in place.

| Item | Landed on feature branch | Verification/evidence |
|---|---|---|
| 1. Remove native Google account sources | YES | Removed `GoogleSourcesPlugin.kt`, `AuthResultActivity.kt`, `TokenVault.kt`, `GoogleAuthorizationTest.kt`, their registration and Android manifest activities; removed the native AppAuth dependency, client-ID Gradle fields, and stale APK build warning. Preserved notification listener, launcher `<queries>` block and Share plugin. Source diff reviewed; Android compilation **NOT CHECKED**. |
| 2. Remove web account-source layer | YES | Removed `src/lib/native-sources.ts`, Sources connect/sync and Gmail label UI, Inbox sync polling, and native Gmail message fetching from detail previews; removed two catalog OAuth entries and the obsolete promotional cards. Preserved legacy `gmail`/`youtube` InboxSource, card rendering, local saved content, YouTube playback and existing status actions. Runtime render/triage **NOT CHECKED**. |
| 3. Correct product documentation | YES | Updated README, architecture, privacy verification, portfolio EN/AR and retained the 2026-11-14 Android OAuth document with a prominent **SUPERSEDED** header. Existing web sign-in/Neon account claims are intentionally retained. Static review complete; full repo-wide historical document scan **NOT VERIFIED**. |
| 4. Legacy capture table | YES | `NotificationDb.ensureSchema()` uses `CREATE TABLE/INDEX IF NOT EXISTS` in both `onCreate` and `onOpen`, no version bump, no destructive change. Added `existingVersionOneDatabaseGetsCaptureTableWithoutRemovingLegacyRows` to the existing instrumentation suite. Test **NOT RUN**. |
| 5. Pending-update event | YES | `NotificationDb.save` returns `true` for existing `imported=0` updates (triggers `captureReceived` via the unchanged service), while imported rows return `false`. Updated dedupe test expects `true` on update and checks latest text. Test **NOT RUN**. |
| 6. Android/web gates | NO — DEFERRED | No accessible Mac project checkout, Android SDK/ADB, or `Pixel_9_2_16_KB` emulator in this environment. `./gradlew connectedAndroidTest`, `npm test`, `npx tsc --noEmit`, `npm run lint`, and `npm run build` were **not run**. New passing totals are **unknown**. Historical auditor baseline was **27/27 JS tests, tsc 0, lint clean, build OK**, not a result for this follow-up. |
| 7. APK | NO — DEFERRED | `npm run android:apk` was **not run**; no new `artifacts/al-rawi-full-test.apk` or SHA-256 is available. Owner's actual Gmail/YouTube notification and install-over-existing acceptance remain **handed over**, not passed. |

### Tests changed and why

- `src/lib/source-catalog.test.ts`: the one assertion that required a connected Gmail account provider was replaced with an assertion that the published source catalog has no account-backed Gmail/YouTube connectors. The test count is unchanged by this assertion replacement, but the suite was **not run**.
- `src/lib/cloud-backup.test.ts`: **unchanged**; its synthetic pre-existing Gmail Inbox records still verify that RSS backup exports only RSS items.
- `NotificationCaptureTest.kt`: updated the pre-import repost assertion and checked updated text; added exactly one legacy-version-1 database test (six test methods now declared, execution unverified).
- `GoogleAuthorizationTest.kt`: removed with the retired native OAuth flow (its two historical Android tests no longer apply).

### Security, compatibility and retained decisions

- New Gmail and YouTube content comes **only from notifications posted by the selected installed apps** through Android Notification Access; neither app account is queried or linked.
- Already imported Gmail and YouTube Inbox items stay on this device and can still be read, saved, marked done or archived. They are never refreshed from Gmail APIs.
- **Tokens previously stored by `TokenVault` are unreachable Android Keystore orphans; no migration or wipe.**
- The existing app-hosted web Google sign-in and manual RSS backup are unchanged. Captured notifications never reach Neon, Vercel or other servers.
- Historical design/Neon documents and the earlier sections of this append-only report may still mention retired source-class names as past implementation evidence. These are historical references, not active dependencies; strict whole-repository zero-string search excluding only the one explicitly superseded document is therefore **not claimed**.
- The previous production Vercel deployment checked before this change was READY, commit `22051f3869228bf2f9e5842c8fae08a39fc52c93`, ID `dpl_GpYzQQ4jH1jsQb3p1YZr9vYRtARS`, alias `https://al-rawi-rss.vercel.app`. No manual Vercel deployment is part of this follow-up.

### Deferred blockers and exact unlocks

1. **No owner's Mac local clone or Android AVD in this executor.** Evidence: container root is `/`; only prior handoff scripts appear under `/mnt/data`; `adb` is not installed, and terminal `git ls-remote` fails with `Could not resolve host: github.com`. Authenticated GitHub source editing works through the connected API. **Unlock:** on the owner's Mac, fetch the new remote branch, install dependencies from the unchanged lockfile, start `Pixel_9_2_16_KB`, then run `cd android && ./gradlew connectedAndroidTest`, `npm test`, `npx tsc --noEmit`, `npm run lint`, and `npm run build`. Fix any test failure at the source and report exact counts.
2. **No test APK or checksum.** Evidence: Android build not executable in this container and no compiled APK was created. **Unlock:** on the same Mac, run `npm run android:apk`, verify `artifacts/al-rawi-full-test.apk`, and run `shasum -a 256 artifacts/al-rawi-full-test.apk`. Owner installs it using `adb install -r` or approved sideload path without Play Protect evasion.
3. **No physical owner-device acceptance.** Evidence: no access to owner phone or real personal notifications. **Unlock:** owner tests Gmail/YouTube notifications after shade dismissal and install-over-current behavior; reports results without disclosing notification contents.
4. **Historical text references prevent a literal zero-string search of all repository documents.** Evidence: older append-only report sections and other historical project notes describe now-removed classes. **Unlock:** if strict text absence in archived docs is required, authorize a separate history-document cleanup while preserving audit provenance. Active runtime and Gradle references were removed.
5. **Native/web runtime gates not attested before merge.** Evidence: no local builder or emulator. The user explicitly requested the changes and subsequent remote merge; a GitHub merge does not imply passing the above gates. **Unlock:** run and capture the exact gate output on the Mac and amend the follow-up report in a later reviewed PR rather than silently claiming success.

### Not checked

No Android compilation, real notification delivery, permission changes, queue import, web browser run, full test execution, APK build/signature, SHA-256, or physical-device verification occurred in this execution environment. An authenticated GitHub source-file review is **not** a substitute for these checks.


---

# Al-Rawi — Notification-first refactor execution report (2026-11-17)

**Candidate:** `fix-inbox-scroll-ux-thumbnails`, based on `main@a107a3b7dd9f2507dc29cafaef004d162d4d6132`.
**Release state:** feature branch only; intentionally **not merged or deployed**. GitHub connector confirmed write access and Vercel project configuration; `vercel.json` remains `{"git":{"deploymentEnabled":{"*":false,"main":true}}}`. No Vercel or GitHub workflow initiated.
**Evidence legend:** SOURCE = changes checked in connected GitHub; OWNER = user-provided POCO X5 Pro observation; LIVE = earlier live production browser review; BLOCKED = not executable in this tool runtime.

## 1. Delivered source changes, by implementation phase

| Phase | Implementation on branch | Evidence / limitation |
|---|---|---|
| P0 — preflight | Read existing main, native listener/database/inbox, settings, routing, design and docs. Reused existing feature branch name. Retained main-only deployment policy. | SOURCE. No existing open PR. |
| P1 — Inbox scroll | Bounded the root workspace to `h-[100dvh]` with `overflow-hidden` at **all** breakpoints; list and Reading panes use `min-h-0` and own scroll; mobile list end padding clears bottom nav. | SOURCE, `src/app/reader/page.tsx`, `inbox-pane.tsx`, `reader-pane.tsx`; **mobile touch reproduction and final scroll measurements BLOCKED**. |
| P2 — navigation | Inbox-first on Android and web CTA. Saved is the same Inbox filtered by `status=saved`; four tab bar destinations Inbox/Saved/Reading/Settings. Existing 3-pane RSS moved under Reading and is not auto-refreshed on Inbox startup. Android explicit About uses `/landing/index.html`, root cold start goes to the exported reader asset. | SOURCE, workspace header/mobile nav/native-entry/app-route-link; focus/route acceptance BLOCKED. |
| P3 — Inbox UI | Compact mobile header; no Back-to-Reading; filter chips single-row scroll; sticky day headers; denser cards/unread dot; 3 mobile quick actions; context-specific empty states; IntersectionObserver load-more plus manual fallback; no-op active filter no longer forces busy; duplicate manual add blocked with inline error. | SOURCE, `inbox-pane.tsx`; 120-row viewport, touch, 200% font acceptance BLOCKED. |
| P4 — Android media | Extract native BigPicture → large icon → app icon only **after allowlist eligibility**, scale/encode JPEG/PNG, limit Base64 to 400 KiB. SQLite v1 additive nullable `media_kind`/`media_b64` with guarded migration; 10-row serialized bridge batches, commit-before-ACK; optional media retained on repost; one text-only retry. IndexedDB v3 untouched. Card picture/icon and detail hero with fallback. | SOURCE, `CaptureMedia.kt`, `NotificationCaptureService.kt`, `NotificationDb.kt`, `native-capture.ts`, `inbox-store.ts`, media component; Android compile, migration/run and real image acceptance BLOCKED. |
| P5 — settings and Reading | Captured Apps first; web Android-only explanation; searchable installed app picker, 50-app cap indicator, retry state; OPML category export; partial RSS refresh keeps previous articles of failed feeds; selection no longer jumps to a first item; browser-modifier keyboard shortcuts respected; RSS drawer hidden from keyboard when closed with Escape dismissal; mobile article read targets/reader header optimized. | SOURCE; actual navigation/readability and import/export roundtrip BLOCKED. |
| P6 — landing | Replaced RSS-first landing with a bilingual Android notification-first narrative, truthful explicit permission/privacy copy, compact mobile header with responsive menu/theme/language, genuine photo assets, three capture steps, RSS as secondary, clear PWA-vs-native limitation. Updated site metadata and `public/manifest.json`. | SOURCE. Baseline LIVE: English 360/390px horizontal overflow; post-change live 320/360/390/430/768/1280 screenshots BLOCKED. |
| P7 — checks/docs | Added focused IndexedDB media/repost/pagination tests, native media mapping test, Android bitmap and old-SQLite tests, RSS-only backup privacy test, app-route test correction, and updated README/PRODUCT/DESIGN/overview/architecture/portfolio. | Test source committed. **No test/build/APK commands executed successfully**. |

## 2. Screen-by-screen audit matrix

Each SOURCE decision is a source-code change/review only; it is **not** a pass of a rendered or on-device acceptance gate.

| # | Surface / state | Keep / remove / change | Source evidence | Acceptance |
|---|---|---|---|---|
| 01 | Workspace home/launch | Keep guest/local-first; remove RSS-first entry; add Inbox-first route, four destinations | `reader/page.tsx`, nav, `native-entry-redirect.tsx`, app-route-link | SOURCE; device/browser BLOCKED |
| 02 | Inbox/Saved/filters | Keep statuses and six filter modes; remove count guide/unread pill; compact/sticky/scroll/filter guard | `inbox-pane.tsx`, `inbox-store.ts` | SOURCE; long-list touch BLOCKED |
| 03 | Inbox detail | Keep explicit open/preview; smaller bounded header, local picture hero and reopen Done | `inbox-detail.tsx`, `inbox-media.tsx` | SOURCE; short-screen/focus BLOCKED |
| 04 | Add note/link + Share | Keep existing manual entry and share import; prevent duplicate Save, inline error, explicit share routes Inbox | `inbox-pane.tsx`, `reader/page.tsx` | SOURCE; end-to-end Android Share BLOCKED |
| 05 | Capture onboarding | Keep Android permission and selected-package consent; keep one-time opt-out and Settings recovery | `inbox-pane.tsx`, `sources-settings.tsx` | SOURCE; prompt-device BLOCKED |
| 06 | Captured-app settings | Keep permission checks, no account connector; move capture above RSS, add clear web/retry states | `sources-settings.tsx`, `settings-dialog.tsx` | SOURCE; live Android permission BLOCKED |
| 07 | Installed app picker | Keep native app list and cap, add search/selected-count, remove nested picker scrollbar | `sources-settings.tsx` | SOURCE; 300-app/keyboard BLOCKED |
| 08 | Preferences | Keep theme/language; put capture first and reduce reading-only wording/phone keyboard bulk | `settings-dialog.tsx` | SOURCE; large text/RTL BLOCKED |
| 09 | Account/RSS backup | Keep optional Better Auth web login and explicit RSS backup; remove misleading Google-source/token wording | `account-settings.tsx`, `inbox-store.ts` | SOURCE; authenticated integration BLOCKED |
| 10 | Sign-in and callback | Keep guest path; translate callback and point return to Inbox; preserve native sign-in-unavailable truth | `auth/sign-in/page.tsx`, `auth/callback/page.tsx` | SOURCE; OAuth live BLOCKED |
| 11 | Reading feed rail/drawer | Keep RSS 3-pane; secondary destination, no auto-RSS fetch; hidden mobile drawer unfocusable, Escape close | `reader/page.tsx`, `feed-list.tsx` unchanged | SOURCE; focus return BLOCKED |
| 12 | Feed discovery/catalog | Keep starter packs/catalog/manual URL; clarify button-group semantics and block competing additions | `feed-discovery-dialog.tsx` | SOURCE; keyboard/panels BLOCKED |
| 13 | Article list/search | Keep read toggle/article summaries; Reading-only keyboard and larger targets, no Inbox-invisible search | `article-list.tsx`, `use-keyboard-nav.ts` | SOURCE; browser keyboard BLOCKED |
| 14 | Reader | Keep sanitization and original link; compact mobile header/content clearance and stable selection on refresh | `reader-pane.tsx`, `reader/page.tsx` | SOURCE; short-screen/URL lifecycle BLOCKED |
| 15 | OPML and feed management | Keep feed categories/URLs; include escaped category on export, preserve failed feed's previous items | `settings-dialog.tsx`, `reader/page.tsx` | SOURCE; real roundtrip BLOCKED |
| 16 | PWA install/help | Keep legitimate browser install; landing-only promotion, distinguish PWA from Android native listener | `pwa-provider.tsx`, `pwa-install-help-dialog.tsx` | SOURCE; device install BLOCKED |
| 17 | Error/offline/loading | Keep local-first and event updates; bounded import, separate Share/Capture failures, concise capture retry status | `native-capture.ts`, `reader/page.tsx`, `inbox-pane.tsx` | SOURCE; offline/abort/slow network BLOCKED |
| 18 | Landing/header/footer | Keep existing logo and supplied photo assets; rebuild copy, page hierarchy, compact responsive menu, privacy | `landing/page.tsx`, metadata, manifest | SOURCE; visual/overflow/CLS BLOCKED |

## 3. Verification gates — factual results

| Gate | Result | Reason / exact unlock |
|---|---|---|
| `npm test` | **NOT RUN** | No repository checkout: container GitHub DNS fails (`Could not resolve host: github.com`). Code can be read/written through GitHub connector, not cloned into the test runtime. Run on owner's Mac with repo checkout and installed dependencies. |
| `npx tsc --noEmit` | **NOT RUN** | Same missing checkout. |
| `npm run lint` | **NOT RUN** | Same missing checkout. |
| `npm run build` | **NOT RUN** | Same missing checkout/dependencies. |
| `npm run build:capacitor` | **NOT RUN** | Needs repository checkout plus installed Capacitor/Android build toolchain. |
| `cd android && ./gradlew connectedAndroidTest` | **NOT RUN** | Requires full Android workspace and connected `Pixel_9_2_16_KB` AVD/emulator; not present in this tool runtime. |
| `npm run android:apk` | **NOT RUN** | Requires successful Capacitor sync and Gradle build. No `artifacts/al-rawi-full-test.apk` exists in this run; therefore no valid SHA-256 can be recorded. |
| Mobile/browser 320–1280, RTL/LTR, scroll, visual QA, focus, 200% text, 120+ records | **NOT RUN** on candidate | No branch preview/locally served candidate; **feature branch deployment deliberately disabled**. Never infer pass from production screenshot. |
| 3× creative director review rounds | **SOURCE-only** | Iterated code/layout/copy/privacy three times; visual start-to-finish review remains BLOCKED without running candidate. |
| Google OAuth/Neon RSS backup and PWA install on real browser | **NOT RUN** | Preserve existing implementation; requires authenticated web acceptance and real install context. |
| Owner POCO X5 Pro device acceptance | **OPEN / owner-only** | Install signed/test APK over existing app; verify 100+ Inbox items scrolling to oldest, real YouTube picture in card/detail, Gmail icon fallback, dismissal retention, Settings permission/app selection, and zero account connection. |

**Invariants checked by source review (not by executed tests):**
- App selection filter still precedes extras reads.
- Dedupe ID and imported-row suppression remain; queue row caps 1000 pending and 500 imported unchanged.
- SQLite v1 and IndexedDB v3 retained; additive media columns with guarded migration.
- Database commits precede queue ACK; source-only fallback drops optional media, not text.
- RSS manual backup only selects RSS items, strips optional media and never includes notification sources.
- No Google account-source OAuth restored; optional web app sign-in serves manual RSS backup only.
- Android manifest/permissions, Neon schema, and Vercel deployment settings unchanged.

## 4. Deferred blockers and exact owner-side completion steps

1. On the owner's Mac, `git fetch origin && git checkout fix-inbox-scroll-ux-thumbnails && npm ci` to obtain an executable workspace. Run the seven gates in Section 3, recording exact pass/fail counts and warnings; fix failures on **this branch**, do not merge.
2. Run the existing `Pixel_9_2_16_KB` emulator with Android 13+/16 KB coverage; validate v1 SQLite migration with an existing installed app, live image extraction (picture/icon fallback), 10-record batches and backlog >500; no cloud/media telemetry.
3. Locally serve candidate for browser viewport QA; seed 120 mixed-source items; measure true internal scroll, first+last items, fixed bottom-nav clearance, 320/360/390/430 horizontal overflow in EN+AR, theme, focus, search, 200% text, PWA and keyboard.
4. Produce `artifacts/al-rawi-full-test.apk` with `npm run android:apk`; append its SHA-256, candidate commit and build logs; then owner device install/permission/thumbnail/scroll confirmation.
5. Keep the PR **draft** until the gates and owner approvals have evidence. Merge to `main` only on an explicit separate release decision; that merge is the **only** authorized trigger for Vercel deployment.

**Conclusion:** A substantial source implementation is pushed to the dedicated GitHub branch and is ready for build/QA. It is **not production-ready or fully accepted yet**, and no Vercel deployment, merge, GitHub Action run or Android APK delivery is claimed.
