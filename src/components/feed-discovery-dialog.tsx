"use client";

import { ExternalLink, Loader2, Plus, Rss, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { useLanguage } from "@/components/language-provider";
import { FEED_CATALOG, FEED_PRESETS, getCatalogFeed, type FeedCatalogCategory, type FeedCatalogItem } from "@/lib/feed-catalog";
import type { TranslationKey } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

type DiscoveryMode = "presets" | "catalog" | "url";

type FeedDiscoveryDialogProps = Readonly<{
  existingUrls: ReadonlySet<string>;
  onAddFeed: (url: string, title?: string, category?: string) => Promise<void>;
  onAddCatalogFeeds: (feeds: readonly FeedCatalogItem[]) => Promise<void>;
}>;

const categoryLabels: Record<FeedCatalogCategory, TranslationKey> = {
  technology: "technologyCategory",
  design: "designCategory",
  world: "worldCategory",
  arabic: "arabicCategory",
};

const categories: readonly (FeedCatalogCategory | "all")[] = ["all", "technology", "design", "world", "arabic"];

export function FeedDiscoveryDialog({ existingUrls, onAddFeed, onAddCatalogFeeds }: FeedDiscoveryDialogProps) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<DiscoveryMode>("presets");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<FeedCatalogCategory | "all">("all");
  const [pendingId, setPendingId] = useState("");
  const [error, setError] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState("");

  const filteredFeeds = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return FEED_CATALOG.filter((feed) => {
      const matchesCategory = category === "all" || feed.category === category;
      const matchesQuery = !normalizedQuery || `${feed.title} ${feed.category} ${feed.language}`.toLowerCase().includes(normalizedQuery);
      return matchesCategory && matchesQuery;
    });
  }, [category, query]);

  const addCatalogItems = async (items: readonly FeedCatalogItem[], actionId: string) => {
    const availableItems = items.filter((item) => !existingUrls.has(item.url));
    if (!availableItems.length) return;
    setPendingId(actionId);
    setError("");
    try {
      await onAddCatalogFeeds(availableItems);
    } catch (requestError: unknown) {
      setError(requestError instanceof Error ? requestError.message : t("failedToAddFeed"));
    } finally {
      setPendingId("");
    }
  };

  const addManualFeed = async () => {
    if (!newUrl.trim()) return;
    setPendingId("manual");
    setError("");
    try {
      await onAddFeed(newUrl.trim(), newTitle.trim() || undefined, newCategory.trim() || undefined);
      setNewUrl("");
      setNewTitle("");
      setNewCategory("");
      setOpen(false);
    } catch (requestError: unknown) {
      setError(requestError instanceof Error ? requestError.message : t("failedToAddFeed"));
    } finally {
      setPendingId("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" className="flex-1 text-xs gap-1"><Plus className="h-3 w-3" />{t("addFeed")}</Button>} />
      <DialogContent className="max-h-[calc(100dvh-2rem)] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("discoverFeeds")}</DialogTitle>
          <DialogDescription>{t("rssCatalogDescription")}</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-3 border-b border-border" role="tablist" aria-label={t("discoverFeeds")}>
          {([["presets", "starterPacks"], ["catalog", "searchRssCatalog"], ["url", "addUrlManually"]] as const).map(([value, labelKey]) => (
            <button key={value} type="button" role="tab" aria-selected={mode === value} className={`border-b-2 px-2 py-2 text-xs transition-colors ${mode === value ? "border-accent2 text-ink" : "border-transparent text-ink-faint hover:text-ink"}`} onClick={() => { setMode(value); setError(""); }}>
              {t(labelKey)}
            </button>
          ))}
        </div>

        {mode === "presets" && (
          <div className="grid gap-2 pt-1 sm:grid-cols-2">
            {FEED_PRESETS.map((preset) => {
              const presetItems = preset.feedIds.map(getCatalogFeed).filter((item): item is FeedCatalogItem => Boolean(item));
              const missingItems = presetItems.filter((item) => !existingUrls.has(item.url));
              const isAdded = missingItems.length === 0;
              return (
                <article key={preset.id} className="border border-border p-3">
                  <div className="flex items-start justify-between gap-3"><div><h3 className="text-sm font-medium text-ink">{t(preset.nameKey)}</h3><p className="mt-1 text-xs leading-5 text-ink-subtle">{t(preset.descriptionKey)}</p></div><Rss className="h-4 w-4 shrink-0 text-accent2" aria-hidden="true" /></div>
                  <div className="mt-3 flex items-center justify-between gap-2"><span className="font-mono text-[10px] text-ink-faint">{presetItems.length} {t("feeds").toLowerCase()}</span><Button variant={isAdded ? "ghost" : "outline"} size="sm" className="text-xs" disabled={isAdded || pendingId === preset.id} onClick={() => void addCatalogItems(missingItems, preset.id)}>{pendingId === preset.id ? <Loader2 className="me-1 h-3 w-3 animate-spin" /> : null}{isAdded ? t("added") : missingItems.length < presetItems.length ? t("addRemaining") : t("addPreset")}</Button></div>
                </article>
              );
            })}
          </div>
        )}

        {mode === "catalog" && (
          <div className="space-y-3 pt-1">
            <div className="relative"><Search className="absolute start-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-faint" aria-hidden="true" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("searchRssPlaceholder")} className="ps-8" aria-label={t("searchRssCatalog")} /></div>
            <div className="flex gap-1 overflow-x-auto pb-1" role="group" aria-label={t("allCategories")}>
              {categories.map((value) => <button key={value} type="button" className={`shrink-0 border px-2 py-1 font-mono text-[10px] uppercase tracking-wider transition-colors ${category === value ? "border-accent2 bg-accent2/10 text-accent2" : "border-border text-ink-faint hover:text-ink"}`} onClick={() => setCategory(value)}>{value === "all" ? t("allCategories") : t(categoryLabels[value])}</button>)}
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {filteredFeeds.map((feed) => { const isAdded = existingUrls.has(feed.url); return <article key={feed.id} className="flex items-center gap-3 border border-border p-3"><div className="flex h-8 w-8 shrink-0 items-center justify-center border border-border text-accent2"><Rss className="h-3.5 w-3.5" aria-hidden="true" /></div><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><h3 className="truncate text-xs font-medium text-ink">{feed.title}</h3><a href={feed.siteUrl} target="_blank" rel="noreferrer" className="text-ink-faint hover:text-accent2" aria-label={`${t("visitSource")}: ${feed.title}`}><ExternalLink className="h-3 w-3" aria-hidden="true" /></a></div><p className="mt-1 font-mono text-[9px] uppercase tracking-wider text-ink-faint">{t(categoryLabels[feed.category])} · {t("sourceLanguage")}: {feed.language === "ar" ? t("arabic") : t("english")}</p></div><Button variant={isAdded ? "ghost" : "outline"} size="xs" disabled={isAdded || pendingId === feed.id} onClick={() => void addCatalogItems([feed], feed.id)}>{pendingId === feed.id ? <Loader2 className="h-3 w-3 animate-spin" /> : isAdded ? t("added") : t("addSource")}</Button></article>; })}
            </div>
            {!filteredFeeds.length && <p className="py-8 text-center text-xs text-ink-faint">{t("noRssResults")}</p>}
          </div>
        )}

        {mode === "url" && (
          <div className="space-y-3 pt-1">
            <div><label htmlFor="discovery-feed-url" className="mb-1 block text-xs font-medium text-ink-subtle">{t("feedUrlRequired")}</label><Input id="discovery-feed-url" placeholder="https://example.com/rss" value={newUrl} onChange={(event) => setNewUrl(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void addManualFeed(); }} /></div>
            <div><label htmlFor="discovery-feed-title" className="mb-1 block text-xs font-medium text-ink-subtle">{t("titleOptional")}</label><Input id="discovery-feed-title" placeholder={t("customFeedName")} value={newTitle} onChange={(event) => setNewTitle(event.target.value)} /></div>
            <div><label htmlFor="discovery-feed-category" className="mb-1 block text-xs font-medium text-ink-subtle">{t("categoryOptional")}</label><Input id="discovery-feed-category" placeholder={t("categoryPlaceholder")} value={newCategory} onChange={(event) => setNewCategory(event.target.value)} /></div>
            <Button className="w-full" size="sm" onClick={() => void addManualFeed()} disabled={pendingId === "manual" || !newUrl.trim()}>{pendingId === "manual" ? <><Loader2 className="me-1 h-3 w-3 animate-spin" />{t("adding")}</> : t("addFeed")}</Button>
          </div>
        )}
        {error && <p className="text-xs text-destructive" role="alert">{error}</p>}
      </DialogContent>
    </Dialog>
  );
}
