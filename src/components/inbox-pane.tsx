"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Archive, Bookmark, Check, ExternalLink, Eye, EyeOff, Inbox, Mail, Plus, Plug2, RefreshCw, Rss, Search, Share2, Trash2, Tv } from "lucide-react";
import { useLanguage } from "@/components/language-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { InboxDetail } from "@/components/inbox-detail";
import { changeInboxStatus, deleteInboxItem, getInboxItem, listInbox, setInboxRead, upsertInboxItems } from "@/lib/inbox-store";
import type { InboxItem, InboxStatus, InboxSource, InboxView } from "@/lib/inbox-types";
import { syncDueSources } from "@/lib/native-sources";

const views = [
  { view: "all", label: "inboxAll" },
  { view: "unread", label: "hubUnread" },
  { view: "read", label: "hubRead" },
  { view: "saved", label: "inboxSaved" },
  { view: "done", label: "inboxDone" },
  { view: "archived", label: "inboxArchived" },
] as const;

const icons: Record<InboxSource, typeof Mail> = { rss: Rss, gmail: Mail, youtube: Tv, shared: Share2 };
const sourceLabels = { rss: "inboxSourceRss", gmail: "inboxSourceGmail", youtube: "inboxSourceYoutube", shared: "hubShared" } as const;

