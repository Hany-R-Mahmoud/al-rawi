"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/language-provider";
import { useNative } from "@/hooks/use-native";
import { isCaptureEnabled, isNative, openListenerSettings } from "@/lib/native-notifications";

export function CaptureSettings() {
  const { t } = useLanguage();
  const native = useNative();
  const [enabled, setEnabled] = useState(false);
  const refresh = useCallback(() => {
    if (isNative()) void isCaptureEnabled().then(setEnabled).catch(() => setEnabled(false));
  }, []);
  useEffect(() => {
    refresh();
    const visibility = () => { if (document.visibilityState === "visible") refresh(); };
    document.addEventListener("visibilitychange", visibility);
    return () => document.removeEventListener("visibilitychange", visibility);
  }, [refresh]);
  if (!native) return <p className="border-s-2 border-accent2 bg-muted/45 px-4 py-3 text-sm leading-6 text-ink-subtle">{t("uiCaptureNativeOnly")}</p>;
  return (
    <section className="space-y-4 rounded-md border border-border bg-paper-raised p-5">
      <h3 className="font-serif text-lg text-ink">{t("inboxPermissionSettings")}</h3>
      <p className="text-xs text-ink-subtle">{t("inboxPermissionHint")}</p>
      <p role="status" className={"inline-flex rounded-md px-3 py-2 text-xs font-medium " + (enabled ? "bg-accent2/10 text-accent2" : "bg-muted text-ink-subtle")}>{enabled ? t("inboxPermissionOn") : t("inboxPermissionOff")}</p>
      <Button size="sm" variant="outline" className="min-h-10" onClick={() => void openListenerSettings()}>{t("inboxEnable")}</Button>
    </section>
  );
}
