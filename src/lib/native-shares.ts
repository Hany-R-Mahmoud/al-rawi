import { Capacitor, registerPlugin, type PluginListenerHandle } from "@capacitor/core";
import { upsertInboxItems } from "./inbox-store";
import type { InboxItem } from "./inbox-types";

type SharedRecord = { id: string; title: string; text: string; url?: string; receivedAt: number };
type SharedPlugin = {
  listPending(): Promise<{ items: SharedRecord[] }>;
  ackPending(options: { ids: string[] }): Promise<{ remaining: number }>;
  addListener(event: "shareReceived", callback: () => void): Promise<PluginListenerHandle>;
};
const shared = registerPlugin<SharedPlugin>("SharedContent");

export const isNative = () => Capacitor.isNativePlatform();

/** Native queue is only acknowledged AFTER IndexedDB successfully persists every item. */
export async function importPendingShares(): Promise<number> {
  if (!isNative()) return 0;
  const { items } = await shared.listPending();
  if (!items.length) return 0;
  const mapped: InboxItem[] = items.filter((item) => item.id.startsWith("share:")).map((item) => ({
    id: item.id,
    source: "shared",
    title: item.title,
    text: item.text,
    url: item.url || undefined,
    receivedAt: item.receivedAt,
    status: "new",
    readAt: null,
  }));
  await upsertInboxItems(mapped);
  await shared.ackPending({ ids: mapped.map((item) => item.id) });
  return mapped.length;
}

export async function listenForShares(callback: () => void): Promise<() => Promise<void>> {
  if (!isNative()) return async () => {};
  const handle = await shared.addListener("shareReceived", callback);
  return () => handle.remove();
}
