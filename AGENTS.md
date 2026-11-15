<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Apex Yard documentation

Read README.md and docs/portfolio.json before changing this project.
Keep portfolio facts source-backed, update the structured document when the repository changes, and write Unknown / verify instead of guessing.

## Read first

For implementation work, read these repo-owned docs in order as needed:

1. `README.md`
2. `docs/overview.md`
3. `docs/architecture.md`
4. `docs/ai-agent-guide.md`
5. `docs/team-decisions/`

## Project commands

```bash
npm install
npm run dev
npm run lint
npx tsc --noEmit
npm run build
```

The declared test command covers focused library tests; there is no conventional
test directory. Report remaining mounted UI and device coverage gaps.

## Repository conventions

- The application lives under `src/` and uses the `@/*` alias for `src/*`.
- Keep feed subscriptions and preferences local-first unless a documented
  architecture decision changes that boundary.
- Treat public URL fetching, encoding normalization, HTML sanitization, and
  bilingual direction handling as risk-sensitive code.
- Preserve user changes and make focused edits. Update `docs/portfolio.json`
  when source-backed portfolio facts change.
- Read `docs/team-decisions/` before changing durable architecture, API, or
  workflow behavior.

## Notification capture (Android only)

- Build: `npm install`, `npm run build`, `npm run build:capacitor`, `npm run android:apk`. Test: `npm test`, `npx tsc --noEmit`, `npm run lint`; Android instrumentation: `cd android && ./gradlew connectedAndroidTest` on the project's configured emulator.
- Native map: `NotificationCaptureService.kt` filters notifications before reading content; `NotificationDb.kt` owns the bounded private SQLite queue and package allowlist; `NotificationCapturePlugin.kt` exposes settings, queue, and events. Do not reintroduce capture-all or startup database deletion.
- Web map: `src/lib/native-capture.ts` imports/acks only after `src/lib/inbox-store.ts` commits (IndexedDB v3). `src/components/sources-settings.tsx` owns per-app choices; `src/components/inbox-pane.tsx` owns one-time onboarding. Preserve state on reposts.
- Traps: Android permission grants system-wide listener visibility, but Al-Rawi filters before extracting and persists only opted-in apps. Don't print notification content, add cloud sync, modify the Google/Share plugins, or deploy from feature branches. QA needs a real AVD plus owner phone; GitHub text-only editing cannot produce an APK.

## Unknowns

- Node.js version is not pinned by a repository version file or `engines` field:
  `Unknown / verify`.
- CI, deployment configuration, and a Git remote are not defined in the
  current repository: `Unknown / verify`.
