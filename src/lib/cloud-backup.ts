import { recentRssBackupItems, applyCloudRssItems } from "./inbox-store";
import type { InboxItem } from "./inbox-types";
import type { StoredFeed } from "./reader-types";

/** Nothing uploads automatically. Only public RSS subscriptions/read states are backed up. */
async function cloudRequest(method: "GET" | "POST", body?: unknown): Promise<unknown> {
  const response = await fetch("/api/account/backup", {
    method, credentials: "same-origin", cache: "no-store",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!response.ok) throw new Error("Cloud request failed: " + response.status);
  return response.json() as Promise<unknown>;
}

export async function saveRssBackup(feeds: StoredFeed[]): Promise<void> {
  const items = (await recentRssBackupItems())
    .map((item) => ({
      id: item.id, source: "rss", title: item.title.slice(0, 280),
      text: item.text.slice(0, 280), url: item.url ?? null,
      receivedAt: item.receivedAt, readAt: item.readAt ?? null, status: item.status,
    }));
  await cloudRequest("POST", { feeds: feeds.slice(0, 200), items });
}

export async function restoreRssBackup(onImportFeeds: (feeds: StoredFeed[]) => number): Promise<void> {
  const response = await cloudRequest("GET");
  if (!response || typeof response !== "object" || !("feeds" in response) || !("items" in response)) throw new Error("Invalid backup");
  const backup = response as { feeds: StoredFeed[]; items: Array<InboxItem & { readAt: number | string | null; receivedAt: number | string }> };
  if (!Array.isArray(backup.feeds) || !Array.isArray(backup.items)) throw new Error("Invalid backup");
  const records: InboxItem[] = backup.items.filter((item) => item?.source === "rss").map((item) => ({
    ...item, receivedAt: Number(item.receivedAt),
    readAt: item.readAt === null ? null : Number(item.readAt),
  })).filter((item) => Number.isFinite(item.receivedAt) && (item.readAt === null || Number.isFinite(item.readAt)));
  await applyCloudRssItems(records);
  onImportFeeds(backup.feeds.filter((feed) => typeof feed?.url === "string" && /^https?:\/\//.test(feed.url)));
}
