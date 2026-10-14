# Revival UI/UX audit — implementation notes

**Scope:** Entire visible Al-Rawi interface, based on the existing merged Android/RSS/Gmail/YouTube code. This is a **UI-only** iteration on its own branch. No real-account backend functionality was added or simulated.

## Findings and changes

| Screen | Finding | Implemented change |
|---|---|---|
| Landing | RSS-only messaging; complex CSS Orbital Hero | Editorial hero with generated still-life WebP; source matrix, privacy section, clear platform distinction |
| Reader desktop | Inbox hidden under a small toolbar button | Workspace-wide Reading/Inbox navigation, plus Sources and Settings |
| Mobile navigation | Tight bottom toolbar | Clear five-destination footer and larger text/tap targets |
| Inbox | Dense cards and unclear empty state | Editorial list, date grouping, filters, search, source management and real actions |
| Feeds | Hover-only Delete not keyboard-visible | Accessible focused control, category groups, stronger selected state |
| Article list | Entire article element clickable but not keyboard-operable | Explicit buttons with focus state; separate read/unread action |
| Article reader | Weak hierarchy | Source/author/title/actions, readable article column and meaningful empty state |
| Settings | Long collection of unrelated controls | Separate Preferences / Sources / Notifications tabs |
| Sources | Android-only connectors hidden in settings | Visible workspace Sources entry and honest disabled status on web |
| Android permission | Dense text | Two-step skippable onboarding; clear storage and access message |
| PWA promotion | Overlay blocked header taps | Bottom landing-only promotion; no workspace overlay |
| Arabic/theme | System font fallback not dependable on all machines | Explicit Arabic Naskh family for RTL UI and Arabic button text |
| Dev overlay | React Scan/Grab diagnostic overlays covered interactive controls | Opt-in local debugging only via NEXT_PUBLIC_ENABLE_UI_DEBUG=1 |

## Impeccable direction

Keep the existing Paper & Ink design system and brand identity. Strong editorial typography and source labels, generous space, accessible controls. The new photographic hero is AI-generated and locally stored, **not a CSS artwork**. Empty states contain no fake sample notifications or connections.

A local Impeccable CLI scan was run against source UI and a browser viewport. It flagged 10px functional copy, borderline accent contrast and repetitive overline labels above headings. These were revised together; automated rules are supportive rather than comprehensive accessibility verification.

## Local QA checklist

- Verify desktop and mobile landing, including image loading and content accuracy.
- Verify EN/AR, full RTL, both themes and no horizontal overflow.
- Verify Reading/Inbox switching, source management, OPML import/export and original RSS workflows.
- Verify Inbox statuses, search, Save, Done, Archive, empty state and preserved local records.
- Verify Settings tabs, source controls disabled honestly on web and native prompts are optional.
- Verify source catalog dialog and responsive toolbar, focus-visible actions and keyboard access.
- Run TypeScript, ESLint, Node tests, Next.js build, Capacitor static export and sync.
- Never conflate a successful web compile with native Android end-to-end validation.

## Native-device limitations from previous release

See docs/revival-verification.md for physical Android notification capture testing, Google OAuth credentials, real Gmail/YouTube import verification, notification listener permissions and APK distribution. These are **still separate release acceptance tasks**.

## PR / workflow policy

All review and fixes happen locally before PR. No GitHub Actions, manual deployment or post-PR code review reply work is required. Stop after creating the PR; do not merge.
