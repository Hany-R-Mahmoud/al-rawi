import type { Article } from "./reader-types";
import type { InboxItem, InboxStatus, InboxView } from "./inbox-types";
import { capturedNotifications, isNative, setCapturedStatus } from "./native-notifications";

const DB = "al-rawi-inbox";
const STORE = "items";
const PAGE_SIZE = 50;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => {
      const store = req.result.createObjectStore(STORE, { keyPath: "id" });
      store.createIndex("receivedAt", "receivedAt");
      store.createIndex("status", "status");
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? Error("IndexedDB unavailable"));
  });
}

export function inboxMatches(item: InboxItem, view: InboxView, query: string, now = Date.now()): boolean {
  if (query.trim()) return (item.title + " " + item.text + " " + (item.packageName ?? "")).toLocaleLowerCase().includes(query.trim().toLocaleLowerCase());
  if (view === "missed") return item.status === "new" && item.receivedAt < now - 48 * 60 * 60 * 1000;
  if (view === "saved") return item.status === "saved";
  if (view === "archived") return item.status === "archived";
  if (view === "today") return item.status !== "archived";
  return true;
}

/** Upsert source content while preserving any status the user already selected. */
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
        const get = store.get(item.id);
        get.onsuccess = () => {
          const old = get.result as InboxItem | undefined;
          store.put(old ? { ...item, receivedAt: old.receivedAt, status: old.status } : item);
        };
      }
    });
  } finally { db.close(); }
  if (typeof window !== "undefined") window.dispatchEvent(new Event("al-rawi:inbox-changed"));
}

async function browserItems(): Promise<InboxItem[]> {
  const db = await openDb();
  try {
    return await new Promise<InboxItem[]>((resolve, reject) => {
      const request = db.transaction(STORE).objectStore(STORE).getAll();
      request.onsuccess = () => resolve(request.result as InboxItem[]);
      request.onerror = () => reject(request.error);
    });
  } finally { db.close(); }
}

export function rssInboxItems(articles: Article[]): InboxItem[] {
  return articles.map((article) => ({
    id: "rss:" + article.id,
    source: "rss",
    title: article.title,
    text: article.summary || article.feed.title,
    url: article.url || undefined,
    receivedAt: article.publishedAt ? Date.parse(article.publishedAt) || Date.now() : Date.now(),
    status: "new",
  }));
}

export async function listInbox(view: InboxView, query: string, page = 1): Promise<{ items: InboxItem[]; hasMore: boolean }> {
  const cutoff = Math.max(1, page) * PAGE_SIZE;
  // Native SQLite paginates and filters BEFORE shipping results across the bridge.
  const native: InboxItem[] = [];
  if (isNative()) {
    for (let offset = 0; offset <= cutoff; offset += 200) {
      const batch = await capturedNotifications(query, view, Math.min(200, cutoff + 1 - offset), offset);
      native.push(...batch);
      if (batch.length < Math.min(200, cutoff + 1 - offset)) break;
    }
  }
  const web = (await browserItems()).filter((item) => inboxMatches(item, view, query));
  const items = [...native, ...web].sort((a, b) => b.receivedAt - a.receivedAt || a.id.localeCompare(b.id));
  return { items: items.slice(0, cutoff), hasMore: items.length > cutoff };
}

export async function changeInboxStatus(id: string, status: InboxStatus): Promise<void> {
  if (id.startsWith("notification:") && isNative()) {
    const changed = await setCapturedStatus(id, status);
    if (!changed) throw Error("Notification no longer found");
  } else {
    const db = await openDb();
    try {
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE, "readwrite");
        const store = tx.objectStore(STORE);
        const req = store.get(id);
        req.onsuccess = () => {
          const item = req.result as InboxItem | undefined;
          if (item) store.put({ ...item, status });
        };
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } finally { db.close(); }
  }
  if (typeof window !== "undefined") window.dispatchEvent(new Event("al-rawi:inbox-changed"));
}
