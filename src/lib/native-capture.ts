import { registerPlugin, type PluginListenerHandle } from "@capacitor/core";
import { isNative } from "./native-shares";
import { upsertInboxItems } from "./inbox-store";
import type { InboxItem } from "./inbox-types";

export type CapturedRecord = {
  id: string;
  packageName: string;
  appLabel: string;
  title: string;
  text: string;
  url: string;
  postedAt: number;
};
export type CaptureApp = { packageName: string; label: string };

type CapturePlugin = {
  isListenerEnabled(): Promise<{ enabled: boolean }>;
  openListenerSettings(): Promise<void>;
  getCapturePackages(): Promise<{ packages: string[] }>;
  setCapturePackages(options: { packages: string[] }): Promise<{ packages: string[] }>;
  listLaunchableApps(): Promise<{ apps: CaptureApp[] }>;
  listCaptured(options: { limit?: number }): Promise<{ items: CapturedRecord[] }>;
  ackImported(options: { ids: string[] }): Promise<{ remaining: number }>;
  openApp(options: { packageName: string }): Promise<void>;
  addListener(event: "captureReceived", callback: () => void): Promise<PluginListenerHandle>;
};

const capture = registerPlugin<CapturePlugin>("NotificationCapture");
export const isCaptureNative = isNative;
export const isListenerEnabled = () => capture.isListenerEnabled();
export const openListenerSettings = () => capture.openListenerSettings();
export const getCapturePackages = () => capture.getCapturePackages();
export const setCapturePackages = (packages: string[]) => capture.setCapturePackages({ packages });
export const listLaunchableApps = () => capture.listLaunchableApps();
export const openCapturedApp = (packageName: string) => capture.openApp({ packageName });

/** Native rows are acknowledged only AFTER IndexedDB finishes its transaction. */
export async function importPendingCaptures(): Promise<number> {
  if (!isNative()) return 0;
  const { items } = await capture.listCaptured({ limit: 500 });
  const mapped: InboxItem[] = items.filter((item) => item.id.startsWith("notification:")).map((item) => ({
    id: item.id,
    source: "notification",
    title: item.title,
    text: item.text,
    url: item.url || undefined,
    receivedAt: item.postedAt,
    status: "new",
    readAt: null,
    feedTitle: item.appLabel,
    packageName: item.packageName,
  }));
  if (!mapped.length) return 0;
  await upsertInboxItems(mapped);
  await capture.ackImported({ ids: mapped.map((item) => item.id) });
  return mapped.length;
}

export async function listenForCaptures(callback: () => void): Promise<() => Promise<void>> {
  if (!isNative()) return async () => {};
  const handle = await capture.addListener("captureReceived", callback);
  return () => handle.remove();
}
