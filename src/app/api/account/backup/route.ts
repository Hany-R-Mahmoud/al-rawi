import { neon } from "@neondatabase/serverless";
import { auth } from "@/lib/auth/server";
import { isTrustedMutationOrigin } from "@/lib/server-origin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Row = Record<string, unknown>;
type Feed = { id: string; url: string; title: string; category: string | null };
type Item = {
  id: string;
  source: "rss";
  title: string;
  text: string;
  url: string | null;
  receivedAt: number;
  readAt: number | null;
  status: "new" | "saved" | "done" | "archived";
};

const statusValues = new Set(["new", "saved", "done", "archived"]);
const json = (value: unknown, status = 200) =>
  Response.json(value, { status, headers: { "Cache-Control": "no-store" } });

const isRecord = (value: unknown): value is Row => !!value && typeof value === "object" && !Array.isArray(value);
const safeText = (value: unknown, max: number): value is string => typeof value === "string" && value.length <= max;
const optionalUrl = (value: unknown): value is string | null => {
  if (value === null) return true;
  if (!safeText(value, 2048)) return false;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch { return false; }
};
function parseFeed(value: unknown): Feed | null {
  if (!isRecord(value) || !safeText(value.url, 2048) || !optionalUrl(value.url)) return null;
  if (!safeText(value.id, 2100) || value.id !== "feed:" + value.url) return null;
  if (!safeText(value.title, 280) || !value.title.trim()) return null;
  if (value.category !== null && !safeText(value.category, 100)) return null;
  return { id: value.id, url: value.url, title: value.title, category: value.category };
}
function validMillis(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 946684800000 && value <= 4102444800000;
}
function parseItem(value: unknown): Item | null {
  if (!isRecord(value) || value.source !== "rss") return null;
  if (!safeText(value.id, 2200) || !value.id.startsWith("rss:") || value.id.length <= 4) return null;
  if (!safeText(value.title, 280) || !value.title.trim() || !safeText(value.text, 1200)) return null;
  if (!optionalUrl(value.url) || !validMillis(value.receivedAt)) return null;
  if (value.readAt !== null && !validMillis(value.readAt)) return null;
  if (typeof value.status !== "string" || !statusValues.has(value.status)) return null;
  return {
    id: value.id,
    source: "rss",
    title: value.title,
    text: value.text,
    url: value.url,
    receivedAt: value.receivedAt,
    readAt: value.readAt,
    status: value.status as Item["status"],
  };
}

/**
 * Server-only: never accept user_id from input. Authentication alone does not
 * grant access to another user's data; every SQL query scopes by session ID.
 */
async function sessionUserId(): Promise<string | null> {
  const { data, error } = await auth.getSession();
  if (error || !data?.user?.id) return null;
  return data.user.id;
}
function database() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("Database configuration missing");
  return neon(url);
}

export async function GET() {
  try {
    const userId = await sessionUserId();
    if (!userId) return json({ error: "Sign in required" }, 401);
    const sql = database();
    const [feedRows, itemRows] = await Promise.all([
      sql`SELECT feed_id AS id, feed_url AS url, title, category
          FROM rawi.user_feeds WHERE user_id = ${userId}
          ORDER BY updated_at DESC LIMIT 200`,
      sql`SELECT item_id AS id, source, title, COALESCE(summary, '') AS text,
                 original_url AS url,
                 (EXTRACT(EPOCH FROM received_at) * 1000)::bigint AS "receivedAt",
                 CASE WHEN read_at IS NULL THEN NULL
                      ELSE (EXTRACT(EPOCH FROM read_at) * 1000)::bigint END AS "readAt",
                 status
          FROM rawi.inbox_items
          WHERE user_id = ${userId} AND source = 'rss'
          ORDER BY received_at DESC LIMIT 500`,
    ]);
    return json({ feeds: feedRows, items: itemRows });
  } catch {
    return json({ error: "Cloud backup is unavailable" }, 503);
  }
}

export async function POST(request: Request) {
  if (!isTrustedMutationOrigin(request)) {
    return json({ error: "Origin not allowed" }, 403);
  }
  if (!request.headers.get("content-type")?.startsWith("application/json")) {
    return json({ error: "JSON body required" }, 415);
  }

  try {
    const userId = await sessionUserId();
    if (!userId) return json({ error: "Sign in required" }, 401);

    const raw = await request.text();
    if (raw.length > 150000) return json({ error: "Backup is too large" }, 413);
    const body: unknown = JSON.parse(raw);
    if (!isRecord(body) || !Array.isArray(body.feeds) || !Array.isArray(body.items)
      || body.feeds.length > 200 || body.items.length > 500) {
      return json({ error: "Invalid backup" }, 400);
    }
    const feeds = body.feeds.map(parseFeed);
    const items = body.items.map(parseItem);
    if (feeds.some((feed) => !feed) || items.some((item) => !item)) {
      return json({ error: "Invalid feed or RSS record" }, 400);
    }
    // Avoid allowing duplicate IDs in one request to fail an upsert transaction.
    if (new Set(feeds.map((feed) => feed?.id)).size !== feeds.length
      || new Set(items.map((item) => item?.id)).size !== items.length) {
      return json({ error: "Duplicate item" }, 400);
    }

    const sql = database();
    if (feeds.length) {
      const records = feeds.map((feed) => ({
        feed_id: feed!.id, feed_url: feed!.url, title: feed!.title, category: feed!.category,
      }));
      await sql`
        INSERT INTO rawi.user_feeds (user_id, feed_id, feed_url, title, category)
        SELECT ${userId}, f.feed_id, f.feed_url, f.title, f.category
        FROM jsonb_to_recordset(${JSON.stringify(records)}::jsonb)
          AS f(feed_id text, feed_url text, title text, category text)
        ON CONFLICT (user_id, feed_id) DO UPDATE SET
          feed_url = EXCLUDED.feed_url, title = EXCLUDED.title,
          category = EXCLUDED.category, updated_at = now()
      `;
    }
    if (items.length) {
      const records = items.map((item) => ({
        item_id: item!.id,
        source: "rss",
        title: item!.title,
        summary: item!.text,
        original_url: item!.url,
        received_at_ms: item!.receivedAt,
        read_at_ms: item!.readAt,
        status: item!.status,
      }));
      await sql`
        INSERT INTO rawi.inbox_items
          (user_id, item_id, source, title, summary, original_url, received_at, read_at, status)
        SELECT ${userId}, i.item_id, i.source, i.title, i.summary, i.original_url,
          to_timestamp(i.received_at_ms / 1000.0),
          CASE WHEN i.read_at_ms IS NULL THEN NULL ELSE to_timestamp(i.read_at_ms / 1000.0) END,
          i.status
        FROM jsonb_to_recordset(${JSON.stringify(records)}::jsonb)
          AS i(item_id text, source text, title text, summary text, original_url text,
               received_at_ms bigint, read_at_ms bigint, status text)
        ON CONFLICT (user_id, item_id) DO UPDATE SET
          title = EXCLUDED.title, summary = EXCLUDED.summary,
          original_url = EXCLUDED.original_url,
          read_at = EXCLUDED.read_at, status = EXCLUDED.status, updated_at = now()
      `;
    }
    return json({ savedFeeds: feeds.length, savedItems: items.length });
  } catch (error) {
    if (error instanceof SyntaxError) return json({ error: "Invalid JSON" }, 400);
    return json({ error: "Cloud backup is unavailable" }, 503);
  }
}
