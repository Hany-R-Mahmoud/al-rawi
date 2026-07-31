# Al-Rawi Design System

## 1. Atmosphere & Identity

Al-Rawi is a quiet reading desk: warm paper, restrained ink, and a precise three-pane workspace. The signature is the contrast between a compact operational rail and generous serif reading space.

## 2. Color

The existing warm OKLCH tokens in `src/app/globals.css` are the source of truth: paper surfaces, ink hierarchy, muted borders, and the restrained terracotta accent. New UI uses Tailwind semantic tokens only.

## 3. Typography

- Sans: Geist for controls and metadata.
- Serif: Georgia for English reading and Amiri/Noto Naskh Arabic for Arabic reading.
- Existing scale is retained: 10–12px metadata, 14px controls, 18px article body, and 20px reader title.

## 4. Spacing & Layout

- Base unit: 4px.
- App shell: fixed `100dvh`, feed sidebar, article list, and reader detail pane.
- Sidebar and article list own their vertical scrolling; headers and shortcut footers stay fixed.
- Below the `lg` breakpoint the feed rail becomes an off-canvas panel and the reader becomes a stacked mobile surface.

## 5. Components

### Feed list
- States: empty, loading, active, error, delete.
- Accessibility: semantic buttons, visible focus, keyboard-operable add-feed dialog.

### Article list
- States: empty, loading, selected, read, error.
- Accessibility: article rows are buttons with readable labels; action buttons stop event propagation.

### Reader pane
- States: empty, extracting, ready, unavailable.
- Accessibility: language and direction are explicit; original article is a real link action.

### Settings dialog
- States: closed, open, importing, import error, imported.
- Accessibility: labeled controls, status messages, keyboard-reachable file import/export.

### Mobile bottom navigation
- Visible below `lg` with Feeds, Articles, Search, and Settings actions.
- Uses a tonal paper surface, thin semantic border, visible pressed state, and safe-area padding for embedded mobile browsers.
- Accessibility: semantic navigation landmark, labeled buttons, pressed-state announcement, and visible keyboard focus.

## 6. Motion & Interaction

Existing transitions use short ease-out opacity/transform changes. Respect reduced motion. Do not animate layout dimensions.

## 7. Depth & Surface

Use tonal paper surfaces and thin semantic borders. Avoid decorative shadows and card stacks.

## 8. Accessibility Constraints & Accepted Debt

- Target WCAG 2.2 AA.
- Preserve visible focus, keyboard navigation, readable contrast, and `prefers-reduced-motion` behavior.
- Accepted debt: the hosted web build needs a stateless server proxy because arbitrary RSS sources do not reliably permit browser CORS. A desktop or extension shell can remove that dependency later if truly serverless local fetching becomes a requirement.
