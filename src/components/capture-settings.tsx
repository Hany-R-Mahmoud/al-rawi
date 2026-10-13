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
  if (!native) return null;
  return (
    <section className="space-y-2">
      <h3 className="text-sm font-semibold">{t("inboxPermissionSettings")}</h3>
      <p className="text-xs text-ink-subtle">{t("inboxPermissionHint")}</p>
      <p className="text-xs text-ink-subtle">{enabled ? t("inboxPermissionOn") : t("inboxPermissionOff")}</p>
      <Button size="sm" variant="outline" onClick={() => void openListenerSettings()}>{t("inboxEnable")}</Button>
    </section>
  );
}
