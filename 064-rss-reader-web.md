id: "064"
source_collection: "100-ai-prompts"
source_id: "none"
title: "RSS Reader"
brand: "Rawi"
category: "Productivity"
platform: "web"
difficulty: "builder"
capabilities: "auth, cron, parsing, rtl, keyboard-nav"
regulated_domain: "none"

Build `Rawi` — Minimalist Bilingual RSS Reader & Read-Later Queue

You are the product manager, UX designer, software architect, full-stack or native engineer, database engineer, QA engineer, security reviewer, accessibility reviewer, and technical writer for this project.
Build the product end to end. Produce a real, locally runnable implementation.

### 1. Product overview
Product name: `Rawi` (Arabic for "Storyteller" or "Narrator")
Product type: Web app
Difficulty: builder
Category: Productivity
Concept: Developers and researchers in the MENA region follow a mix of global tech blogs (Hacker News, Dev.to) and regional startup news (Wamda, MENAbytes), which often publish in Arabic with complex RTL formatting. Standard RSS readers are bloated, ad-heavy, or break when rendering mixed-direction feeds. `Rawi` is a minimalist, keyboard-driven web RSS reader that supports OPML import, gracefully handles legacy Arabic character encodings (Windows-1256 to UTF-8), and features a distraction-free "Read Later" queue.
Problem being solved: Knowledge workers want a fast, private, and minimalist RSS reader, but existing tools struggle with RTL feed rendering, legacy encodings, and lack keyboard-centric navigation for power users.
Proposed solution: A self-hostable web app where users import their feeds via OPML. A background cron job fetches and parses feeds, normalizing encodings. The UI is a 3-pane layout (Feeds -> Articles -> Reader) optimized for keyboard shortcuts (Vim-style or standard shortcuts) and perfect RTL typography.
Primary users: Developers, researchers, and journalists.
Primary success outcome: A user imports their OPML, uses the `J` and `K` keys to scroll through a mixed feed of English and Arabic articles, and saves the long-form Arabic pieces to a "Read Later" queue that strips away all website clutter.

### 3. Scope and product-specific contract
Builder tier. Multi-screen app with real persistence, background feed fetching, and complex text parsing. Standard test coverage.

**Functional contract**
The user uploads an `OPML` file. The app parses it and creates Feed records. A background worker polls the feeds every hour. New articles appear in the "All Articles" or specific Feed inbox. The user clicks an article. The app fetches the original URL, extracts the main content (using Mozilla Readability logic), and renders it in a clean, distraction-free typography view. The user can press `S` to save it to the "Read Later" queue.

**Required capabilities**
- OPML Import/Export — Parses standard XML OPML files to bulk-add feeds.
- Feed Parser & Encoding Normalizer — Handles RSS/Atom feeds, specifically detecting and converting legacy Arabic encodings (ISO-8859-6, Windows-1256) to UTF-8.
- Content Extractor — Strips navigation, ads, and footers from the original article URL to provide a clean reading experience.
- Keyboard Navigation — Global shortcuts (`J`/`K` for next/prev, `O` to open original, `S` to save, `M` to mark read).
- Read-Later Queue — A separate inbox for saved articles, with reading progress tracking.

**Business rules and invariants**
- Feed polling must be staggered to prevent thundering herd problems on the database and network.
- If a feed returns a 404 or 410 Gone repeatedly over 7 days, it should be automatically "Paused" to save resources, notifying the user.
- The content extractor must safely sanitize HTML to prevent XSS from malicious RSS feeds, while preserving basic formatting (`<p>`, `<h1>`, `<img>`, `<blockquote>`).

**Explicit non-goals**
- Social sharing or "liking" feeds (strictly a personal reader).
- Mobile native apps (the web UI must be highly responsive and PWA-capable instead).

### 4. Recommended technology and portability
Next.js 14 (App Router), TypeScript 5, Tailwind CSS 3, shadcn/ui, Prisma 5, PostgreSQL, `rss-parser`, `@mozilla/readability` + `jsdom` (for content extraction), `iconv-lite` (for encoding normalization).

### 7. Interfaces, navigation, commands, and states
- 3-Pane Layout: Left (Feed list & folders), Middle (Article list), Right (Article Reader).
- Read Later View: A dedicated list for saved articles.
- Settings: OPML import/export, polling frequency, theme.
- States: Fetching Feeds, Parsing Error, Empty Inbox, Reading.

### 8. UX and visual or terminal design
Ultra-minimalist, "Hacker News meets Medium". High-contrast typography. The Reader pane must use a highly legible serif font for English and a premium Naskh font (like Amiri or Noto Naskh Arabic) for Arabic content. 

### 11. Offline, synchronization, and resilience
Online-required for fetching, but the extracted "Read Later" articles should be cached in IndexedDB so the user can read them offline on a commute.

### 14. Accessibility and localization
- Full keyboard accessibility is a core feature, not an afterthought. Focus states must be highly visible.
- RTL Rendering: The Reader pane must dynamically detect the primary language of the article and apply `dir="rtl"` or `dir="ltr"` to the content container. Mixed paragraphs (Arabic text with English code snippets) must render with proper Unicode isolation.

### 16. Testing and verification
- Unit test: The encoding normalizer correctly converts a mock Windows-1256 Arabic byte stream into readable UTF-8 Arabic.
- Security test: The HTML sanitizer successfully strips `<script>` tags and `javascript:` URLs from a malicious mock RSS feed payload.
- UX test: Navigating the 3-pane layout using only the keyboard works seamlessly without trapping focus.

### 19. Definition of done
All standard builder checkboxes apply. The app must successfully import an OPML, fetch a feed with legacy encoding, normalize it, and render a clean, RTL-compliant article view.

Start now.