"use client";

import { AppRouteLink } from "@/components/app-route-link";
import { ArrowUpRight, Bell, BookOpenText, Bookmark, Inbox, Settings2, type LucideIcon } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { useLanguage } from "@/components/language-provider";

type Destination = "inbox" | "saved" | "reading";
type Props = {
  active: Destination;
  onInbox: () => void;
  onSaved: () => void;
  onReading: () => void;
  onSources: () => void;
  onSettings: () => void;
};

export function WorkspaceHeader({ active, onInbox, onSaved, onReading, onSources, onSettings }: Props) {
  const { t, language } = useLanguage();
  const tabs: Array<{ id: Destination; label: string; icon: LucideIcon; onClick: () => void }> = [
    { id: "inbox", label: t("inbox"), icon: Inbox, onClick: onInbox },
    { id: "saved", label: t("inboxSaved"), icon: Bookmark, onClick: onSaved },
    { id: "reading", label: t("uiReading"), icon: BookOpenText, onClick: onReading },
  ];
  return (
    <header className="hidden min-h-[68px] shrink-0 items-center justify-between gap-3 border-b border-border bg-paper px-5 lg:flex xl:px-8">
      <div className="flex min-w-0 items-center gap-4">
        <button type="button" onClick={onInbox} className="flex shrink-0 items-center gap-2 rounded-md focus-visible:outline-2 focus-visible:outline-accent2" aria-label={t("inbox")}>
          <BrandLogo className="h-12 w-12" /><span className="hidden font-serif text-lg font-semibold xl:inline">Al-Rawi</span>
        </button>
        <nav aria-label={t("uiWorkspaceNavigation")} className="flex items-center gap-1">
          {tabs.map(({ id, label, icon: Icon, onClick }) =>
            <button key={id} type="button" onClick={onClick} aria-current={active === id ? "page" : undefined}
              className={"inline-flex min-h-11 items-center gap-2 rounded-md px-3 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent2 " +
                (active === id ? "bg-ink text-paper" : "text-ink-subtle hover:bg-muted hover:text-ink")}>
              <Icon className="h-[17px] w-[17px]" aria-hidden />{label}
            </button>)}
        </nav>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <button type="button" onClick={onSources} className="inline-flex min-h-11 items-center gap-2 rounded-md px-3 text-xs font-medium text-ink-subtle hover:bg-muted focus-visible:outline-2 focus-visible:outline-accent2">
          <Bell className="h-4 w-4 text-accent2" aria-hidden />{language === "ar" ? "تطبيقات الالتقاط" : "Captured apps"}
        </button>
        <button type="button" onClick={onSettings} aria-label={t("settings")} className="flex h-11 w-11 items-center justify-center rounded-md text-ink-subtle hover:bg-muted focus-visible:outline-2 focus-visible:outline-accent2">
          <Settings2 className="h-5 w-5" aria-hidden />
        </button>
        <AppRouteLink page="home" className="flex h-11 w-11 items-center justify-center rounded-md border border-border text-ink-faint hover:text-accent2 focus-visible:outline-2 focus-visible:outline-accent2" aria-label={language === "ar" ? "عن الراوي" : "About Al-Rawi"}>
          <ArrowUpRight className="h-4 w-4" aria-hidden />
        </AppRouteLink>
      </div>
    </header>
  );
}
