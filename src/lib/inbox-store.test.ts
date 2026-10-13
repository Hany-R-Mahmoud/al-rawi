import "fake-indexeddb/auto";
import assert from "node:assert/strict";
import test from "node:test";
import { changeInboxStatus, inboxMatches, listInbox, rssInboxItems, upsertInboxItems } from "./inbox-store";
import type { InboxItem } from "./inbox-types";

function item(id: string, opts: Partial<InboxItem> = {}): InboxItem {
  return { id, source: "rss", title: "News " + id, text: "Some preview", receivedAt: Date.now(), status: "new", ...opts };
}

test("missed means unread older than 48 hours only", () => {
  const now = Date.now();
  assert.equal(inboxMatches(item("old", { receivedAt: now - 49 * 3600_000 }), "missed", "", now), true);
  assert.equal(inboxMatches(item("recent", { receivedAt: now - 2 * 3600_000 }), "missed", "", now), false);
  assert.equal(inboxMatches(item("done", { receivedAt: now - 49 * 3600_000, status: "done" }), "missed", "", now), false);
});

test("saved, archived and global search filter predictably", () => {
  assert.equal(inboxMatches(item("saved", { status: "saved" }), "saved", ""), true);
  assert.equal(inboxMatches(item("archived", { status: "archived" }), "today", ""), false);
  assert.equal(inboxMatches(item("archived", { status: "archived" }), "archived", "PREVIEW"), true);
  assert.equal(inboxMatches(item("other"), "all", "not present"), false);
});

test("RSS articles map to stable inbox IDs without changing reader state", () => {
  const articles = [{
    id: "feed:xyz:123", feedId: "feed:xyz", title: "Headline", summary: "excerpt",
    publishedAt: "2026-10-01T10:00:00.000Z", url: "https://example.org/story",
    author: null, content: null, direction: "ltr" as const, language: "en" as const,
    isRead: false, feed: { title: "Example", icon: null },
  }];
  const result = rssInboxItems(articles);
  assert.equal(result[0].id, "rss:feed:xyz:123");
  assert.equal(result[0].source, "rss");
  assert.equal(result[0].url, "https://example.org/story");
  assert.equal(articles[0].isRead, false);
});

test("saving and rescanning a source does not reset triage status", async () => {
  await upsertInboxItems([item("rss:test:unique")]);
  await changeInboxStatus("rss:test:unique", "saved");
  await upsertInboxItems([item("rss:test:unique", { title: "Updated title" })]);
  const saved = await listInbox("saved", "", 1);
  const found = saved.items.find((entry) => entry.id === "rss:test:unique");
  assert.equal(found?.status, "saved");
  assert.equal(found.title, "Updated title");
});

test("items remain after separate IndexedDB connections and pagination works", async () => {
  await upsertInboxItems(Array.from({ length: 62 }, (_, i) => item("rss:pages:" + i, { receivedAt: 1720000000000 + i })));
  const first = await listInbox("all", "pages", 1);
  const second = await listInbox("all", "pages", 2);
  assert.equal(first.items.length, 50);
  assert.equal(first.hasMore, true);
  assert.equal(second.items.length, 62);
  assert.equal(second.hasMore, false);
});
