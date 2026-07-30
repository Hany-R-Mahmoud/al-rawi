"use client";

import { Download } from "lucide-react";
import { useLanguage } from "@/components/language-provider";
import { usePwa } from "@/components/pwa-provider";
import { Button } from "@/components/ui/button";

export function PwaInstallMenuAction() {
  const { t } = useLanguage();
  const { shouldShowInstallAction, openInstall } = usePwa();
  if (!shouldShowInstallAction) return null;
  return <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => void openInstall()} aria-label={t("installApp")}><Download className="h-4 w-4" aria-hidden="true" /></Button>;
}
