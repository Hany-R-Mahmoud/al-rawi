# Al-Rawi — restore scoped notification capture

Started: 2026-11-15. Branch: `restore-notification-capture`. Based on main `cab3e2db066ce14acfab07cc19098734cf2f94bf`.

## Tasks

- [x] Gap 0: inspected current manifest, activity, Share bridge, IndexedDB store, Inbox, Sources, i18n, share import/listener call sites; read PR #1/#4 and historical Kotlin service/plugin/DB.
- [x] Gap 1 implementation: allowlist-first native listener, SQLite queue, dedupe, caps, persistence through dismissal and reconnect; removed startup database deletion.
- [x] Gap 2 implementation: native Capacitor plugin, app list, permissions, list/ack, event, import-then-ack web bridge. Share plugin unchanged.
- [x] Gap 3 implementation: IndexedDB v3 and notification item types, filter removed; v1→v2 historical purge unchanged.
- [x] Gap 4 implementation: EN/AR locked strings, native Sources switches, Inbox prompt, app-open action, Bell icon; native guard.
- [x] Gap 5 documentation: README, architecture, revival verification, portfolio updated to scoped-capture truth.
- [x] Wrote the two named tests only: extended `src/lib/inbox-store.test.ts` and added isolated `NotificationCaptureTest.kt`.
- [x] Wrote/updated AGENTS.md, DESIGN.md, PRODUCT.md. Manual static cross-check of new files/methods.
- [ ] npm install/test/lint/typecheck/build: not run (no mounted local clone/network).
- [ ] AVD instrumentation and real J1–J6 journeys: not run (no Android SDK/emulator here).
- [ ] Impeccable audit/polish, screenshots, Lighthouse, browser/device fresh-eyes: not run.
- [ ] Build/debug-sign `artifacts/al-rawi-full-test.apk` and SHA-256: not available.
- [ ] Locally merge and push main after tests pass; then production domain smoke, all-image checks and rollback readiness: gated.
- [ ] Owner phone J7/J8 and independent audit: handed over, not claimed as passed.

## Production baseline before merge

- Vercel project: `al-rawi`
- Ready production deployment ID: `dpl_E6munyDyHUBm1tKfmptbwXVTyVgr`
- Deployment URL: `https://al-rawi-i52c0rgs6-hany-mahmouds-projects.vercel.app`
- Production alias: `https://al-rawi-rss.vercel.app`
- Commit: `cab3e2db066ce14acfab07cc19098734cf2f94bf`
- No merge or production deployment performed.

## Appendix D — Deferred blockers (evidence and exact unlock)

1. **No owner Mac clone mounted.** Evidence: /mnt/data is empty; no `al-rawi` folder is exposed to the executor and `git ls-remote` cannot resolve github.com from its isolated container, despite authenticated GitHub connector working. **Unlock:** on the owner's Mac, in the existing clone, run `git fetch origin restore-notification-capture && git switch restore-notification-capture`; make sure clean working tree and expected head match the connected GitHub branch.
2. **Cannot execute code/AVD or produce the APK here.** Evidence: connected GitHub file API provides repository edits but no installed node_modules/project workspace/Android SDK/AVD. **Unlock:** on the Mac with its Android SDK run `npm ci && npm test && npm run lint && npx tsc --noEmit && npm run build && npm run android:apk`, then `cd android && ./gradlew connectedAndroidTest` on AVD `Pixel_9_2_16_KB`; run J1–J6 with synthetic notifications, record results and SHA-256 of debug APK.
3. **No interactive app browser and no synthetic screenshots.** Evidence: no clone, local app server or emulator browser available. **Unlock:** run 390px RTL and desktop EN web journeys and Native Sources/Inbox on emulator; capture synthetic-only `docs/screens/` screenshots, Lighthouse CLS, console and image checks.
4. **Impeccable CLI unavailable.** Evidence: no `/impeccable` executor/launcher attached. **Unlock:** run `/impeccable init`, `/impeccable audit`, `/impeccable polish` in the compatible local builder (up to three passes) and record results.
5. **Production release is gated, not pushed.** Evidence: builder journeys, code checks, screenshots and APK are not verified, violating the prompt's pre-merge condition. **Unlock:** complete all builder done-bar checks on the branch, locally merge, push main only, validate `https://al-rawi-rss.vercel.app` and every image. Baseline rollback target recorded above; if rollout breaks, Instant Rollback and `vercel promote <deployment>` before later pushes.
6. **Owner's real phone acceptance pending.** Evidence: builder cannot use owner's Google accounts/physical Android phone and no APK is available yet. **Unlock:** install verified debug APK over current version, report Play Protect UI verbatim, grant Notification Access, clear one real YouTube and Gmail notification, verify both saved/read/done/archive behaviour (J7/J8).

Conditional compatibility warning: PR #1 used SQLiteOpenHelper version 1 with a different `notifications` table. PR #4 removed that database at startup. If an old APK bypassed PR #4 and retained an incompatible v1 DB, an explicit data-preserving legacy-schema decision would be required; this scope explicitly forbids database migrations. Do not delete a real database to work around it.
