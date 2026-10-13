import { Browser } from "@capacitor/browser";
import { Capacitor } from "@capacitor/core";

/** Open external content in native Custom Tabs or a regular browser tab. */
export async function openExternalUrl(value: string): Promise<void> {
  let url: URL;
  try { url = new URL(value); }
  catch { return; }
  if (url.protocol !== "http:" && url.protocol !== "https:") return;
  if (Capacitor.isNativePlatform()) {
    await Browser.open({ url: url.href });
  } else {
    window.open(url.href, "_blank", "noopener,noreferrer");
  }
}
