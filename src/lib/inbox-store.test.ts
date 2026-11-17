import "fake-indexeddb/auto";
import assert from "node:assert/strict";
import test from "node:test";
import { changeInboxStatus, deleteInboxItem, getInboxItem, inboxMatches, listInbox, rssInboxItems, setInboxRead, upsertInboxItems } from "./inbox-store";
import type { InboxItem } from "./inbox-types";

const now = 1780000000000;
function item(id: string, override: Partial<InboxItem> = {}): InboxItem {
  return { id, source: "rss", title: "News " + id, text: "Some preview", receivedAt: now, readAt: null, status: "new", ...override };
}

// Upgrade an existing version-2 database without deleting pre-existing notifications.
test("version 2 to 3 preserves captured notifications and their states", async () => {
  const id = "notification:seeded";
  const setup = indexedDB.open("al-rawi-inbox", 2);
  await new Promise<void>((resolve, reject) => {
    setup.onupgradeneeded = () => {
      const store = setup.result.createObjectStore("items", { keyPath: "id" });
      store.createIndex("receivedAt", "receivedAt");
      store.createIndex("status", "status");
    };
    setup.onsuccess = () => {
      const database = setup.result;
      const tx = database.transaction("items", "readwrite");
      tx.objectStore("items").put(item(id, {
        source: "notification", title: "Channel update", text: "New video",
        feedTitle: "YouTube", packageName: "com.google.android.youtube",
        status: "saved", readAt: now,
      }));
      tx.oncomplete = () => { database.close(); resolve(); };
      tx.onerror = () => reject(tx.error);
    };
    setup.onerror = () => reject(setup.error);
  });
  assert.equal((await getInboxItem(id))?.status, "saved");
  assert.equal((await listInbox("saved", "youtube")).items.some((value) => value.id === id), true);
  assert.equal((await listInbox("unread", "channel")).items.some((value) => value.id === id), false);
  await deleteInboxItem(id);
});

test("captured notification upsert preserves status, readAt and receivedAt", async () => {
  const id = "notification:stable";
  const capture = item(id, { source: "notification", title: "Old", feedTitle: "Gmail",
    packageName: "com.google.android.gm" });
  await upsertInboxItems([capture]);
  await changeInboxStatus(id, "saved");
  await setInboxRead(id, true);
  const before = await getInboxItem(id);
  await upsertInboxItems([{ ...capture, title: "Updated", receivedAt: now + 12000, status: "new", readAt: null }]);
  const after = await getInboxItem(id);
  assert.equal(after?.title, "Updated");
  assert.equal(after?.status, "saved");
  assert.equal(after?.readAt, before?.readAt);
  assert.equal(after?.receivedAt, before?.receivedAt);
  await changeInboxStatus(id, "done");
  assert.equal((await listInbox("done", "gmail")).items.some((value) => value.id === id), true);
  await changeInboxStatus(id, "archived");
  assert.equal((await listInbox("all", "gmail")).items.some((value) => value.id === id), false);
  assert.equal((await listInbox("archived", "gmail")).items.some((value) => value.id === id), true);
  await deleteInboxItem(id);
});

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

test("notification picture survives round-trip and repost without losing state", async () => {
  const id = "notification:picture-fixture";
  const image = { kind: "picture" as const, dataUrl: "data:image/jpeg;base64,YWJjZA==" };
  await upsertInboxItems([item(id, { source: "notification", media: image, title: "Old", status: "new" })]);
  await changeInboxStatus(id, "saved");
  await setInboxRead(id, true);
  const before = await getInboxItem(id);
  assert.deepEqual(before?.media, image);
  await upsertInboxItems([item(id, { source: "notification", title: "Updated", receivedAt: now + 10000, media: {
    kind: "largeIcon", dataUrl: "data:image/png;base64,YWJjZA=="
  } })]);
  const after = await getInboxItem(id);
  assert.equal(after?.status, "saved");
  assert.equal(after?.readAt, before?.readAt);
  assert.equal(after?.receivedAt, before?.receivedAt);
  assert.equal(after?.media?.kind, "largeIcon");
  assert.equal((await listInbox("saved", "updated")).items.some((entry) => entry.id === id), true);
  await upsertInboxItems([item(id, { source: "notification", title: "Third", media: undefined })]);
  assert.equal((await getInboxItem(id))?.media?.kind, "largeIcon");
  await upsertInboxItems([item(id, { source: "notification", title: "Quota retry" })], { dropMedia: true });
  assert.equal((await getInboxItem(id))?.media, undefined);
  await deleteInboxItem(id);
});

test("cursor pagination stays deterministic when timestamps tie across media items", async () => {
  const prefix = "notification:tie:";
  await upsertInboxItems(Array.from({ length: 55 }, (_, index) => item(prefix + String(index).padStart(2, "0"), {
    source: "notification",
    receivedAt: now + 99999999,
    media: index % 2 ? { kind: "appIcon", dataUrl: "data:image/png;base64,YQ==" } : undefined,
  })));
  const first = await listInbox("all", "tie", 1);
  const second = await listInbox("all", "tie", 2);
  assert.equal(first.items.length, 50);
  assert.equal(first.hasMore, true);
  assert.equal(second.items.length, 55);
  assert.equal(second.hasMore, false);
  assert.deepEqual(second.items.map((entry) => entry.id), [...second.items.map((entry) => entry.id)].sort());
  await Promise.all(second.items.map((entry) => deleteInboxItem(entry.id)));
});
