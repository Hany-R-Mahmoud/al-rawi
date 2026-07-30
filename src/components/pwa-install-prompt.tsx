"use client";

import { Download, X } from "lucide-react";
import { useLanguage } from "@/components/language-provider";
import { usePwa } from "@/components/pwa-provider";
import { Button } from "@/components/ui/button";

export function PwaInstallPrompt() {
  const { t } = useLanguage();
  const { shouldShowPromotion, openInstall, dismissPromotion } = usePwa();
  if (!shouldShowPromotion) return null;

  return (
    <div className="fixed inset-x-3 top-[calc(env(safe-area-inset-top)+0.75rem)] z-40 mx-auto flex max-w-xl items-center gap-3 rounded-xl border border-border bg-paper-raised/95 px-3 py-2.5 text-ink shadow-lg backdrop-blur-md">
      <Download className="hidden h-4 w-4 shrink-0 text-accent2 sm:block" aria-hidden="true" />
      <p className="min-w-0 flex-1 text-xs leading-5">{t("installPromptDescription")}</p>
      <Button size="sm" className="h-8 shrink-0" onClick={() => void openInstall()}>{t("install")}</Button>
      <Button variant="ghost" size="icon-sm" className="shrink-0" onClick={dismissPromotion} aria-label={t("installLater")}><X className="h-4 w-4" aria-hidden="true" /></Button>
    </div>
  );
}
