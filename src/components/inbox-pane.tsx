"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Archive, Bell, Bookmark, Check, ExternalLink, Inbox, Mail, Plug2, RefreshCw, Rss, Search, Tv } from "lucide-react";
import { useLanguage } from "@/components/language-provider";
import { useNative } from "@/hooks/use-native";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { changeInboxStatus, listInbox } from "@/lib/inbox-store";
import { isNative, isCaptureEnabled, onNotification, openListenerSettings } from "@/lib/native-notifications";
import type { InboxItem, InboxStatus, InboxSource, InboxView } from "@/lib/inbox-types";
import { syncDueSources } from "@/lib/native-sources";
import { openExternalUrl } from "@/lib/open-url";

const views = [
  { view: "today", label: "inboxAll" },
  { view: "missed", label: "inboxMissed" },
  { view: "saved", label: "inboxSaved" },
  { view: "archived", label: "inboxArchived" },
] as const;
const icons: Record<InboxSource, typeof Bell> = { notification: Bell, rss: Rss, gmail: Mail, youtube: Tv };
const sourceLabels = { notification: "inboxSourceNotification", rss: "inboxSourceRss", gmail: "inboxSourceGmail", youtube: "inboxSourceYoutube" } as const;

export function InboxPane({ onBack, onManageSources }: { onBack: () => void; onManageSources: () => void }) {
  const { t, language } = useLanguage();
  const native = useNative();
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
  const [captureEnabled, setCaptureEnabled] = useState(false);
  const refreshPermission = useCallback(() => {
    if (isNative()) void isCaptureEnabled().then(setCaptureEnabled).catch(() => setCaptureEnabled(false));
  }, []);

  useEffect(() => {
    refreshPermission();
    void syncDueSources();
    const refresh = () => setRevision((n) => n + 1);
    const visible = () => {
      if (document.visibilityState === "visible") {
        refreshPermission();
        void syncDueSources();
        refresh();
      }
    };
    let dispose: (() => Promise<void>) | undefined;
    let closed = false;
    void onNotification(refresh).then((cleanup) => { if (closed) void cleanup(); else dispose = cleanup; }).catch(() => {});
    window.addEventListener("al-rawi:inbox-changed", refresh);
    document.addEventListener("visibilitychange", visible);
    return () => {
      closed = true;
      void dispose?.();
      window.removeEventListener("al-rawi:inbox-changed", refresh);
      document.removeEventListener("visibilitychange", visible);
    };
  }, [refreshPermission]);

  useEffect(() => {
    const timeout = window.setTimeout(() => { setDebounced(search); setPage(1); }, 220);
    return () => window.clearTimeout(timeout);
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
    const sections = new Map<string, InboxItem[]>();
    const formatter = new Intl.DateTimeFormat(language === "ar" ? "ar-EG" : "en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
    for (const item of items) {
      const date = formatter.format(new Date(item.receivedAt));
      if (!sections.has(date)) sections.set(date, []);
      sections.get(date)?.push(item);
    }
    return Array.from(sections.entries());
  }, [items, language]);

  const changeStatus = async (item: InboxItem, status: InboxStatus) => {
    try { await changeInboxStatus(item.id, status); setRevision((n) => n + 1); }
    catch { setError(t("inboxError")); }
  };
  const openItem = (item: InboxItem) => {
    if (item.url) {
      void openExternalUrl(item.url).catch(() => setError(t("inboxError")));
    } else setExpanded((current) => current === item.id ? null : item.id);
  };
  const dateTime = new Intl.DateTimeFormat(language === "ar" ? "ar-EG" : "en-US", { hour: "numeric", minute: "2-digit" });

  return (
    <main className="flex min-h-0 min-w-0 flex-1 flex-col bg-paper text-ink">
      <header className="shrink-0 border-b border-border bg-paper">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-start justify-between gap-3 px-5 py-5 sm:px-9 sm:py-7">
          <div className="min-w-0">
            <Button variant="ghost" size="sm" onClick={onBack} className="-ms-3 mb-3 gap-1 text-xs text-ink-subtle lg:hidden">
              <ArrowLeft className="h-4 w-4 rtl:rotate-180" aria-hidden />{t("inboxBack")}
            </Button>
            <p className="mb-1.5 font-mono text-[10px] uppercase tracking-[.16em] text-accent2">{t("uiInboxEyebrow")}</p>
            <h1 className={"text-3xl font-normal tracking-tight sm:text-4xl " + (language === "ar" ? "font-arabic" : "font-serif")}>{t("inbox")}</h1>
            <p className="mt-2 max-w-lg text-sm leading-6 text-ink-subtle">{t("uiInboxSubtitle")}</p>
          </div>
          <div className="flex shrink-0 items-center gap-1.5 pt-1">
            <Button variant="outline" size="sm" className="min-h-10 gap-2 text-xs" onClick={onManageSources}><Plug2 className="h-4 w-4 text-accent2" aria-hidden />{t("uiManageSources")}</Button>
            <Button variant="ghost" size="sm" className="h-10 w-10 p-0" onClick={() => setRevision((n) => n + 1)} aria-label={t("sourcesRefresh")}><RefreshCw className="h-4 w-4" aria-hidden /></Button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-6xl min-h-0 flex-1 flex-col px-5 pt-5 sm:px-9 sm:pt-7">
        {native && !captureEnabled && (
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-s-2 border-accent2 bg-paper-raised px-4 py-3">
            <span className="inline-flex items-center gap-2 text-xs leading-6 text-ink-subtle"><Bell className="h-4 w-4 shrink-0 text-accent2" aria-hidden />{t("inboxPermissionOff")}</span>
            <Button variant="outline" size="sm" onClick={() => void openListenerSettings().catch(() => setError(t("inboxError")))}>{t("inboxEnable")}</Button>
          </div>
        )}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
          <div role="group" aria-label={t("inbox")} className="flex flex-wrap items-center gap-1">
            {views.map(({ view: value, label }) => <button key={value} type="button" aria-pressed={view === value}
              onClick={() => { setView(value); setPage(1); setLoading(true); }}
              className={"min-h-10 rounded-md px-3.5 text-xs font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent2 " + (view === value ? "bg-ink text-paper" : "text-ink-subtle hover:bg-muted hover:text-ink")}>
              {t(label)}
            </button>)}
          </div>
          <div className="relative w-full sm:w-[270px]">
            <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" aria-hidden />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} aria-label={t("inboxSearch")} placeholder={t("uiSearchInbox")} className="min-h-10 ps-9 text-xs" />
          </div>
        </div>
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain pb-24 pt-4 lg:pb-12" aria-busy={loading}>
          <div className="mb-4 flex items-center justify-between gap-2 font-mono text-[10px] uppercase tracking-wider text-ink-faint">
            <span>{t("uiInboxCount", { count: items.length })}</span><span>{t("uiInboxGuide")}</span>
          </div>
          {error && <p role="alert" className="mb-4 border-s-2 border-destructive bg-muted/50 px-3 py-2 text-xs text-destructive">{error}</p>}
          {loading && <p role="status" className="py-8 text-sm text-ink-subtle">{t("uiLoadingInbox")}</p>}
          {!loading && items.length === 0 && (
            <section className="mx-auto flex max-w-sm flex-col items-center gap-4 px-4 py-16 text-center">
              <Inbox className="h-10 w-10 text-accent2" strokeWidth={1.2} aria-hidden />
              <h2 className={"text-2xl text-ink " + (language === "ar" ? "font-arabic" : "font-serif")}>{t("inboxEmpty")}</h2>
              <p className="text-sm leading-7 text-ink-subtle">{t("uiInboxEmptyHelp")}</p>
              <div className="flex flex-wrap justify-center gap-2">
                <Button variant="default" onClick={onBack} className="gap-1.5"><Rss className="h-4 w-4" aria-hidden />{t("uiReading")}</Button>
                <Button variant="outline" onClick={onManageSources}>{t("uiManageSources")}</Button>
              </div>
            </section>
          )}
          {groups.map(([date, cards]) => (
            <section key={date} aria-label={date} className="mb-8">
              <h2 className="border-b border-border pb-2 font-serif text-base font-normal text-ink-subtle">{date}</h2>
              <ul className="divide-y divide-border/70">
                {cards.map((item) => {
                  const Icon = icons[item.source];
                  const expandedItem = expanded === item.id;
                  return <li key={item.id} className="group py-4 sm:py-5">
                    <article className="flex items-start gap-3 sm:gap-5">
                      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border bg-paper-raised text-accent2"><Icon className="h-4 w-4" aria-hidden /></span>
                      <div className="min-w-0 flex-1">
                        <div className="mb-2 flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[10px] text-ink-faint">
                          <span className="font-semibold text-ink-subtle">{t(sourceLabels[item.source])}</span>
                          {item.packageName && <span className="max-w-[180px] truncate">{item.packageName}</span>}
                          <span aria-hidden>·</span>
                          <time dateTime={new Date(item.receivedAt).toISOString()}>{dateTime.format(new Date(item.receivedAt))}</time>
                          {item.status === "saved" && <span className="inline-flex items-center gap-1 text-accent2"><Bookmark className="h-3 w-3" aria-hidden />{t("inboxSaved")}</span>}
                        </div>
                        <button type="button" onClick={() => openItem(item)} className="w-full text-start focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent2">
                          <h3 dir="auto" className="text-sm font-semibold leading-6 text-ink sm:text-base">{item.title || t("inboxSourceNotification")}{item.url && <ExternalLink className="ms-2 inline h-3.5 w-3.5 text-ink-faint" aria-hidden />}</h3>
                          {item.text && <p dir="auto" className={"mt-1 max-w-3xl whitespace-pre-wrap text-xs leading-6 text-ink-subtle sm:text-sm " + (expandedItem ? "" : "line-clamp-2")}>{item.text}</p>}
                        </button>
                        <div className="mt-3 flex flex-wrap items-center gap-1.5">
                          {item.status !== "saved" && <Button variant="outline" size="sm" className="min-h-9 gap-1.5 text-xs" onClick={() => void changeStatus(item, "saved")}><Bookmark className="h-3.5 w-3.5" aria-hidden />{t("inboxSave")}</Button>}
                          {item.status !== "done" && <Button variant="ghost" size="sm" className="min-h-9 gap-1.5 text-xs" onClick={() => void changeStatus(item, "done")}><Check className="h-3.5 w-3.5" aria-hidden />{t("inboxDone")}</Button>}
                          {item.status !== "archived" ? <Button variant="ghost" size="sm" className="min-h-9 gap-1.5 text-xs" onClick={() => void changeStatus(item, "archived")}><Archive className="h-3.5 w-3.5" aria-hidden />{t("inboxArchive")}</Button>
                            : <Button variant="ghost" size="sm" className="min-h-9 text-xs" onClick={() => void changeStatus(item, "new")}>{t("inboxRestore")}</Button>}
                        </div>
                      </div>
                    </article>
                  </li>;
                })}
              </ul>
            </section>
          ))}
          {hasMore && <div className="py-4 text-center"><Button variant="outline" onClick={() => { setPage((n) => n + 1); setLoading(true); }}>{t("inboxMore")}</Button></div>}
        </div>
      </div>
    </main>
  );
}