function manualItem(content: string, title: string): InboxItem {
  const text = content.trim();
  if (!text) throw Error("Content required");
  const urlMatch = text.match(/https?:\/\/[^\s<>"']+/i)?.[0];
  const url = urlMatch && /^https?:$/.test(new URL(urlMatch).protocol) ? urlMatch : undefined;
  return {
    id: "share:" + crypto.randomUUID(),
    source: "shared",
    title: title.trim().slice(0, 280) || (url ? new URL(url).hostname : text.slice(0, 140)),
    text: text.slice(0, 12000),
    url,
    receivedAt: Date.now(),
    readAt: null,
    status: "new",
  };
}

export function InboxPane({ onBack, onManageSources }: { onBack: () => void; onManageSources: () => void }) {
  const { t, language } = useLanguage();
  const [view, setView] = useState<InboxView>("all");
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<InboxItem[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const [selected, setSelected] = useState<InboxItem | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [manualTitle, setManualTitle] = useState("");
  const [manualText, setManualText] = useState("");

  const refresh = useCallback(() => setRevision((n) => n + 1), []);
  useEffect(() => {
    void syncDueSources();
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        void syncDueSources();
        refresh();
      }
    };
    window.addEventListener("al-rawi:inbox-changed", refresh);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("al-rawi:inbox-changed", refresh);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refresh]);

  useEffect(() => {
    const timer = window.setTimeout(() => { setDebounced(search); setPage(1); }, 200);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    let active = true;
    void listInbox(view, debounced, page).then(({ items: latest, hasMore: more }) => {
      if (!active) return;
      setItems(latest);
      setHasMore(more);
      setError("");
    }).catch(() => { if (active) setError(t("inboxError")); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [view, debounced, page, revision, t]);

  const groups = useMemo(() => {
    const dateFormatter = new Intl.DateTimeFormat(language === "ar" ? "ar-EG" : "en-US", { weekday: "long", month: "long", day: "numeric" });
    const grouped = new Map<string, InboxItem[]>();
    for (const item of items) {
      const date = dateFormatter.format(new Date(item.receivedAt));
      if (!grouped.has(date)) grouped.set(date, []);
      grouped.get(date)?.push(item);
    }
    return Array.from(grouped.entries());
  }, [items, language]);

  const onStatus = async (item: InboxItem, status: InboxStatus) => {
    await changeInboxStatus(item.id, status);
    if (selected?.id === item.id) setSelected((current) => current && { ...current, status });
    refresh();
  };
  const onRead = async (item: InboxItem, read: boolean) => {
    await setInboxRead(item.id, read);
    const latest = await getInboxItem(item.id);
    if (selected?.id === item.id) setSelected(latest);
    refresh();
  };
  const open = async (item: InboxItem) => {
    try {
      if (!item.readAt) await setInboxRead(item.id, true);
      setSelected(await getInboxItem(item.id));
    } catch { setError(t("inboxError")); }
  };
  const addManual = async () => {
    try {
      await upsertInboxItems([manualItem(manualText, manualTitle)]);
      setManualTitle("");
      setManualText("");
      setAddOpen(false);
      setView("all");
      refresh();
    } catch { setError(t("hubInvalidEntry")); }
  };

  const dates = new Intl.DateTimeFormat(language === "ar" ? "ar-EG" : "en-US", { hour: "numeric", minute: "2-digit" });
  return (
    <main className="flex min-h-0 min-w-0 flex-1 flex-col bg-paper text-ink">
      <header className="shrink-0 border-b border-border bg-paper">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-start justify-between gap-3 px-5 py-5 sm:px-9 sm:py-7">
          <div className="min-w-0">
            <Button variant="ghost" size="sm" onClick={onBack} className="-ms-3 mb-3 gap-1 text-xs text-ink-subtle lg:hidden"><ArrowLeft className="h-4 w-4 rtl:rotate-180" aria-hidden />{t("inboxBack")}</Button>
            <p className="mb-1.5 font-mono text-[10px] uppercase tracking-[.16em] text-accent2">{t("hubEyebrow")}</p>
            <h1 className={"text-3xl font-normal tracking-tight sm:text-4xl " + (language === "ar" ? "font-arabic" : "font-serif")}>{t("inbox")}</h1>
            <p className="mt-2 max-w-lg text-sm leading-6 text-ink-subtle">{t("hubSubtitle")}</p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2 pt-1">
            <Button variant="default" size="sm" className="min-h-10 gap-2 text-xs" onClick={() => setAddOpen(true)}><Plus className="h-4 w-4" />{t("hubAdd")}</Button>
            <Button variant="outline" size="sm" className="min-h-10 gap-2 text-xs" onClick={onManageSources}><Plug2 className="h-4 w-4" />{t("uiManageSources")}</Button>
            <Button variant="ghost" size="sm" className="h-10 w-10 p-0" onClick={refresh} aria-label={t("sourcesRefresh")}><RefreshCw className="h-4 w-4" /></Button>
          </div>
        </div>
      </header>
      <div className="mx-auto flex w-full max-w-6xl min-h-0 flex-1 flex-col px-5 pt-5 sm:px-9 sm:pt-7">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
          <div role="group" aria-label={t("inbox")} className="flex flex-wrap items-center gap-1">
            {views.map(({ view: value, label }) => (
              <button key={value} type="button" aria-pressed={view === value}
                onClick={() => { setView(value); setPage(1); setLoading(true); }}
                className={"min-h-10 rounded-md px-3 text-xs font-medium transition focus-visible:outline-2 focus-visible:outline-accent2 " +
                (view === value ? "bg-ink text-paper" : "text-ink-subtle hover:bg-muted hover:text-ink")}>{t(label)}</button>
            ))}
          </div>
          <div className="relative w-full sm:w-[270px]">
            <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" aria-hidden />
            <Input value={search} onChange={(event) => setSearch(event.target.value)} aria-label={t("inboxSearch")} placeholder={t("hubSearch")} className="min-h-10 ps-9 text-xs" />
          </div>
        </div>
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain pb-24 pt-4 lg:pb-12" aria-busy={loading}>
          <p className="mb-5 font-mono text-[10px] uppercase tracking-wider text-ink-faint">{t("uiInboxCount", { count: items.length })} · {t("uiInboxGuide")}</p>
          {error && <p role="alert" className="mb-4 border-s-2 border-destructive px-3 py-2 text-xs text-destructive">{error}</p>}
          {loading && <p role="status" className="py-8 text-sm text-ink-subtle">{t("uiLoadingInbox")}</p>}
          {!loading && !items.length && <section className="mx-auto flex max-w-sm flex-col items-center gap-4 px-4 py-16 text-center">
            <Inbox className="h-10 w-10 text-accent2" strokeWidth={1.2} aria-hidden />
            <h2 className={"text-2xl text-ink " + (language === "ar" ? "font-arabic" : "font-serif")}>{t("inboxEmpty")}</h2>
            <p className="text-sm leading-7 text-ink-subtle">{t("hubEmptyHelp")}</p>
            <Button variant="default" onClick={onManageSources}>{t("uiManageSources")}</Button>
          </section>}
          {groups.map(([date, cards]) => <section key={date} className="mb-8" aria-label={date}>
            <h2 className="border-b border-border pb-2 font-serif text-base font-normal text-ink-subtle">{date}</h2>
            <ul className="divide-y divide-border/70">
              {cards.map((item) => {
                const Icon = icons[item.source];
                return <li key={item.id} className="py-4 sm:py-5">
                  <article className="flex items-start gap-3 sm:gap-5">
                    <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border bg-paper-raised text-accent2"><Icon className="h-4 w-4" aria-hidden /></span>
                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex flex-wrap items-center gap-2 font-mono text-[10px] text-ink-faint">
                        <span className="font-semibold">{t(sourceLabels[item.source])}{item.feedTitle ? " · " + item.feedTitle : ""}</span>
                        <span>·</span><time dateTime={new Date(item.receivedAt).toISOString()}>{dates.format(new Date(item.receivedAt))}</time>
                        {!item.readAt && <span className="rounded-full bg-accent2/10 px-2 py-0.5 text-accent2">{t("hubUnread")}</span>}
                        {item.status === "saved" && <span className="inline-flex items-center gap-1 text-accent2"><Bookmark className="h-3 w-3" />{t("inboxSaved")}</span>}
                      </div>
                      <button type="button" onClick={() => void open(item)} className="w-full text-start focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent2">
                        <h3 dir="auto" className={"text-sm leading-6 text-ink sm:text-base " + (item.readAt ? "font-medium" : "font-bold")}>{item.title}<ExternalLink className="ms-2 inline h-3.5 w-3.5 text-ink-faint" aria-hidden /></h3>
                        {item.text && <p dir="auto" className="mt-1 line-clamp-2 max-w-3xl whitespace-pre-wrap text-xs leading-6 text-ink-subtle sm:text-sm">{item.text}</p>}
                      </button>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        <Button variant="outline" size="sm" className="min-h-9 gap-1 text-xs" onClick={() => void onRead(item, !item.readAt).catch(() => setError(t("inboxError")))}>
                          {item.readAt ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}{item.readAt ? t("markUnread") : t("markRead")}
                        </Button>
                        <Button variant="outline" size="sm" className="min-h-9 gap-1 text-xs" onClick={() => void onStatus(item, item.status === "saved" ? "new" : "saved").catch(() => setError(t("inboxError")))}><Bookmark className="h-3.5 w-3.5" />{item.status === "saved" ? t("hubUnsave") : t("inboxSave")}</Button>
                        {item.status !== "done" && <Button variant="ghost" size="sm" className="min-h-9 gap-1 text-xs" onClick={() => void onStatus(item, "done").catch(() => setError(t("inboxError")))}><Check className="h-3.5 w-3.5" />{t("inboxDone")}</Button>}
                        {item.status !== "archived" && <Button variant="ghost" size="sm" className="min-h-9 gap-1 text-xs" onClick={() => void onStatus(item, "archived").catch(() => setError(t("inboxError")))}><Archive className="h-3.5 w-3.5" />{t("inboxArchive")}</Button>}
                        {item.status === "archived" && <Button variant="ghost" size="sm" className="min-h-9 text-xs" onClick={() => void onStatus(item, "new").catch(() => setError(t("inboxError")))}>{t("inboxRestore")}</Button>}
                        {item.source === "shared" && <Button variant="ghost" size="sm" className="min-h-9 gap-1 text-xs text-ink-faint" onClick={() => void deleteInboxItem(item.id).catch(() => setError(t("inboxError")))}><Trash2 className="h-3.5 w-3.5" />{t("hubDelete")}</Button>}
                      </div>
                    </div>
                  </article>
                </li>;
              })}
            </ul>
          </section>)}
          {hasMore && <div className="py-4 text-center"><Button variant="outline" onClick={() => { setPage((p) => p + 1); setLoading(true); }}>{t("inboxMore")}</Button></div>}
        </div>
      </div>

      <InboxDetail item={selected} onClose={() => setSelected(null)} onStatus={onStatus} onRead={onRead} />

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto border-border bg-paper sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl text-ink">{t("hubAddTitle")}</DialogTitle>
            <DialogDescription>{t("hubAddHelp")}</DialogDescription>
          </DialogHeader>
          <label className="space-y-1.5 text-xs text-ink-subtle">{t("hubOptionalTitle")}<Input value={manualTitle} onChange={(event) => setManualTitle(event.target.value)} maxLength={280} /></label>
          <label className="space-y-1.5 text-xs text-ink-subtle">{t("hubLinkOrNote")}
            <textarea className="min-h-[130px] w-full rounded-md border border-border bg-paper-raised p-3 text-sm text-ink focus-visible:outline-2 focus-visible:outline-accent2"
              dir="auto" maxLength={12000} value={manualText} onChange={(event) => setManualText(event.target.value)} />
          </label>
          <Button disabled={!manualText.trim()} onClick={() => void addManual()}>{t("hubSaveItem")}</Button>
        </DialogContent>
      </Dialog>
    </main>
  );
}
