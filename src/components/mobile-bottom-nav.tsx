"use client";

import { BookOpenText, Bookmark, Inbox, Settings2, type LucideIcon } from "lucide-react";
import { useLanguage } from "@/components/language-provider";

export type MobileNavSection = "inbox" | "saved" | "reading" | "settings";

type Props = {
  activeSection: MobileNavSection;
  onOpenInbox: () => void;
  onOpenSaved: () => void;
  onOpenReading: () => void;
  onOpenSettings: () => void;
};

export function MobileBottomNav({ activeSection, onOpenInbox, onOpenSaved, onOpenReading, onOpenSettings }: Props) {
  const { t } = useLanguage();
  const items: Array<{ section: MobileNavSection; label: string; icon: LucideIcon; onSelect: () => void }> = [
    { section: "inbox", label: t("inbox"), icon: Inbox, onSelect: onOpenInbox },
    { section: "saved", label: t("inboxSaved"), icon: Bookmark, onSelect: onOpenSaved },
    { section: "reading", label: t("uiReading"), icon: BookOpenText, onSelect: onOpenReading },
    { section: "settings", label: t("settings"), icon: Settings2, onSelect: onOpenSettings },
  ];
  return (
    <nav aria-label={t("mobileNavigation")}
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-paper/95 px-2 pt-1.5 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] backdrop-blur-md lg:hidden">
      <div className="mx-auto flex max-w-md items-center gap-1">
        {items.map(({ section, label, icon: Icon, onSelect }) => (
          <button key={section} type="button" aria-current={activeSection === section ? "page" : undefined}
            onClick={onSelect}
            className={"flex min-h-12 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-md px-1 text-[11px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent2 " +
              (activeSection === section ? "bg-muted text-ink" : "text-ink-faint hover:bg-muted/70 hover:text-ink")}>
            <Icon className="h-5 w-5" aria-hidden />
            <span className="max-w-full truncate">{label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
