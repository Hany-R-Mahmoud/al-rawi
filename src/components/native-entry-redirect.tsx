"use client";

import { useEffect } from "react";
import { isNative } from "@/lib/native-shares";

/**
 * Capacitor maps extensionless routes back to /index.html. Navigate only from
 * the exported root entry and use the real /reader/index.html asset.
 * The explicitly opened /landing/index.html About page remains untouched.
 */
export function NativeEntryRedirect() {
  useEffect(() => {
    if (!isNative() || !["/", "/index.html"].includes(window.location.pathname)) return;
    // Remove stale web PWA workers/caches without touching user data.
    if ("serviceWorker" in navigator) {
      void navigator.serviceWorker.getRegistrations()
        .then((registrations) => Promise.all(registrations.map((entry) => entry.unregister())))
        .catch(() => {});
    }
    if ("caches" in window) {
      void window.caches.keys()
        .then((keys) => Promise.all(keys.filter((key) => key.startsWith("al-rawi-pwa-")).map((key) => window.caches.delete(key))))
        .catch(() => {});
    }
    window.location.replace("/reader/index.html");
  }, []);
  return null;
}
