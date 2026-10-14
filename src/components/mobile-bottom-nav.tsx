"use client";

import { Inbox, List, Rss, Search, Settings2, type LucideIcon } from "lucide-react";
import { useLanguage } from "@/components/language-provider";

export type MobileNavSection = "feeds" | "articles" | "inbox" | "search" | "settings";

type MobileBottomNavProps = {
  activeSection: MobileNavSection;
  onOpenFeeds: () => void;
  onOpenArticles: () => void;
  onOpenSearch: () => void;
  onOpenInbox: () => void;
  onOpenSettings: () => void;
};

export function MobileBottomNav({
  activeSection,
  onOpenFeeds,
  onOpenArticles,
  onOpenSearch,
  onOpenInbox,
  onOpenSettings,
}: MobileBottomNavProps) {
  const { t } = useLanguage();
  const items: Array<{ section: MobileNavSection; label: string; icon: LucideIcon; onSelect: () => void }> = [
    { section: "feeds", label: t("feeds"), icon: Rss, onSelect: onOpenFeeds },
    { section: "articles", label: t("articles"), icon: List, onSelect: onOpenArticles },
    { section: "inbox", label: t("inbox"), icon: Inbox, onSelect: onOpenInbox },
    { section: "search", label: t("search"), icon: Search, onSelect: onOpenSearch },
    { section: "settings", label: t("settings"), icon: Settings2, onSelect: onOpenSettings },
  ];

  return (
    <nav
      aria-label={t("mobileNavigation")}
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-paper/95 px-2 pt-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] backdrop-blur-md lg:hidden"
    >
      <div className="mx-auto flex max-w-md items-center gap-1">
        {items.map(({ section, label, icon: Icon, onSelect }) => {
          const active = activeSection === section;
          return (
            <button
              key={section}
              type="button"
              aria-pressed={active}
              className={`flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-md px-1.5 py-1.5 text-[11px] font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring ${active ? "bg-muted text-ink" : "text-ink-faint hover:bg-muted/70 hover:text-ink"}`}
              onClick={onSelect}
            >
              <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
              <span className="max-w-full truncate">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
