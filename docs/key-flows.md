# Key Flows

## Add or import subscriptions

1. The user chooses a starter preset, catalog item, or manual URL in the feed
   discovery dialog, or imports an OPML file from Settings.
2. The reader normalizes the URL, assigns an ID derived from it, and writes the
   subscription metadata to browser `localStorage`.
3. The reader immediately refreshes the new or imported feeds through
   `GET /api/feed`.
4. Successful responses become in-memory `Article` values; failed feeds retain
   an error status for the current session.

OPML import accepts nested `<outline>` entries, de-duplicates feed URLs, and
   accepts only HTTP(S) feed URLs. Export creates an OPML 2.0 download from the
   current local subscription list.

## Refresh feeds

1. Initial reader load reads the stored feed list.
2. All stored feeds are requested in parallel through the feed route.
3. The route validates the public target, downloads at most 4 MB, normalizes
   encoding, parses RSS/Atom, and sanitizes feed HTML.
4. The reader replaces the refreshed feed’s article slice and sorts visible
   articles by publication time.

There is no background poller, cron job, queue, or server-side cache in the
current implementation.

## Open and read an article

1. Selecting an article starts a request to `POST /api/articles/extract`.
2. The route validates the public URL, requires an HTML response, and limits
   the body to 8 MB.
3. Mozilla Readability extracts the main content.
4. The result is sanitized and tagged with inferred language and direction.
5. The reader stores the extracted content in React state and renders it in the
   reader pane. Opening the original uses a new browser tab.

## Navigate with the keyboard

When focus is not inside an input, textarea, select, or editable element:

| Key | Behavior |
|---|---|
| `J` | Next visible article |
| `K` | Previous visible article |
| `O` | Open the original article |
| `M` | Toggle read/unread |
| `/` | Toggle search |
| `R` | Refresh the selected feed or all feeds |

## External boundaries

- Browser storage: subscription metadata and language preference.
- Third-party feed servers: RSS/Atom responses.
- Third-party article servers: HTML responses for extraction.
- No accounts, persistent server data, or scheduled external jobs are present.
