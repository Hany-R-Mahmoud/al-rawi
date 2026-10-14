import type { InboxItem } from "./inbox-types";
import { apiUrl } from "./api-base";
import { gmailMessageText } from "./native-sources";

export type InboxPreview =
  | { kind: "html"; content: string; direction?: string; language?: string }
  | { kind: "text"; content: string }
  | { kind: "video"; videoId: string };

export function youtubeVideoId(url?: string): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (parsed.hostname !== "www.youtube.com" && parsed.hostname !== "youtube.com" &&
        parsed.hostname !== "youtu.be" && parsed.hostname !== "m.youtube.com") return null;
    const candidate = parsed.hostname === "youtu.be" ? parsed.pathname.slice(1) : parsed.searchParams.get("v");
    return candidate && /^[a-zA-Z0-9_-]{11}$/.test(candidate) ? candidate : null;
  } catch { return null; }
}

/** Ask the source for the full body only while its item is open. No silent background scraping. */
export async function loadInboxPreview(item: InboxItem): Promise<InboxPreview> {
  if (item.source === "youtube") {
    const id = youtubeVideoId(item.url);
    if (id) return { kind: "video", videoId: id };
  }
  if (item.source === "gmail") {
    const body = await gmailMessageText(item.id.slice("gmail:".length));
    return { kind: "text", content: body || item.text };
  }
  if ((item.source === "rss" || item.source === "shared") && item.url) {
    try {
      const target = new URL(item.url);
      if (target.protocol !== "https:" && target.protocol !== "http:") throw Error("Invalid article URL");
      const response = await fetch(apiUrl("/api/articles/extract"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: target.href }),
        signal: AbortSignal.timeout(18000),
      });
      if (response.ok) {
        const extracted = await response.json() as { content?: string; direction?: string; language?: string };
        if (extracted.content && extracted.content.trim()) {
          return { kind: "html", content: extracted.content, direction: extracted.direction, language: extracted.language };
        }
      }
    } catch { /* External pages may block extraction; show the stored preview instead. */ }
  }
  return { kind: "text", content: item.text };
}
