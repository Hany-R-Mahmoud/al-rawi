"use client";

import { useLanguage } from "@/components/language-provider";
import { FeedDiscoveryDialog } from "@/components/feed-discovery-dialog";
import { Button } from "@/components/ui/button";
import type { FeedCatalogItem } from "@/lib/feed-catalog";
import { FolderOpen, RefreshCw, Rss, Trash2 } from "lucide-react";

interface Feed {
  id: string;
  title: string;
  url: string;
  category: string | null;
  status: string;
  icon: string | null;
  lastError: string | null;
  _count: { articles: number };
}
interface FeedListProps {
  feeds: Feed[];
  selectedFeedId: string | null;
  onSelectFeed: (id: string | null) => void;
  onRefresh: () => void;
  onDeleteFeed: (id: string) => void;
  onAddFeed: (url: string, title?: string, category?: string) => Promise<void>;
  onAddCatalogFeeds: (feeds: readonly FeedCatalogItem[]) => Promise<void>;
}

export function FeedList({ feeds, selectedFeedId, onSelectFeed, onRefresh, onDeleteFeed, onAddFeed, onAddCatalogFeeds }: FeedListProps) {
  const { t } = useLanguage();
  const groups = feeds.reduce<Record<string, Feed[]>>((acc, feed) => {
    const category = feed.category || t("uncategorized");
    (acc[category] ??= []).push(feed);
    return acc;
  }, {});
  const count = feeds.reduce((n, feed) => n + feed._count.articles, 0);

  return (
    <div className="flex h-full min-h-0 flex-col bg-paper">
      <header className="shrink-0 border-b border-border px-4 pb-4 pt-5">
        <p className="mb-1 font-mono text-[10px] uppercase tracking-[.14em] text-accent2">{t("uiSourcesOverline")}</p>
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-serif text-xl text-ink">{t("feeds")}</h2>
          <Button variant="ghost" size="sm" className="h-9 w-9 p-0" onClick={onRefresh} title={t("refreshAllFeeds")} aria-label={t("refreshAllFeeds")}><RefreshCw className="h-4 w-4" aria-hidden /></Button>
        </div>
        <p className="mb-3 mt-1 text-xs text-ink-faint">{t("uiSourcesHelp")}</p>
        <FeedDiscoveryDialog existingUrls={new Set(feeds.map((feed) => feed.url))} onAddFeed={onAddFeed} onAddCatalogFeeds={onAddCatalogFeeds} />
      </header>
      <nav className="min-h-0 flex-1 overflow-y-auto px-2.5 py-3" aria-label={t("feeds")}>
        <button type="button" aria-pressed={selectedFeedId === null} onClick={() => onSelectFeed(null)}
          className={"mb-4 flex min-h-11 w-full items-center gap-2.5 rounded-md px-3 text-start text-sm transition focus-visible:outline-2 focus-visible:outline-accent2 " +
            (selectedFeedId === null ? "bg-ink font-semibold text-paper" : "text-ink-subtle hover:bg-muted hover:text-ink")}>
          <Rss className="h-4 w-4 shrink-0" aria-hidden /><span className="min-w-0 flex-1 truncate">{t("allArticles")}</span>
          <span className="font-mono text-[11px] tabular-nums opacity-75">{count}</span>
        </button>
        {Object.keys(groups).sort().map((category) => (
          <div key={category} className="mb-5">
            <h3 className="mb-2 flex items-center gap-1.5 px-3 font-mono text-[10px] uppercase tracking-[.14em] text-ink-faint"><FolderOpen className="h-3 w-3" aria-hidden />{category}</h3>
            <ul className="space-y-0.5">
              {groups[category].map((feed) => (
                <li key={feed.id} className="group flex items-center">
                  <button type="button" aria-pressed={selectedFeedId === feed.id} onClick={() => onSelectFeed(feed.id)}
                    title={feed.status === "error" ? t("feedError", { message: feed.lastError || "" }) : feed.title}
                    className={"flex min-h-10 min-w-0 flex-1 items-center gap-2.5 rounded-md px-3 text-start text-xs transition focus-visible:outline-2 focus-visible:outline-accent2 " +
                      (selectedFeedId === feed.id ? "bg-muted font-semibold text-ink" : "text-ink-subtle hover:bg-muted/60 hover:text-ink") +
                      (feed.status === "error" || feed.status === "paused" ? " opacity-75" : "")}>
                    <span className={"h-1.5 w-1.5 shrink-0 rounded-full " + (feed.status === "error" ? "bg-destructive" : "bg-accent2/55")} aria-hidden />
                    <span className="min-w-0 flex-1 truncate">{feed.title}</span>
                    <span className="font-mono text-[10px] tabular-nums text-ink-faint">{feed._count.articles}</span>
                  </button>
                  <button type="button" onClick={() => onDeleteFeed(feed.id)} title={t("deleteFeed")} aria-label={t("deleteFeed") + ": " + feed.title}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-ink-faint transition hover:bg-muted hover:text-destructive focus-visible:outline-2 focus-visible:outline-accent2 lg:opacity-0 lg:group-hover:opacity-100 lg:group-focus-within:opacity-100">
                    <Trash2 className="h-3.5 w-3.5" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
        {feeds.length === 0 && <div className="px-4 py-9 text-center">
          <Rss className="mx-auto mb-4 h-8 w-8 text-accent2" strokeWidth={1.3} aria-hidden />
          <p className="font-serif text-lg text-ink">{t("noFeedsYet")}</p>
          <p className="mt-2 text-xs leading-6 text-ink-subtle">{t("addFeedUrlToStart")}</p>
        </div>}
      </nav>
    </div>
  );
}
