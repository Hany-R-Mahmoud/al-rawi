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
  mediaKind?: string;
  mediaB64?: string;
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

/**
 * Validate optional media from the trusted native bridge before constructing
 * a local data URL. Reject malformed or oversized payloads, not the text item.
 */
export function captureMedia(record: CapturedRecord): InboxItem["media"] {
  const kind = record.mediaKind;
  const payload = record.mediaB64;
  if (kind !== "picture" && kind !== "largeIcon" && kind !== "appIcon") return undefined;
  if (!payload || payload.length > 400 * 1024 || payload.length % 4 !== 0) return undefined;
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(payload)) return undefined;
  return { kind, dataUrl: `data:image/${kind === "picture" ? "jpeg" : "png"};base64,${payload}` };
}

function mapCapture(item: CapturedRecord): InboxItem {
  return {
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
    media: captureMedia(item),
  };
}

let activeImport: Promise<number> | null = null;
let importAgain = false;

/** The native queue is acknowledged strictly after durable IndexedDB writes. */
export function importPendingCaptures(): Promise<number> {
  if (!isNative()) return Promise.resolve(0);
  if (activeImport) { importAgain = true; return activeImport; }
  activeImport = (async () => {
    let total = 0;
    do {
      importAgain = false;
      while (true) {
        // 10 x 400 KiB Base64 <= approximately 4 MiB per native bridge batch.
        const { items } = await capture.listCaptured({ limit: 10 });
        const mapped = items.filter((item) => item.id.startsWith("notification:")).map(mapCapture);
        if (!mapped.length) break;
        try {
          await upsertInboxItems(mapped);
        } catch {
          // A single quota/storage retry may discard optional media, never text.
          await upsertInboxItems(mapped.map(({ media: _media, ...item }) => item), { dropMedia: true });
        }
        const { remaining } = await capture.ackImported({ ids: mapped.map((item) => item.id) });
        total += mapped.length;
        if (!remaining) break;
        // Yield so large pending queues do not starve input or WebView painting.
        await new Promise<void>((resolve) => setTimeout(resolve, 0));
      }
    } while (importAgain);
    return total;
  })().finally(() => { activeImport = null; });
  return activeImport;
}

export async function listenForCaptures(callback: () => void): Promise<() => Promise<void>> {
  if (!isNative()) return async () => {};
  const handle = await capture.addListener("captureReceived", callback);
  return () => handle.remove();
}
