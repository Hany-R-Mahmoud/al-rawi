import { Capacitor, registerPlugin, type PluginListenerHandle } from "@capacitor/core";
import type { InboxItem, InboxStatus, InboxView } from "./inbox-types";

type CapturePlugin = {
  isListenerEnabled(): Promise<{ enabled: boolean }>;
  openListenerSettings(): Promise<void>;
  listCaptured(options: { query: string; view: InboxView; limit: number; offset: number }): Promise<{ items: InboxItem[] }>;
  setCapturedStatus(options: { id: string; status: InboxStatus }): Promise<{ updated: boolean }>;
  addListener(event: "notificationReceived", callback: () => void): Promise<PluginListenerHandle>;
};
const capture = registerPlugin<CapturePlugin>("NotificationCapture");
export const isNative = () => Capacitor.isNativePlatform();
export const isCaptureEnabled = async () =>
  isNative() ? (await capture.isListenerEnabled()).enabled : false;
export const openListenerSettings = async () => {
  if (isNative()) await capture.openListenerSettings();
};
export const capturedNotifications = async (query = "", view: InboxView = "today", limit = 101, offset = 0): Promise<InboxItem[]> =>
  isNative() ? (await capture.listCaptured({ query, view, limit, offset })).items : [];
export const setCapturedStatus = async (id: string, status: InboxStatus) =>
  isNative() ? (await capture.setCapturedStatus({ id, status })).updated : false;
export const onNotification = async (callback: () => void): Promise<(() => Promise<void>)> => {
  if (!isNative()) return async () => {};
  const handle = await capture.addListener("notificationReceived", callback);
  return () => handle.remove();
};
