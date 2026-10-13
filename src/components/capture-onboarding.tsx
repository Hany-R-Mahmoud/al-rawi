"use client";

import { useEffect, useState } from "react";
import { Preferences } from "@capacitor/preferences";
import { useLanguage } from "@/components/language-provider";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { isNative, isCaptureEnabled, openListenerSettings } from "@/lib/native-notifications";

const ONBOARDING_KEY = "al-rawi:capture-onboarding:v1";

export function CaptureOnboarding({ onEnable }: { onEnable: () => void }) {
  const { t } = useLanguage();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!isNative()) return;
    let live = true;
    void (async () => {
      try {
        const flag = await Preferences.get({ key: ONBOARDING_KEY });
        const enabled = await isCaptureEnabled();
        if (live && !flag.value && !enabled) setShow(true);
      } catch { /* Android may deny access; RSS remains available. */ }
    })();
    return () => { live = false; };
  }, []);

  const continueApp = async (enable: boolean) => {
    try { await Preferences.set({ key: ONBOARDING_KEY, value: "seen" }); } catch { /* Nonfatal */ }
    setShow(false);
    if (enable) {
      try { await openListenerSettings(); onEnable(); } catch { /* Can retry in Settings */ }
    }
  };

  return (
    <Dialog open={show} onOpenChange={(next) => { if (!next) void continueApp(false); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("inboxPermissionTitle")}</DialogTitle>
          <DialogDescription className="leading-relaxed">{t("inboxPermissionText")}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2 pt-3">
          <Button onClick={() => void continueApp(true)}>{t("inboxEnable")}</Button>
          <Button variant="outline" onClick={() => void continueApp(false)}>{t("inboxSkip")}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
