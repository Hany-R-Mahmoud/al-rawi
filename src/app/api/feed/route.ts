import { NextResponse } from "next/server";
import { parseFeed } from "@/lib/feed-parser";
import { normalizeEncoding } from "@/lib/encoding-normalizer";
import { fetchPublicResource } from "@/lib/public-fetch";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url).searchParams.get("url");
  if (!url) return NextResponse.json({ error: "Feed URL is required." }, { status: 400 });

  try {
    const resource = await fetchPublicResource(url, {
      maxBytes: 4_000_000,
      accept: "application/rss+xml, application/atom+xml, application/xml, text/xml, */*",
      userAgent: "Al-Rawi/1.0",
    });
    const contentType = resource.contentType.match(/charset=([^;]+)/i)?.[1]?.trim();
    const body = normalizeEncoding(Buffer.from(resource.body), contentType);
    const feed = await parseFeed(resource.url, body);
    return NextResponse.json(feed);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not fetch feed." }, { status: 502 });
  }
}
