"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Archive, Bell, Bookmark, Check, ExternalLink, Mail, RefreshCw, Rss, Search, Tv } from "lucide-react";
import { useLanguage } from "@/components/language-provider";
import { useNative } from "@/hooks/use-native";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { changeInboxStatus, listInbox } from "@/lib/inbox-store";
import { isNative, isCaptureEnabled, onNotification, openListenerSettings } from "@/lib/native-notifications";
import type { InboxItem, InboxStatus, InboxSource, InboxView } from "@/lib/inbox-types";
import { syncDueSources } from "@/lib/native-sources";
import { openExternalUrl } from "@/lib/open-url";

const views: Array<{ view: InboxView; key: "inboxAll" | "inboxMissed" | "inboxSaved" | "inboxArchived" }> = [
  { view: "today", key: "inboxAll" },
  { view: "missed", key: "inboxMissed" },
  { view: "saved", key: "inboxSaved" },
  { view: "archived", key: "inboxArchived" },
];
const icons: Record<InboxSource, typeof Bell> = {
  notification: Bell, rss: Rss, gmail: Mail, youtube: Tv,
};
const sourceKeys = {
  notification: "inboxSourceNotification",
  rss: "inboxSourceRss",
  gmail: "inboxSourceGmail",
  youtube: "inboxSourceYoutube",
} as const;

