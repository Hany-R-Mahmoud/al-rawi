import type { Article } from "./reader-types";
import type { InboxItem, InboxStatus, InboxView } from "./inbox-types";

const DB = "al-rawi-inbox";
const STORE = "items";
const PAGE_SIZE = 50;

function notify() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event("al-rawi:inbox-changed"));
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB, 2);
    request.onupgradeneeded = (event) => {
      const database = request.result;
      if (event.oldVersion < 1) {
        const store = database.createObjectStore(STORE, { keyPath: "id" });
        store.createIndex("receivedAt", "receivedAt");
        store.createIndex("status", "status");
      }
      // Erase legacy notification-derived records if any were ever copied into IndexedDB.
      if (event.oldVersion < 2) {
        const store = request.transaction!.objectStore(STORE);
        store.openCursor().onsuccess = (result) => {
          const cursor = (result.target as IDBRequest<IDBCursorWithValue | null>).result;
          if (!cursor) return;
          const item = cursor.value as { source?: string; id?: string };
          if (item.source === "notification" || item.id?.startsWith("notification:")) cursor.delete();
          cursor.continue();
        };
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? Error("IndexedDB unavailable"));
    request.onblocked = () => reject(Error("Close other Al-Rawi tabs and try again"));
  });
}

export function inboxMatches(item: InboxItem, view: InboxView, query: string): boolean {
  const search = query.trim().toLocaleLowerCase();
  if (search && !(item.title + " " + item.text + " " + (item.feedTitle ?? "")).toLocaleLowerCase().includes(search)) return false;
  if (view === "unread") return !item.readAt && item.status !== "archived";
  if (view === "read") return !!item.readAt && item.status !== "archived";
  if (view === "saved") return item.status === "saved";
  if (view === "done") return item.status === "done";
  if (view === "archived") return item.status === "archived";
  return item.status !== "archived";
}

export async function upsertInboxItems(items: InboxItem[]): Promise<void> {
  if (!items.length) return;
  const db = await openDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      const store = tx.objectStore(STORE);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? Error("Could not save inbox"));
      tx.onabort = () => reject(tx.error ?? Error("Inbox write aborted"));
      for (const item of items) {
        const req = store.get(item.id);
        req.onsuccess = () => {
          const previous = req.result as InboxItem | undefined;
          // Preserve user state and original timestamp across each sync.
          store.put(previous
            ? { ...item, receivedAt: previous.receivedAt, status: previous.status, readAt: previous.readAt ?? null }
            : { ...item, readAt: item.readAt ?? null });
        };
      }
    });
  } finally { db.close(); }
  notify();
}

/**
 * Explicit account restore overrides RSS reading state without replacing
 * device-local Gmail, YouTube, or user-shared records.
 */
export async function applyCloudRssItems(items: InboxItem[]): Promise<void> {
  if (!items.length) return;
  const db = await openDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      const store = tx.objectStore(STORE);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? Error("Could not restore inbox"));
      tx.onabort = () => reject(tx.error ?? Error("Inbox restore aborted"));
      for (const item of items) {
        if (item.source !== "rss" || !item.id.startsWith("rss:")) continue;
        const req = store.get(item.id);
        req.onsuccess = () => {
          const previous = req.result as InboxItem | undefined;
          if (previous && previous.source === "rss") {
            store.put({ ...previous, status: item.status, readAt: item.readAt ?? null });
          } else if (!previous) {
            store.put({ ...item, readAt: item.readAt ?? null });
          }
        };
      }
    });
  } finally { db.close(); }
  notify();
}

async function storedItems(): Promise<InboxItem[]> {
  const db = await openDb();
  try {
    return await new Promise<InboxItem[]>((resolve, reject) => {
      const req = db.transaction(STORE).objectStore(STORE).getAll();
      req.onsuccess = () => resolve((req.result as InboxItem[]).filter((item) =>
        item.source !== ("notification" as string) && !item.id.startsWith("notification:")));
      req.onerror = () => reject(req.error);
    });
  } finally { db.close(); }
}

export function rssInboxItems(articles: Article[]): InboxItem[] {
  return articles.map((article) => ({
    id: "rss:" + article.id,
    source: "rss",
    title: article.title,
    text: article.summary || "",
    url: article.url || undefined,
    receivedAt: article.publishedAt ? Date.parse(article.publishedAt) || Date.now() : Date.now(),
    status: "new",
    readAt: article.isRead ? Date.now() : null,
    author: article.author || undefined,
    feedTitle: article.feed.title,
  }));
}

export async function getInboxItem(id: string): Promise<InboxItem | null> {
  const db = await openDb();
  try {
    return await new Promise((resolve, reject) => {
      const req = db.transaction(STORE).objectStore(STORE).get(id);
      req.onsuccess = () => resolve((req.result as InboxItem | undefined) ?? null);
      req.onerror = () => reject(req.error);
    });
  } finally { db.close(); }
}

export async function listInbox(view: InboxView, query: string, page = 1): Promise<{ items: InboxItem[]; hasMore: boolean }> {
  const cutoff = Math.max(1, page) * PAGE_SIZE;
  const all = (await storedItems()).filter((item) => inboxMatches(item, view, query))
    .sort((a, b) => b.receivedAt - a.receivedAt || a.id.localeCompare(b.id));
  return { items: all.slice(0, cutoff), hasMore: all.length > cutoff };
}

export async function recentRssBackupItems(): Promise<InboxItem[]> {
  return (await storedItems()).filter((entry) => entry.source === "rss")
    .sort((a, b) => b.receivedAt - a.receivedAt || a.id.localeCompare(b.id))
    .slice(0, 200);
}

async function patchInbox(id: string, patch: Partial<InboxItem>): Promise<void> {
  const db = await openDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      const store = tx.objectStore(STORE);
      const req = store.get(id);
      req.onsuccess = () => {
        const item = req.result as InboxItem | undefined;
        if (item) store.put({ ...item, ...patch });
      };
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? Error("Could not update inbox"));
      tx.onabort = () => reject(tx.error ?? Error("Inbox update aborted"));
    });
  } finally { db.close(); }
  notify();
}

export const changeInboxStatus = (id: string, status: InboxStatus) => patchInbox(id, { status });
export const setInboxRead = (id: string, isRead: boolean) =>
  patchInbox(id, { readAt: isRead ? Date.now() : null });

export async function deleteInboxItem(id: string): Promise<void> {
  const db = await openDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } finally { db.close(); }
  notify();
}
