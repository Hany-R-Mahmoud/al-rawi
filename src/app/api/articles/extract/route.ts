import { NextResponse } from "next/server";
import { extractFromHtml } from "@/lib/content-extractor";
import { fetchPublicResource } from "@/lib/public-fetch";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const payload: unknown = await request.json().catch(() => null);
  const url = payload && typeof payload === "object" && "url" in payload && typeof payload.url === "string" ? payload.url : null;
  if (!url) return NextResponse.json({ error: "Article URL is required." }, { status: 400 });

  try {
    const resource = await fetchPublicResource(url, {
      maxBytes: 8_000_000,
      accept: "text/html,application/xhtml+xml",
      userAgent: "Al-Rawi/1.0",
    });
    if (!/text\/html|application\/xhtml\+xml/i.test(resource.contentType)) return NextResponse.json({ error: "Article URL did not return HTML." }, { status: 422 });
    const extracted = extractFromHtml(Buffer.from(resource.body).toString("utf8"), resource.url);
    return NextResponse.json({ content: extracted.content, language: extracted.language, direction: extracted.direction });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not extract article." }, { status: 502 });
  }
}
