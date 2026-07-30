import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";
import { sanitizeHtml } from "./feed-parser";
import { detectDirection, detectLanguage } from "./encoding-normalizer";

export interface ExtractedContent {
  title: string;
  content: string; // Sanitized HTML
  textContent: string; // Plain text
  excerpt: string;
  byline?: string;
  direction: "rtl" | "ltr";
  language: "ar" | "en" | "unknown";
  length: number;
}

/**
 * Extract main content from an article URL using Mozilla Readability.
 * Returns sanitized, direction-aware content.
 */
export async function extractContent(url: string): Promise<ExtractedContent> {
  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; RawiRSS/1.0; +https://rawi.app)",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch article: HTTP ${response.status}`);
  }

  const html = await response.text();
  return extractFromHtml(html, url);
}

export function extractFromHtml(html: string, url?: string): ExtractedContent {
  const dom = new JSDOM(html, { url });

  // Use Readability to extract the main content
  const reader = new Readability(dom.window.document);
  const article = reader.parse();

  if (!article) {
    throw new Error("Could not extract content from page");
  }

  // Sanitize the extracted HTML
  const safeHtml = sanitizeHtml(article.content || "");
  const direction = detectDirection(article.textContent || article.title || '');
  const language = detectLanguage(article.textContent || article.title || '');

  return {
    title: article.title || "Untitled",
    content: safeHtml,
    textContent: article.textContent || "",
    excerpt: article.excerpt || "",
    byline: article.byline || undefined,
    direction,
    language,
    length: article.length || 0,
  };
}

/**
 * Strip HTML tags and return plain text.
 */
export function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