export function InboxPane({ onBack }: { onBack: () => void }) {
  const { t, language } = useLanguage();
  const [view, setView] = useState<InboxView>("today");
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<InboxItem[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const [expanded, setExpanded] = useState<string | null>(null);
  const native = useNative();
  const [captureEnabled, setCaptureEnabled] = useState(false);

  const checkPermission = useCallback(() => {
    if (isNative()) void isCaptureEnabled().then(setCaptureEnabled).catch(() => setCaptureEnabled(false));
  }, []);

  useEffect(() => {
    checkPermission();
    void syncDueSources();
    const visibility = () => {
      if (document.visibilityState === "visible") { checkPermission(); void syncDueSources(); setRevision((v) => v + 1); }
    };
    const updated = () => setRevision((v) => v + 1);
    let remove: (() => Promise<void>) | undefined;
    let disposed = false;
    void onNotification(updated).then((dispose) => {
      if (disposed) void dispose();
      else remove = dispose;
    }).catch(() => {});
    window.addEventListener("al-rawi:inbox-changed", updated);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      disposed = true;
      void remove?.();
      window.removeEventListener("al-rawi:inbox-changed", updated);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, [checkPermission]);

  useEffect(() => {
    const timer = window.setTimeout(() => { setDebounced(search); setPage(1); }, 250);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    let active = true;
    void listInbox(view, debounced, page).then((result) => {
      if (!active) return;
      setItems(result.items);
      setHasMore(result.hasMore);
      setError("");
    }).catch(() => { if (active) setError(t("inboxError")); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [view, debounced, page, revision, t]);

  const groups = useMemo(() => {
    const dates = new Map<string, InboxItem[]>();
    for (const item of items) {
      const key = new Intl.DateTimeFormat(language === "ar" ? "ar-EG" : "en-US", {
        year: "numeric", month: "long", day: "numeric",
      }).format(new Date(item.receivedAt));
      if (!dates.has(key)) dates.set(key, []);
      dates.get(key)?.push(item);
    }
    return Array.from(dates.entries());
  }, [items, language]);

  const setStatus = async (item: InboxItem, status: InboxStatus) => {
    try {
      await changeInboxStatus(item.id, status);
      setRevision((value) => value + 1);
    } catch { setError(t("inboxError")); }
  };

  const openItem = (item: InboxItem) => {
    if (item.url) {
      try {
        const url = new URL(item.url);
        if (url.protocol === "https:" || url.protocol === "http:") void openExternalUrl(url.href);
      } catch { /* Ignore invalid external URL. */ }
    } else {
      setExpanded((current) => current === item.id ? null : item.id);
    }
  };

  return (
    <main className="flex min-h-0 min-w-0 flex-1 flex-col bg-paper text-ink">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-paper px-4 py-3 sm:px-7">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack} className="gap-1 text-xs">
            <ArrowLeft aria-hidden className="h-4 w-4 rtl:rotate-180" />{t("inboxBack")}
          </Button>
          <h1 className="font-serif text-xl font-bold">{t("inbox")}</h1>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setRevision((value) => value + 1)} aria-label={t("sourcesRefresh")}>
          <RefreshCw aria-hidden className="h-4 w-4" />
        </Button>
      </header>
      {native && !captureEnabled && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-paper-raised px-4 py-2 text-xs text-ink-subtle">
          <span>{t("inboxPermissionOff")}</span>
          <Button variant="outline" size="sm" onClick={() => void openListenerSettings().catch(() => setError(t("inboxError")))}>
            {t("inboxEnable")}
          </Button>
        </div>
      )}
      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col overflow-hidden px-4 py-5 sm:px-7">
        <div className="mb-4 flex flex-wrap gap-1.5" role="group" aria-label={t("inbox")}>
          {views.map(({ view: value, key }) => (
            <Button key={value} size="sm" variant={view === value ? "default" : "outline"} aria-pressed={view === value}
              onClick={() => { setView(value); setPage(1); setLoading(true); }}>
              {t(key)}
            </Button>
          ))}
        </div>
        <div className="relative mb-5">
          <Search aria-hidden className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
          <Input aria-label={t("inboxSearch")} value={search} onChange={(event) => setSearch(event.target.value)}
            placeholder={t("inboxSearch")} className="ps-9" />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto pb-16">
          {error && <p role="alert" className="mb-3 text-sm text-destructive">{error}</p>}
          {loading && <p className="text-sm text-ink-faint" role="status">…</p>}
          {!loading && items.length === 0 && (
            <div className="rounded-xl border border-border bg-paper-raised px-4 py-12 text-center">
              <Bell className="mx-auto mb-3 h-7 w-7 text-ink-faint" aria-hidden />
              <p className="text-sm text-ink-subtle">{t("inboxEmpty")}</p>
            </div>
          )}
          <div className="space-y-6">
            {groups.map(([date, cards]) => (
              <section key={date} aria-label={date}>
                <h2 className="mb-2 border-b border-border pb-1.5 font-serif text-sm font-bold text-ink-subtle">{date}</h2>
                <div className="space-y-2">
                  {cards.map((item) => {
                    const Icon = icons[item.source];
                    const open = expanded === item.id;
                    return (
                      <article key={item.id} className="rounded-xl border border-border bg-paper-raised p-3 shadow-xs sm:p-4">
                        <div className="flex gap-3">
                          <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-paper">
                            <Icon aria-hidden className="h-4 w-4 text-accent2" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="mb-1 flex flex-wrap items-center justify-between gap-2 text-[11px] text-ink-faint">
                              <span>{t(sourceKeys[item.source])}{item.packageName ? " · " + item.packageName : ""}</span>
                              <time dateTime={new Date(item.receivedAt).toISOString()}>
                                {new Intl.DateTimeFormat(language === "ar" ? "ar-EG" : "en-US", { hour: "numeric", minute: "2-digit" }).format(new Date(item.receivedAt))}
                              </time>
                            </div>
                            <button type="button" onClick={() => openItem(item)} className="block w-full text-start">
                              <h3 className="text-sm font-semibold leading-relaxed text-ink" dir="auto">{item.title || t("inboxSourceNotification")}</h3>
                              <p className={open ? "mt-1 whitespace-pre-wrap text-xs leading-relaxed text-ink-subtle" : "mt-1 line-clamp-1 text-xs leading-relaxed text-ink-subtle"} dir="auto">{item.text}</p>
                              {item.url && <ExternalLink className="mt-1 h-3 w-3 text-ink-faint" aria-hidden />}
                            </button>
                            <div className="mt-3 flex flex-wrap gap-1.5">
                              {item.status !== "saved" && <Button variant="outline" size="sm" className="h-7 gap-1 text-xs" onClick={() => void setStatus(item, "saved")}><Bookmark className="h-3 w-3" />{t("inboxSave")}</Button>}
                              {item.status !== "done" && <Button variant="outline" size="sm" className="h-7 gap-1 text-xs" onClick={() => void setStatus(item, "done")}><Check className="h-3 w-3" />{t("inboxDone")}</Button>}
                              {item.status !== "archived" && <Button variant="outline" size="sm" className="h-7 gap-1 text-xs" onClick={() => void setStatus(item, "archived")}><Archive className="h-3 w-3" />{t("inboxArchive")}</Button>}
                              {item.status === "archived" && <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => void setStatus(item, "new")}>{t("inboxRestore")}</Button>}
                            </div>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
          {hasMore && <div className="py-4 text-center"><Button variant="outline" onClick={() => { setPage((n) => n + 1); setLoading(true); }}>{t("inboxMore")}</Button></div>}
        </div>
      </div>
    </main>
  );
}
