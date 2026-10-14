"use client";

import { Download, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/components/language-provider";
import { usePwa } from "@/components/pwa-provider";
import { Button } from "@/components/ui/button";

export function PwaInstallPrompt() {
  const { t } = useLanguage();
  const pathname = usePathname();
  const { shouldShowPromotion, openInstall, dismissPromotion } = usePwa();
  // Never obscure workspace navigation or a reader action.
  if (!shouldShowPromotion || pathname.startsWith("/reader")) return null;

  return (
    <div className="fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+0.75rem)] z-30 ms-auto flex max-w-sm items-center gap-3 rounded-lg border border-border bg-paper-raised/95 px-3 py-2.5 text-ink shadow-md backdrop-blur-md sm:inset-x-auto sm:end-5">
      <Download className="hidden h-4 w-4 shrink-0 text-accent2 sm:block" aria-hidden="true" />
      <p className="min-w-0 flex-1 text-xs leading-5">{t("installPromptDescription")}</p>
      <Button size="sm" className="h-8 shrink-0" onClick={() => void openInstall()}>{t("install")}</Button>
      <Button variant="ghost" size="icon-sm" className="shrink-0" onClick={dismissPromotion} aria-label={t("installLater")}><X className="h-4 w-4" aria-hidden="true" /></Button>
    </div>
  );
}
