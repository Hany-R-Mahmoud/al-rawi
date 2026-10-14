"use client";

import { AppRouteLink } from "@/components/app-route-link";
import { ArrowUpRight, BookOpenText, Inbox, Plug2, Settings2 } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { useLanguage } from "@/components/language-provider";

type WorkspaceHeaderProps = {
  active: "reader" | "inbox";
  onReader: () => void;
  onInbox: () => void;
  onSources: () => void;
  onSettings: () => void;
};

export function WorkspaceHeader({ active, onReader, onInbox, onSources, onSettings }: WorkspaceHeaderProps) {
  const { t } = useLanguage();
  return (
    <header className="hidden min-h-[74px] shrink-0 items-center justify-between gap-5 border-b border-border bg-paper px-5 lg:flex xl:px-8">
      <div className="flex min-w-0 items-center gap-4">
        <AppRouteLink page="home" className="flex shrink-0 items-center gap-2" aria-label={t("revBackHome")}>
          <BrandLogo className="h-14 w-14" />
          <span className="hidden font-serif text-lg font-semibold text-ink xl:inline">Al-Rawi</span>
        </AppRouteLink>
        <span className="hidden h-7 w-px bg-border xl:block" aria-hidden />
        <nav aria-label={t("uiWorkspaceNavigation")} className="flex items-center gap-1">
          <button type="button" aria-current={active === "reader" ? "page" : undefined} onClick={onReader}
            className={"inline-flex min-h-10 items-center gap-2 rounded-md px-4 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent2 " +
              (active === "reader" ? "bg-ink text-paper" : "text-ink-subtle hover:bg-muted hover:text-ink")}>
            <BookOpenText className="h-[17px] w-[17px]" aria-hidden />{t("uiReading")}
          </button>
          <button type="button" aria-current={active === "inbox" ? "page" : undefined} onClick={onInbox}
            className={"inline-flex min-h-10 items-center gap-2 rounded-md px-4 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent2 " +
              (active === "inbox" ? "bg-ink text-paper" : "text-ink-subtle hover:bg-muted hover:text-ink")}>
            <Inbox className="h-[17px] w-[17px]" aria-hidden />{t("inbox")}
          </button>
        </nav>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <button type="button" onClick={onSources} className="inline-flex min-h-10 items-center gap-2 rounded-md px-3 text-xs font-medium text-ink-subtle transition hover:bg-muted hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent2">
          <Plug2 className="h-4 w-4 text-accent2" aria-hidden />{t("sourcesTitle")}
        </button>
        <button type="button" onClick={onSettings} className="inline-flex min-h-10 items-center gap-2 rounded-md px-3 text-xs font-medium text-ink-subtle transition hover:bg-muted hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent2">
          <Settings2 className="h-4 w-4" aria-hidden />{t("settings")}
        </button>
        <AppRouteLink page="home" className="ms-1 flex h-9 w-9 items-center justify-center rounded-md border border-border text-ink-faint transition hover:border-accent2 hover:text-accent2" aria-label={t("revBackHome")}>
          <ArrowUpRight className="h-4 w-4" aria-hidden />
        </AppRouteLink>
      </div>
    </header>
  );
}
