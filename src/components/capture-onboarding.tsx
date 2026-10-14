"use client";

import { useEffect, useState } from "react";
import { Preferences } from "@capacitor/preferences";
import { BellRing, Check, ShieldCheck } from "lucide-react";
import { useLanguage } from "@/components/language-provider";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { isNative, isCaptureEnabled, openListenerSettings } from "@/lib/native-notifications";

const KEY = "al-rawi:capture-onboarding:v1";

export function CaptureOnboarding({ onEnable }: { onEnable: () => void }) {
  const { t, language } = useLanguage();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!isNative()) return;
    let alive = true;
    void (async () => {
      try {
        const seen = await Preferences.get({ key: KEY });
        const enabled = await isCaptureEnabled();
        if (alive && !seen.value && !enabled) setOpen(true);
      } catch { /* No automatic permission request; RSS remains available. */ }
    })();
    return () => { alive = false; };
  }, []);

  const close = async (enable: boolean) => {
    try { await Preferences.set({ key: KEY, value: "seen" }); } catch { /* optional */ }
    setOpen(false);
    if (enable) {
      try { await openListenerSettings(); onEnable(); } catch { /* Settings provides retry. */ }
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) void close(false); }}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto border-border bg-paper sm:max-w-lg">
        <div className="pt-2">
          <div className="mb-7 flex h-12 w-12 items-center justify-center rounded-md border border-border bg-paper-raised text-accent2"><BellRing className="h-6 w-6" aria-hidden /></div>
          <p className="mb-3 font-mono text-[10px] uppercase tracking-[.16em] text-accent2">{t("inboxPermissionSettings")}</p>
          <DialogHeader>
            <DialogTitle className={"text-2xl font-normal leading-snug text-ink sm:text-3xl " + (language === "ar" ? "font-arabic" : "font-serif")}>{t("inboxPermissionTitle")}</DialogTitle>
            <DialogDescription className="mt-2 text-sm leading-7 text-ink-subtle">{t("inboxPermissionText")}</DialogDescription>
          </DialogHeader>
          <ol className="mt-6 space-y-3 border-y border-border py-5">
            <li className="flex items-start gap-3 text-sm text-ink"><Check className="mt-0.5 h-4 w-4 shrink-0 text-accent2" aria-hidden />{t("uiCaptureStepOne")}</li>
            <li className="flex items-start gap-3 text-sm text-ink"><Check className="mt-0.5 h-4 w-4 shrink-0 text-accent2" aria-hidden />{t("uiCaptureStepTwo")}</li>
          </ol>
          <p className="mt-5 flex items-start gap-2 text-xs leading-6 text-ink-subtle"><ShieldCheck className="mt-1 h-4 w-4 shrink-0 text-accent2" aria-hidden />{t("uiCaptureLocalNote")}</p>
          <div className="mt-7 flex flex-col gap-2 sm:flex-row">
            <Button className="min-h-12 flex-1" onClick={() => void close(true)}>{t("inboxEnable")}</Button>
            <Button variant="outline" className="min-h-12 flex-1" onClick={() => void close(false)}>{t("inboxSkip")}</Button>
          </div>
          <p className="mt-4 text-center text-[11px] text-ink-faint">{t("uiCaptureOptional")}</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
