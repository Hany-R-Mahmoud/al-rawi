"use client";

import { useEffect } from "react";
import { isNative } from "@/lib/native-notifications";

/** The native app enters its workspace; the browser retains the existing landing page. */
export function NativeEntryRedirect() {
  useEffect(() => {
    if (isNative()) window.location.replace("/reader/");
  }, []);
  return null;
}
