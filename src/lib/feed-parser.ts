import Parser from "rss-parser";
import { normalizeEncoding, detectDirection, detectLanguage } from "./encoding-normalizer";
import { JSDOM } from "jsdom";

type CustomFeed = {
  title?: string;
  description?: string;
  link?: string;
  image?: { url?: string };
};

type CustomItem = {
  title?: string;
  link?: string;
  content?: string;
  contentSnippet?: string;
  guid?: string;
  pubDate?: string;
  creator?: string;
  "dc:creator"?: string;
  isoDate?: string;
};

const parser = new Parser<CustomFeed, CustomItem>({
  customFields: {
    feed: ["title", "description", "link"],
    item: ["title", "link", "content", "contentSnippet", "guid", "pubDate", "creator", "dc:creator"],
  },
  timeout: 15000,
  headers: {
    "User-Agent":
      "Mozilla/5.0 (compatible; RawiRSS/1.0; +https://rawi.app)",
    Accept: "application/rss+xml, application/xml, text/xml, */*",
  },
});

export interface ParsedFeed {
  title: string;
  description?: string;
  link?: string;
  icon?: string;
  articles: ParsedArticle[];
}

export interface ParsedArticle {
  guid: string;
  title: string;
  url?: string;
  author?: string;
  summary?: string;
  content?: string;
  publishedAt?: Date;
  language: "ar" | "en" | "unknown";
  direction: "rtl" | "ltr";
}

export async function parseFeed(url: string, rawXml?: string): Promise<ParsedFeed> {
  let result: Parser.Output<CustomItem>;

  if (rawXml) {
    // rawXml is already a JavaScript string, so decoding it again can only
    // risk changing its contents.
    result = await parser.parseString(rawXml);
  } else {
    // Fetch with encoding detection
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; RawiRSS/1.0; +https://rawi.app)",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const contentType = response.headers.get("content-type") || "";
    const encoding = extractEncoding(contentType);

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Detect and normalize encoding
    let normalizedXml: string;
    if (encoding && encoding !== "utf-8") {
      normalizedXml = normalizeEncoding(buffer, encoding);
    } else {
      // Try UTF-8 first, then fall back to encoding detection
      const asUtf8 = buffer.toString("utf-8");
      if (looksLikeValidXml(asUtf8)) {
        normalizedXml = asUtf8;
      } else {
        normalizedXml = normalizeEncoding(buffer, null);
      }
    }

    result = await parser.parseString(normalizedXml);
  }

  const feed: ParsedFeed = {
    title: result.title || url,
    description: result.description,
    link: result.link || undefined,
    icon: result.image?.url || undefined,
    articles: [],
  };

  if (result.items) {
    feed.articles = result.items.map((item) => {
      const content = item.content || item.contentSnippet || "";
      const direction = detectDirection(item.title || content);
      const language = detectLanguage(item.title || content);

      return {
        guid: item.guid || item.link || item.title || Math.random().toString(),
        title: item.title || "Untitled",
        url: item.link || undefined,
        author: item.creator || item["dc:creator"] || undefined,
        summary: item.contentSnippet || content.slice(0, 500),
        content: content ? sanitizeHtml(content) : undefined,
        publishedAt: item.pubDate ? new Date(item.pubDate) : item.isoDate ? new Date(item.isoDate) : undefined,
        language,
        direction,
      };
    });
  }

  return feed;
}

function extractEncoding(contentType: string): string | null {
  const match = contentType.match(/charset=([^;]+)/i);
  return match ? match[1].trim() : null;
}

function looksLikeValidXml(text: string): boolean {
  return /<\?xml|<rss|<feed|<rdf:/i.test(text);
}

/**
 * Safely sanitize HTML content from articles.
 * Removes scripts, event handlers, and dangerous tags.
 */
export function sanitizeHtml(html: string): string {
  const dom = new JSDOM(`<!DOCTYPE html><div>${html}</div>`);
  const doc = dom.window.document;
  const div = doc.querySelector("div")!;

  // Remove dangerous elements
  const dangerousTags = [
    "script", "style", "iframe", "object", "embed", "applet",
    "form", "input", "textarea", "button", "select", "option",
    "frame", "frameset", "noframes", "noscript",
  ];
  for (const tag of dangerousTags) {
    div.querySelectorAll(tag).forEach((el) => el.remove());
  }

  // Remove all attributes that start with "on" (event handlers)
  function cleanAttributes(el: Element) {
    const toRemove: string[] = [];
    for (const attr of el.attributes) {
      const name = attr.name.toLowerCase();
      if (name.startsWith("on") || name === "javascript") {
        toRemove.push(attr.name);
        continue;
      }
      const val = attr.value.toLowerCase();
      if (val.startsWith("javascript:")) {
        toRemove.push(attr.name);
      }
    }
    toRemove.forEach((name) => el.removeAttribute(name));
    Array.from(el.children).forEach(cleanAttributes);
  }
  cleanAttributes(div);

  // Only allow safe tags
  const allowedTags = new Set([
    "p", "br", "hr", "h1", "h2", "h3", "h4", "h5", "h6",
    "ul", "ol", "li", "dl", "dt", "dd",
    "blockquote", "pre", "code", "tt",
    "b", "i", "strong", "em", "u", "s", "mark", "small",
    "a", "img", "figure", "figcaption",
    "table", "thead", "tbody", "tfoot", "tr", "th", "td",
    "div", "span", "section", "article",
    "sup", "sub", "abbr", "cite",
  ]);

  function removeUnsafeElements(el: Element) {
    for (let i = el.children.length - 1; i >= 0; i--) {
      const child = el.children[i];
      if (!allowedTags.has(child.tagName.toLowerCase())) {
        // Replace with its children (unwrap)
        const parent = child.parentElement!;
        while (child.firstChild) {
          parent.insertBefore(child.firstChild, child);
        }
        child.remove();
      } else {
        removeUnsafeElements(child);
      }
    }
  }
  removeUnsafeElements(div);

  // Remove empty tags that could cause layout issues
  div.querySelectorAll("*").forEach((el) => {
    if (el.innerHTML.trim() === "" && !["br", "hr", "img"].includes(el.tagName.toLowerCase())) {
      el.remove();
    }
  });

  return div.innerHTML;
}
