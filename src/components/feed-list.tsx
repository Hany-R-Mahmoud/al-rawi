"use client";

import { useLanguage } from "@/components/language-provider";
import { FeedDiscoveryDialog } from "@/components/feed-discovery-dialog";
import { Button } from "@/components/ui/button";
import type { FeedCatalogItem } from "@/lib/feed-catalog";
import { Rss, Trash2, RefreshCw, FolderOpen } from "lucide-react";

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

export function FeedList({
  feeds,
  selectedFeedId,
  onSelectFeed,
  onRefresh,
  onDeleteFeed,
  onAddFeed,
  onAddCatalogFeeds,
}: FeedListProps) {
  const { t } = useLanguage();

  // Group feeds by category
  const grouped = feeds.reduce<Record<string, Feed[]>>((acc, feed) => {
    const cat = feed.category || t("uncategorized");
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(feed);
    return acc;
  }, {});

  const categories = Object.keys(grouped).sort();

  const allArticlesCount = feeds.reduce((sum, f) => sum + f._count.articles, 0);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-3 border-b border-[var(--border)]">
        <h2 className="font-semibold text-sm text-foreground mb-2">{t("feeds")}</h2>
        <div className="flex gap-1">
          <FeedDiscoveryDialog
            existingUrls={new Set(feeds.map((feed) => feed.url))}
            onAddFeed={onAddFeed}
            onAddCatalogFeeds={onAddCatalogFeeds}
          />
          <Button
            variant="ghost"
            size="sm"
            className="text-xs gap-1"
            onClick={onRefresh}
            title={t("refreshAllFeeds")}
          >
            <RefreshCw className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Feed list */}
      <div className="flex-1 overflow-y-auto">
        {/* All Articles item */}
        <button type="button"
          className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted/50 transition-colors text-start ${
            selectedFeedId === null ? "bg-muted/50 text-foreground font-medium" : "text-muted-foreground"
          }`}
          onClick={() => onSelectFeed(null)}
        >
          <Rss className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate flex-1">{t("allArticles")}</span>
          <span className="text-xs text-muted-foreground tabular-nums">
            {allArticlesCount}
          </span>
        </button>

        {categories.map((cat) => (
          <div key={cat}>
            <div className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              <FolderOpen className="w-3 h-3" />
              {cat}
            </div>
            {grouped[cat].map((feed) => (
              <div key={feed.id} className="group flex items-center">
                <button type="button"
                  className={`flex-1 flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted/50 transition-colors text-start ${
                    selectedFeedId === feed.id
                      ? "bg-muted/50 text-foreground font-medium"
                      : "text-muted-foreground"
                  } ${feed.status === "error" || feed.status === "paused" ? "opacity-60" : ""}`}
                  onClick={() => onSelectFeed(feed.id)}
                  title={feed.status === "error" ? t("feedError", { message: feed.lastError || "" }) : feed.title}
                >
                  <div className="w-1.5 h-1.5 rounded-full shrink-0 bg-primary/40" />
                  <span className="truncate flex-1 text-xs">{feed.title}</span>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {feed._count.articles}
                  </span>
                  {feed.status === "error" && (
                    <span className="w-1.5 h-1.5 rounded-full bg-destructive shrink-0" />
                  )}
                </button>
                <button type="button"
                  className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-destructive transition-all me-1"
                  onClick={() => onDeleteFeed(feed.id)}
                  title={t("deleteFeed")}
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        ))}

        {feeds.length === 0 && (
          <div className="p-4 text-center text-xs text-muted-foreground">
            <p className="mb-2">{t("noFeedsYet")}</p>
            <p>{t("addFeedUrlToStart")}</p>
          </div>
        )}
      </div>
    </div>
  );
}
