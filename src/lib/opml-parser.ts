import { JSDOM } from "jsdom";

export interface OpmlOutline {
  title?: string;
  text?: string;
  xmlUrl?: string;
  htmlUrl?: string;
  type?: string;
  category?: string;
  children?: OpmlOutline[];
}

export interface OpmlFeed {
  title: string;
  url: string;
  siteUrl?: string;
  category?: string;
}

/**
 * Parse an OPML XML string and extract feed URLs.
 * Throws on invalid OPML documents.
 */
export function parseOpml(xml: string): OpmlFeed[] {
  const dom = new JSDOM(xml, { contentType: "text/xml" });
  const doc = dom.window.document;

  // Validate OPML root element
  const root = doc.documentElement;
  if (!root || root.tagName.toLowerCase() !== "opml") {
    throw new Error(
      "Invalid OPML file: root element must be <opml>. " +
      "Upload a standard OPML 2.0 file exported from your RSS reader."
    );
  }

  const version = root.getAttribute("version");
  if (!version) {
    throw new Error(
      "Invalid OPML file: missing version attribute on <opml>. " +
      "Upload a standard OPML 2.0 file."
    );
  }

  const feeds: OpmlFeed[] = [];
  const seen = new Set<string>();

  function processOutline(outline: Element, parentCategory?: string) {
    const xmlUrl = outline.getAttribute("xmlUrl") || "";
    const title = outline.getAttribute("title") || outline.getAttribute("text") || "";
    const htmlUrl = outline.getAttribute("htmlUrl") || "";
    const category = outline.getAttribute("category") || parentCategory;
    const text = outline.getAttribute("text") || "";

    if (xmlUrl && !seen.has(xmlUrl)) {
      seen.add(xmlUrl);
      feeds.push({
        title: title || text || xmlUrl,
        url: xmlUrl,
        siteUrl: htmlUrl || undefined,
        category: category || undefined,
      });
    }

    // Process children (for nested outlines/categories)
    Array.from(outline.children).forEach((child) => {
      if (child.tagName === "OUTLINE") {
        processOutline(
          child as Element,
          title || text || category
        );
      }
    });
  }

  const body = doc.querySelector("body");
  if (!body) {
    throw new Error(
      "Invalid OPML file: missing <body> section. " +
      "The OPML file must contain a <body> element with <outline> entries."
    );
  }

  Array.from(body.children).forEach((child) => {
    if (child.tagName === "OUTLINE") {
      processOutline(child as Element);
    }
  });

  return feeds;
}

/**
 * Generate an OPML XML string from an array of feeds.
 */
export function generateOpml(feeds: OpmlFeed[]): string {
  const outlines = feeds
    .map(
      (feed) =>
        `    <outline text="${escapeXml(feed.title)}" title="${escapeXml(feed.title)}" type="rss" xmlUrl="${escapeXml(feed.url)}" htmlUrl="${escapeXml(feed.siteUrl || feed.url)}"/>`
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<opml version="2.0">
  <head>
    <title>Rawi Feed Export</title>
    <dateCreated>${new Date().toISOString()}</dateCreated>
  </head>
  <body>
${outlines}
  </body>
</opml>`;
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
