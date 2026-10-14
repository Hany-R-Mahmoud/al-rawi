"use client";

import { useEffect } from "react";
import { hasPendingShares, isNative, listenForShares } from "@/lib/native-shares";

/**
 * Do NOT redirect every native launch to /reader/: Capacitor's asset server
 * maps extensionless paths back to /index.html and causes an infinite reload.
 *
 * Only a real, explicitly shared item should open the workspace directly;
 * an explicit .html URL is a real static file in the Android asset bundle.
 */
export function NativeEntryRedirect() {
  useEffect(() => {
    if (!isNative() || !["/", "/index.html"].includes(window.location.pathname)) return;
    let active = true;
    let navigating = false;
    let unsubscribe: (() => Promise<void>) | undefined;

    const openPendingShare = async () => {
      try {
        if (!active || navigating || !(await hasPendingShares())) return;
        if (active && !navigating) {
          navigating = true;
          window.location.replace("/reader/index.html");
        }
      } catch {
        // Pending shares are durable and can be imported in the workspace.
      }
    };
    // Older native builds could have registered the Web PWA worker under
    // the same origin. Unregister the stale worker and only its static
    // caches, without removing any user's feeds, Inbox or preferences.
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
    // Both a cold share launch and a Share received while Landing is already
    // open should enter the workspace, without navigating for normal launches.
    void listenForShares(() => void openPendingShare()).then((remove) => {
      if (!active) void remove();
      else unsubscribe = remove;
    }).catch(() => {});
    void openPendingShare();
    return () => {
      active = false;
      void unsubscribe?.();
    };
  }, []);
  return null;
}
