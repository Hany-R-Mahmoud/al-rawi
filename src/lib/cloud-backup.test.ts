import "fake-indexeddb/auto";
import assert from "node:assert/strict";
import test from "node:test";
import { saveRssBackup } from "./cloud-backup";
import { upsertInboxItems } from "./inbox-store";
import type { InboxItem } from "./inbox-types";

test("backup selects the latest 200 RSS records including archived, before limiting mixed sources", async (t) => {
  // Boundaries: empty, one, over 200 RSS, and over 250 newer private records.
  const uploads: Array<{ items: InboxItem[] }> = [];
  t.mock.method(globalThis, "fetch", async (_url: unknown, request: RequestInit) => {
    uploads.push(JSON.parse(request.body as string));
    return Response.json({});
  });
  await saveRssBackup([]);
  assert.equal(uploads[0].items.length, 0);
  const rssRecords: InboxItem[] = Array.from({ length: 205 }, (_, index) => ({
    id: `rss:backup:${index}`, source: "rss", title: `Article ${index}`, text: "Public",
    receivedAt: 1780000000000 + index, readAt: null,
    status: index % 2 ? "archived" : "saved",
  }));
  await upsertInboxItems(rssRecords.slice(0, 1));
  await saveRssBackup([]);
  assert.equal(uploads[1].items.length, 1);
  await upsertInboxItems([...rssRecords, ...Array.from({ length: 300 }, (_, index): InboxItem => ({
    id: `gmail:backup:${index}`, source: "gmail", title: "Private", text: "Secret",
    receivedAt: 1790000000000 + index, readAt: null, status: "new",
  }))]);
  await saveRssBackup([]);
  assert.deepEqual(uploads[2].items.map((entry) => entry.id), rssRecords.slice(5).reverse().map((entry) => entry.id));
  assert.ok(uploads[2].items.some((entry) => entry.status === "archived"));
  assert.ok(uploads[2].items.every((entry) => entry.source === "rss"));
});
