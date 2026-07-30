export const PWA_STORAGE_KEYS = {
  promotionDismissedAt: "al-rawi-pwa-promotion-dismissed-at",
  installedHintAt: "al-rawi-pwa-installed-hint-at",
} as const;

export const PWA_DISMISSAL_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;
export const PWA_INSTALLED_HINT_TTL_MS = 30 * 24 * 60 * 60 * 1000;
export const PWA_HASH_PARAM = "__pwa_hash";

export type InstallPlatform = "android" | "ios" | "desktop";

export type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function isStandaloneEnvironment(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia?.("(display-mode: standalone)").matches === true || Reflect.get(navigator, "standalone") === true;
}

export function isIOSUserAgent(userAgent: string, platform = ""): boolean {
  return /iPad|iPhone|iPod/i.test(userAgent) || (/Macintosh/i.test(userAgent) && /MacIntel/i.test(platform) && navigatorMaxTouchPoints());
}

function navigatorMaxTouchPoints(): boolean {
  return typeof navigator !== "undefined" && navigator.maxTouchPoints > 1;
}

export function isLikelyWebView(userAgent: string): boolean {
  return /;\s*wv\)|\bwv\b|FBAN|FBAV|Instagram|Line\/|Twitter for iPhone|TwitterAndroid|\bGSA\//i.test(userAgent) ||
    (/AppleWebKit/i.test(userAgent) && /Mobile/i.test(userAgent) && !/Safari/i.test(userAgent));
}

export function getInstallPlatform(userAgent: string, platform = ""): InstallPlatform {
  if (isIOSUserAgent(userAgent, platform)) return "ios";
  if (/Android/i.test(userAgent)) return "android";
  return "desktop";
}

export function readTimestamp(storage: Pick<Storage, "getItem"> | null | undefined, key: string, now = Date.now()): number | null {
  try {
    const value = storage?.getItem(key);
    if (!value) return null;
    const timestamp = Number(value);
    return Number.isFinite(timestamp) && timestamp > 0 && timestamp <= now ? timestamp : null;
  } catch {
    return null;
  }
}

export function isWithinTtl(timestamp: number | null, ttlMs: number, now = Date.now()): boolean {
  return timestamp !== null && now - timestamp < ttlMs;
}

export function remainingTtl(timestamp: number | null, ttlMs: number, now = Date.now()): number {
  if (timestamp === null) return 0;
  return Math.max(0, ttlMs - (now - timestamp));
}

export function writeTimestamp(storage: Pick<Storage, "setItem"> | null | undefined, key: string, now = Date.now()): boolean {
  try {
    storage?.setItem(key, String(now));
    return true;
  } catch {
    return false;
  }
}

export function removeStorageValue(storage: Pick<Storage, "removeItem"> | null | undefined, key: string): void {
  try {
    storage?.removeItem(key);
  } catch {
    // Storage can be unavailable in private or embedded browsing contexts.
  }
}

export function buildAndroidIntentUrl(input: string): string | null {
  let pageUrl: URL;
  try {
    pageUrl = new URL(input);
  } catch {
    return null;
  }
  if (!/^https?:$/.test(pageUrl.protocol) || !pageUrl.host) return null;

  const fallbackUrl = new URL(pageUrl.toString());
  fallbackUrl.protocol = "https:";
  if (pageUrl.hash) {
    fallbackUrl.searchParams.set(PWA_HASH_PARAM, pageUrl.hash.slice(1));
    fallbackUrl.hash = "";
  }

  const intentPath = `${pageUrl.host}${pageUrl.pathname}${pageUrl.search}`;
  return `intent://${intentPath}#Intent;scheme=${pageUrl.protocol.slice(0, -1)};action=android.intent.action.VIEW;S.browser_fallback_url=${encodeURIComponent(fallbackUrl.toString())};end`;
}

export function restoreTransportedHash(location: Location, history: Pick<History, "replaceState">): boolean {
  const url = new URL(location.href);
  const transportedHash = url.searchParams.get(PWA_HASH_PARAM);
  if (!transportedHash) return false;
  url.searchParams.delete(PWA_HASH_PARAM);
  url.hash = transportedHash.startsWith("#") ? transportedHash : `#${transportedHash}`;
  history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  return true;
}

export async function copyText(value: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return true;
    }
  } catch {
    // Fall through to the selectable-document fallback.
  }

  try {
    const input = document.createElement("textarea");
    input.value = value;
    input.setAttribute("readonly", "true");
    input.style.position = "fixed";
    input.style.opacity = "0";
    document.body.appendChild(input);
    input.select();
    const copied = document.execCommand("copy");
    input.remove();
    return copied;
  } catch {
    return false;
  }
}

