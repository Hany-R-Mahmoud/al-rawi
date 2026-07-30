"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  buildAndroidIntentUrl,
  getInstallPlatform,
  isIOSUserAgent,
  isLikelyWebView,
  isStandaloneEnvironment,
  PWA_DISMISSAL_COOLDOWN_MS,
  PWA_INSTALLED_HINT_TTL_MS,
  PWA_STORAGE_KEYS,
  readTimestamp,
  remainingTtl,
  removeStorageValue,
  restoreTransportedHash,
  type BeforeInstallPromptEvent,
  isWithinTtl,
  writeTimestamp,
} from "@/lib/pwa";

type PwaContextValue = {
  canInstall: boolean;
  helpOpen: boolean;
  isStandalone: boolean;
  isLikelyWebView: boolean;
  isIOS: boolean;
  shouldShowInstallAction: boolean;
  shouldShowPromotion: boolean;
  isOnline: boolean;
  currentUrl: string;
  externalBrowserUrl: string;
  openInstall: () => Promise<void>;
  openHelp: () => void;
  closeHelp: () => void;
  dismissPromotion: () => void;
  confirmInstalled: () => void;
};

const PwaContext = createContext<PwaContextValue | null>(null);

export function PwaProvider({ children }: { children: ReactNode }) {
  const deferredPrompt = useRef<BeforeInstallPromptEvent | null>(null);
  const sessionDismissedAt = useRef<number | null>(null);
  const sessionInstalledHintAt = useRef<number | null>(null);
  const [canInstall, setCanInstall] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [dismissedAt, setDismissedAt] = useState<number | null>(null);
  const [installedHintAt, setInstalledHintAt] = useState<number | null>(null);
  const [dismissalTick, setDismissalTick] = useState(0);
  const [currentUrl, setCurrentUrl] = useState("");
  const [platform, setPlatform] = useState<"android" | "ios" | "desktop">("desktop");
  const [webView, setWebView] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  const reconcile = useCallback(() => {
    if (typeof window === "undefined") return;
    const now = Date.now();
    const storage = getLocalStorage();
    const nextDismissedAt = storage ? readTimestamp(storage, PWA_STORAGE_KEYS.promotionDismissedAt, now) : sessionDismissedAt.current;
    const nextInstalledHintAt = storage ? readTimestamp(storage, PWA_STORAGE_KEYS.installedHintAt, now) : sessionInstalledHintAt.current;
    setIsStandalone(isStandaloneEnvironment());
    setDismissedAt(nextDismissedAt);
    setInstalledHintAt(nextInstalledHintAt);
    setCurrentUrl(window.location.href);
    setPlatform(getInstallPlatform(navigator.userAgent, navigator.platform));
    setWebView(isLikelyWebView(navigator.userAgent));
    setIsOnline(navigator.onLine);
    setDismissalTick((tick) => tick + 1);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    restoreTransportedHash(window.location, window.history);
    window.queueMicrotask(reconcile);

    const handleBeforeInstallPrompt = (event: Event) => {
      const installEvent = event as BeforeInstallPromptEvent;
      if (typeof installEvent.prompt !== "function" || !installEvent.userChoice) return;
      event.preventDefault();
      deferredPrompt.current = installEvent;
      setCanInstall(true);
      sessionInstalledHintAt.current = null;
      removeStorageValue(getLocalStorage(), PWA_STORAGE_KEYS.installedHintAt);
      setInstalledHintAt(null);
    };
    const handleAppInstalled = () => {
      deferredPrompt.current = null;
      setCanInstall(false);
      setIsStandalone(true);
      const now = Date.now();
      sessionInstalledHintAt.current = now;
      writeTimestamp(getLocalStorage(), PWA_STORAGE_KEYS.installedHintAt, now);
      setInstalledHintAt(now);
      removeStorageValue(getLocalStorage(), PWA_STORAGE_KEYS.promotionDismissedAt);
      sessionDismissedAt.current = null;
      setDismissedAt(null);
    };
    const handlePageShow = () => reconcile();
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") reconcile();
    };
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);
    window.addEventListener("pageshow", handlePageShow);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      void navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch(() => undefined);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
      window.removeEventListener("pageshow", handlePageShow);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [reconcile]);

  useEffect(() => {
    const remaining = remainingTtl(dismissedAt, PWA_DISMISSAL_COOLDOWN_MS);
    if (!remaining) return;
    const timeout = window.setTimeout(() => setDismissalTick((tick) => tick + 1), remaining + 10);
    return () => window.clearTimeout(timeout);
  }, [dismissedAt, dismissalTick]);

  const dismissPromotion = useCallback(() => {
    const now = Date.now();
    sessionDismissedAt.current = now;
    if (typeof window !== "undefined") writeTimestamp(getLocalStorage(), PWA_STORAGE_KEYS.promotionDismissedAt, now);
    setDismissedAt(now);
  }, []);

  const confirmInstalled = useCallback(() => {
    const now = Date.now();
    sessionInstalledHintAt.current = now;
    if (typeof window !== "undefined") writeTimestamp(getLocalStorage(), PWA_STORAGE_KEYS.installedHintAt, now);
    setInstalledHintAt(now);
    setHelpOpen(false);
  }, []);

  const openInstall = useCallback(async () => {
    const prompt = deferredPrompt.current;
    if (!prompt) {
      setHelpOpen(true);
      return;
    }
    deferredPrompt.current = null;
    setCanInstall(false);
    try {
      await prompt.prompt();
      const result = await prompt.userChoice;
      if (result.outcome === "dismissed") dismissPromotion();
    } catch {
      setHelpOpen(true);
    }
  }, [dismissPromotion]);

  const isIOS = platform === "ios" || (typeof navigator !== "undefined" && isIOSUserAgent(navigator.userAgent, navigator.platform));
  const installedHintActive = isWithinTtl(installedHintAt, PWA_INSTALLED_HINT_TTL_MS);
  const dismissalActive = isWithinTtl(dismissedAt, PWA_DISMISSAL_COOLDOWN_MS);
  const mounted = currentUrl !== "";
  const shouldShowInstallAction = mounted && !isStandalone && !installedHintActive;
  const shouldShowPromotion = shouldShowInstallAction && !dismissalActive;
  const externalBrowserUrl = platform === "android" && webView ? buildAndroidIntentUrl(currentUrl) || currentUrl : currentUrl;

  const value = useMemo<PwaContextValue>(() => ({
    canInstall,
    helpOpen,
    isStandalone,
    isLikelyWebView: webView,
    isIOS,
    shouldShowInstallAction,
    shouldShowPromotion,
    isOnline,
    currentUrl,
    externalBrowserUrl,
    openInstall,
    openHelp: () => setHelpOpen(true),
    closeHelp: () => setHelpOpen(false),
    dismissPromotion,
    confirmInstalled,
  }), [canInstall, confirmInstalled, currentUrl, dismissPromotion, externalBrowserUrl, helpOpen, isIOS, isOnline, isStandalone, openInstall, shouldShowInstallAction, shouldShowPromotion, webView]);

  return <PwaContext.Provider value={value}>{children}</PwaContext.Provider>;
}

export function usePwa() {
  const context = useContext(PwaContext);
  if (!context) throw new Error("usePwa must be used inside PwaProvider");
  return context;
}

function getLocalStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}
