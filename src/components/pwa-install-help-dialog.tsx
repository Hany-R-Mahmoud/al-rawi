"use client";

import { Check, Clipboard, ExternalLink, Info, Smartphone } from "lucide-react";
import { useState } from "react";
import { useLanguage } from "@/components/language-provider";
import { usePwa } from "@/components/pwa-provider";
import { copyText } from "@/lib/pwa";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function PwaInstallHelpDialog() {
  const { t } = useLanguage();
  const { helpOpen, closeHelp, currentUrl, externalBrowserUrl, isIOS, isLikelyWebView, confirmInstalled } = usePwa();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const didCopy = await copyText(currentUrl);
    setCopied(didCopy);
    if (didCopy) window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <Dialog open={helpOpen} onOpenChange={(open) => { if (!open) closeHelp(); }}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Smartphone className="h-4 w-4" aria-hidden="true" />{t("installHelpTitle")}</DialogTitle>
          <DialogDescription>{t("installHelpDescription")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {isIOS ? (
            <ol className="space-y-2 text-sm leading-6 text-ink-subtle">
              <li><span className="me-2 font-mono text-xs text-accent2">01</span>{t("iosInstallStepOne")}</li>
              <li><span className="me-2 font-mono text-xs text-accent2">02</span>{t("iosInstallStepTwo")}</li>
              <li><span className="me-2 font-mono text-xs text-accent2">03</span>{t("iosInstallStepThree")}</li>
            </ol>
          ) : (
            <p className="text-sm leading-6 text-ink-subtle">{t("browserInstallInstructions")}</p>
          )}

          {isLikelyWebView && (
            <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-3">
              <p className="flex gap-2 text-sm leading-6 text-ink-subtle"><Info className="mt-1 h-4 w-4 shrink-0 text-accent2" aria-hidden="true" />{t("webViewInstallInstructions")}</p>
              <a href={externalBrowserUrl} target="_blank" rel="noopener noreferrer" className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80">{t("openInBrowser")}<ExternalLink className="h-4 w-4" aria-hidden="true" /></a>
            </div>
          )}

          <div className="space-y-2">
            <p className="text-xs text-ink-faint">{t("copyLinkInstruction")}</p>
            <div className="flex items-start gap-2">
              <code dir="ltr" className="min-w-0 flex-1 select-text break-all rounded-md border border-border bg-muted/30 px-2.5 py-2 text-xs leading-5 text-ink">{currentUrl}</code>
              <Button variant="outline" size="icon" onClick={() => void handleCopy()} aria-label={copied ? t("copied") : t("copyLink")}><>{copied ? <Check className="h-4 w-4" aria-hidden="true" /> : <Clipboard className="h-4 w-4" aria-hidden="true" />}</></Button>
            </div>
            <p className="text-xs leading-5 text-ink-faint">{t("selectLinkInstruction")}</p>
          </div>

          <Button variant="ghost" className="w-full" onClick={confirmInstalled}>{t("alreadyInstalled")}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
