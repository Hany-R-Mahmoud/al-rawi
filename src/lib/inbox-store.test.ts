import "fake-indexeddb/auto";
import assert from "node:assert/strict";
import test from "node:test";
import { changeInboxStatus, deleteInboxItem, getInboxItem, inboxMatches, listInbox, rssInboxItems, setInboxRead, upsertInboxItems } from "./inbox-store";
import type { InboxItem } from "./inbox-types";

const now = 1780000000000;
function item(id: string, override: Partial<InboxItem> = {}): InboxItem {
  return { id, source: "rss", title: "News " + id, text: "Some preview", receivedAt: now, readAt: null, status: "new", ...override };
}

test("read and unread independent of saved/done", () => {
  assert.equal(inboxMatches(item("one"), "unread", ""), true);
  assert.equal(inboxMatches(item("two", { status: "saved", readAt: null }), "unread", ""), true);
  assert.equal(inboxMatches(item("three", { status: "saved", readAt: now }), "saved", ""), true);
  assert.equal(inboxMatches(item("four", { status: "done", readAt: now }), "read", ""), true);
  assert.equal(inboxMatches(item("five", { status: "archived" }), "all", ""), false);
});

test("search filters content without bypassing selected reading status", () => {
  assert.equal(inboxMatches(item("one", { text: "AI books", readAt: now }), "unread", "books"), false);
  assert.equal(inboxMatches(item("one", { text: "AI books", readAt: now }), "read", "BOOKS"), true);
  assert.equal(inboxMatches(item("one", { feedTitle: "Tech Journal" }), "all", "journal"), true);
});

test("RSS content maps to a stable source ID without mutating the reader", () => {
  const articles = [{
    id: "feed:xyz:123", feedId: "feed:xyz", title: "Headline", summary: "excerpt",
    publishedAt: "2026-10-01T10:00:00.000Z", url: "https://example.org/story",
    author: "Writer", content: null, direction: "ltr" as const, language: "en" as const,
    isRead: false, feed: { title: "Example", icon: null },
  }];
  const mapped = rssInboxItems(articles);
  assert.equal(mapped[0].id, "rss:feed:xyz:123");
  assert.equal(mapped[0].feedTitle, "Example");
  assert.equal(mapped[0].readAt, null);
  assert.equal(articles[0].isRead, false);
});

test("source refresh preserves saved and read states", async () => {
  await upsertInboxItems([item("rss:unchanged")]);
  await changeInboxStatus("rss:unchanged", "saved");
  await setInboxRead("rss:unchanged", true);
  await upsertInboxItems([item("rss:unchanged", { title: "Updated title", receivedAt: now + 10000 })]);
  const actual = await getInboxItem("rss:unchanged");
  assert.equal(actual?.status, "saved");
  assert.ok(actual?.readAt);
  assert.equal(actual.title, "Updated title");
  assert.equal(actual.receivedAt, now);
});

test("unread state and archive survive separate DB transactions", async () => {
  await upsertInboxItems([item("rss:read")]);
  await setInboxRead("rss:read", true);
  assert.equal((await listInbox("read", "read")).items.some((entry) => entry.id === "rss:read"), true);
  await setInboxRead("rss:read", false);
  assert.equal((await getInboxItem("rss:read"))?.readAt, null);
  await changeInboxStatus("rss:read", "archived");
  assert.equal((await listInbox("unread", "read")).items.length, 0);
  assert.equal((await listInbox("archived", "read")).items.length, 1);
});

test("user-selected share can be deleted, RSS pagination remains deterministic", async () => {
  await upsertInboxItems([item("share:explicit", { source: "shared" })]);
  await deleteInboxItem("share:explicit");
  assert.equal(await getInboxItem("share:explicit"), null);
  await upsertInboxItems(Array.from({ length: 62 }, (_, i) => item("rss:pages:" + i, { receivedAt: now + i })));
  const first = await listInbox("all", "pages", 1);
  const second = await listInbox("all", "pages", 2);
  assert.equal(first.items.length, 50);
  assert.equal(first.hasMore, true);
  assert.equal(second.items.length, 62);
  assert.equal(second.hasMore, false);
});
