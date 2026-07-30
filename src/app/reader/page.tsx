"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { ArrowLeft, ArrowRight, Loader2, Menu, Moon, Rss, Search, Settings2, Sun, X } from "lucide-react";
import { toast } from "sonner";
import { ArticleList } from "@/components/article-list";
import { BrandLogo } from "@/components/brand-logo";
import { FeedList } from "@/components/feed-list";
import { ReaderPane } from "@/components/reader-pane";
import { SettingsDialog } from "@/components/settings-dialog";
import { PwaInstallMenuAction } from "@/components/pwa-install-menu-action";
import { useLanguage } from "@/components/language-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useKeyboardNav } from "@/hooks/use-keyboard-nav";
import type { FeedCatalogCategory, FeedCatalogItem } from "@/lib/feed-catalog";
import { readLocalReaderState, makeFeedId, writeLocalReaderState } from "@/lib/local-reader";
import type { ParsedFeed } from "@/lib/feed-parser";
import type { Article, ReaderFeed, StoredFeed } from "@/lib/reader-types";
import { translate, type Language, type TranslationKey } from "@/lib/i18n";

type ParsedFeedPayload = ParsedFeed;

const catalogCategoryKeys: Record<FeedCatalogCategory, TranslationKey> = {
  technology: "technologyCategory",
  design: "designCategory",
  world: "worldCategory",
  arabic: "arabicCategory",
};

function isParsedFeed(value: unknown): value is ParsedFeedPayload {
  if (!value || typeof value !== "object" || !("articles" in value)) return false;
  const feed = value as Record<string, unknown>;
  return typeof feed.title === "string" && Array.isArray(feed.articles);
}

function feedFromStored(feed: StoredFeed): ReaderFeed {
  return { ...feed, status: "idle", icon: null, lastError: null, _count: { articles: 0 } };
}

async function fetchFeed(feed: ReaderFeed, language: Language): Promise<{ feed: ReaderFeed; articles: Article[] }> {
  const response = await fetch(`/api/feed?url=${encodeURIComponent(feed.url)}`, { cache: "no-store" });
  if (!response.ok) {
    const payload: unknown = await response.json();
    const message = payload && typeof payload === "object" && "error" in payload && typeof payload.error === "string" ? payload.error : translate(language, "couldNotFetchFeed");
    throw new Error(message);
  }
  const payload: unknown = await response.json();
  if (!isParsedFeed(payload)) throw new Error(translate(language, "feedResponseInvalid"));

  const articles = payload.articles.map((item, index) => ({
    id: `${feed.id}:${item.guid || item.url || index}`,
    feedId: feed.id,
    title: item.title,
    url: item.url || null,
    author: item.author || null,
    summary: item.summary ? stripMarkup(item.summary) : null,
    content: item.content || null,
    publishedAt: item.publishedAt ? new Date(item.publishedAt).toISOString() : null,
    direction: item.direction,
    language: item.language,
    isRead: false,
    feed: { title: payload.title || feed.title, icon: payload.icon || null },
  } satisfies Article));

  return {
    feed: { ...feed, title: payload.title || feed.title, status: "active", icon: payload.icon || null, lastError: null, _count: { articles: articles.length } },
    articles,
  };
}

function stripMarkup(value: string): string {
  return value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

export default function Home() {
  const { resolvedTheme, setTheme } = useTheme();
  const { language, t } = useLanguage();
  const [feeds, setFeeds] = useState<ReaderFeed[]>([]);
  const feedsRef = useRef<ReaderFeed[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [selectedFeedId, setSelectedFeedId] = useState<string | null>(null);
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showMobileNav, setShowMobileNav] = useState(false);
  const [loading, setLoading] = useState(true);
  const [readerLoading, setReaderLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [themeReady, setThemeReady] = useState(false);
  const languageRef = useRef(language);
  useEffect(() => { languageRef.current = language; }, [language]);
  useEffect(() => { feedsRef.current = feeds; }, [feeds]);

  const refreshFeeds = useCallback(async (targets: ReaderFeed[] = feedsRef.current) => {
    if (!targets.length) {
      setLoading(false);
      toast.info(translate(languageRef.current, "addFeedToStart"));
      return;
    }
    setRefreshing(true);
    setLoading(true);
    setError("");
    setFeeds((current) => current.map((feed) => targets.some((target) => target.id === feed.id) ? { ...feed, status: "loading", lastError: null } : feed));

    try {
      const results = await Promise.all(targets.map(async (feed) => {
        try {
          return { source: feed, result: await fetchFeed(feed, languageRef.current) };
        } catch (requestError) {
          return { source: feed, error: requestError instanceof Error ? requestError.message : translate(languageRef.current, "couldNotFetchFeed") };
        }
      }));

      const successes = results.filter((item): item is { source: ReaderFeed; result: { feed: ReaderFeed; articles: Article[] } } => "result" in item);
      const failures = results.filter((item): item is { source: ReaderFeed; error: string } => "error" in item);
      const nextArticles = successes.flatMap((item) => item.result.articles);
      setArticles((current) => {
        const targetIds = new Set(targets.map((feed) => feed.id));
        return [...current.filter((article) => !targetIds.has(article.feedId)), ...nextArticles].sort(sortArticles);
      });
      setSelectedArticleId((current) => current && nextArticles.some((article) => article.id === current) ? current : nextArticles[0]?.id || null);
      setFeeds((current) => current.map((feed) => {
        const result = successes.find((item) => item.result.feed.id === feed.id);
        const failure = failures.find((item) => item.source.id === feed.id);
        return result ? result.result.feed : failure ? { ...feed, status: "error", lastError: failure.error } : feed;
      }));
      if (failures.length) {
        setError(translate(languageRef.current, "feedsCouldNotRefresh", { count: failures.length }));
        toast.error(failures[0].error);
      } else {
        toast.success(translate(languageRef.current, "feedsRefreshed"));
      }
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : translate(languageRef.current, "couldNotRefreshFeeds");
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const initialLoad = window.setTimeout(() => {
      const stored = readLocalReaderState();
      const nextFeeds = stored.feeds.map(feedFromStored);
      feedsRef.current = nextFeeds;
      setFeeds(nextFeeds);
      setThemeReady(true);
      void refreshFeeds(nextFeeds);
    }, 0);
    return () => window.clearTimeout(initialLoad);
  }, [refreshFeeds]);

  const visibleArticles = useMemo(() => articles.filter((article) => {
    const matchesFeed = !selectedFeedId || article.feedId === selectedFeedId;
    const query = searchQuery.trim().toLowerCase();
    return matchesFeed && (!query || `${article.title} ${article.summary || ""}`.toLowerCase().includes(query));
  }), [articles, searchQuery, selectedFeedId]);

  const selectedArticle = visibleArticles.find((article) => article.id === selectedArticleId) || null;
  const selectedArticleUrl = selectedArticle?.url;

  useEffect(() => {
    if (!selectedArticleId || !selectedArticleUrl) return;
    const controller = new AbortController();
    fetch("/api/articles/extract", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: selectedArticleUrl }), signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) {
          const payload: unknown = await response.json();
          const message = payload && typeof payload === "object" && "error" in payload && typeof payload.error === "string" ? payload.error : translate(languageRef.current, "couldNotPrepareArticle");
          throw new Error(message);
        }
        const payload: unknown = await response.json();
        if (!controller.signal.aborted && payload && typeof payload === "object" && "content" in payload && typeof payload.content === "string") {
          const nextContent = payload.content;
          setArticles((current) => current.map((article) => article.id === selectedArticleId ? { ...article, content: nextContent } : article));
        }
      })
      .catch((requestError: unknown) => {
        if (!controller.signal.aborted) toast.error(requestError instanceof Error ? requestError.message : translate(languageRef.current, "couldNotPrepareArticle"));
      })
      .finally(() => {
        if (!controller.signal.aborted) setReaderLoading(false);
      });
    return () => controller.abort();
  }, [selectedArticleId, selectedArticleUrl]);

  const addFeed = async (url: string, title?: string, category?: string) => {
    const parsedUrl = new URL(url);
    if (!/^https?:$/.test(parsedUrl.protocol)) throw new Error(translate(languageRef.current, "onlyHttpFeeds"));
    const normalizedUrl = parsedUrl.toString();
    if (feeds.some((feed) => feed.url === normalizedUrl)) throw new Error(translate(languageRef.current, "feedAlreadyInList"));
    const nextStored: StoredFeed = { id: makeFeedId(normalizedUrl), url: normalizedUrl, title: title || parsedUrl.hostname, category: category || null };
    const nextFeed = feedFromStored(nextStored);
    const nextFeeds = [...feeds, nextFeed];
    setFeeds(nextFeeds);
    writeLocalReaderState(nextFeeds.map(toStoredFeed));
    await refreshFeeds([nextFeed]);
  };

  const addCatalogFeeds = async (catalogFeeds: readonly FeedCatalogItem[]) => {
    const existingUrls = new Set(feeds.map((feed) => feed.url));
    const additions = catalogFeeds.filter((feed) => !existingUrls.has(feed.url));
    if (!additions.length) return;
    const nextFeedsToRefresh = additions.map((catalogFeed) => feedFromStored({
      id: makeFeedId(catalogFeed.url),
      url: catalogFeed.url,
      title: catalogFeed.title,
      category: translate(languageRef.current, catalogCategoryKeys[catalogFeed.category]),
    }));
    const nextFeeds = [...feeds, ...nextFeedsToRefresh];
    setFeeds(nextFeeds);
    writeLocalReaderState(nextFeeds.map(toStoredFeed));
    await refreshFeeds(nextFeedsToRefresh);
  };

  const deleteFeed = (feedId: string) => {
    const nextFeeds = feeds.filter((feed) => feed.id !== feedId);
    setFeeds(nextFeeds);
    setArticles((current) => current.filter((article) => article.feedId !== feedId));
    writeLocalReaderState(nextFeeds.map(toStoredFeed));
    if (selectedFeedId === feedId) setSelectedFeedId(null);
    if (selectedArticle?.feedId === feedId) setSelectedArticleId(null);
  };

  const markRead = (id: string) => setArticles((current) => current.map((article) => article.id === id ? { ...article, isRead: !article.isRead } : article));
  const selectArticle = (id: string) => { setReaderLoading(true); setSelectedArticleId(id); };
  const navigate = (delta: number) => {
    const index = visibleArticles.findIndex((article) => article.id === selectedArticleId);
    if (visibleArticles.length) {
      const nextArticle = visibleArticles[(index + delta + visibleArticles.length) % visibleArticles.length];
      if (nextArticle) setSelectedArticleId(nextArticle.id);
    }
  };

  useKeyboardNav({
    onNext: () => navigate(1),
    onPrev: () => navigate(-1),
    onOpen: () => selectedArticle?.url && window.open(selectedArticle.url, "_blank", "noopener,noreferrer"),
    onMarkRead: () => selectedArticle && markRead(selectedArticle.id),
    onSearch: () => setShowSearch((current) => !current),
    onRefresh: () => void refreshFeeds(selectedFeedId ? feeds.filter((feed) => feed.id === selectedFeedId) : feeds),
  });

  const importFeeds = (imported: StoredFeed[]) => {
    const byUrl = new Map(feeds.map((feed) => [feed.url, feed]));
    imported.forEach((feed) => byUrl.set(feed.url, feedFromStored(feed)));
    const nextFeeds = Array.from(byUrl.values()).map(feedFromStored);
    setFeeds(nextFeeds);
    writeLocalReaderState(nextFeeds.map(toStoredFeed));
    void refreshFeeds(nextFeeds);
    return imported.length;
  };

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-paper text-ink">
      {showMobileNav && <button type="button" className="fixed inset-0 z-40 bg-black/40 lg:hidden" aria-label={t("closeFeeds")} onClick={() => setShowMobileNav(false)} />}
      <aside className={`fixed inset-y-0 z-50 w-72 bg-paper transition-transform lg:static lg:translate-x-0 ${language === "ar" ? "right-0 border-l border-border" : "left-0 border-r border-border"} ${showMobileNav ? "translate-x-0" : language === "ar" ? "translate-x-full" : "-translate-x-full"}`}>
        <FeedList feeds={feeds} selectedFeedId={selectedFeedId} onSelectFeed={(id) => { setSelectedFeedId(id); setShowMobileNav(false); }} onRefresh={() => void refreshFeeds(selectedFeedId ? feeds.filter((feed) => feed.id === selectedFeedId) : feeds)} onDeleteFeed={deleteFeed} onAddFeed={addFeed} onAddCatalogFeeds={addCatalogFeeds} />
      </aside>
      <section className="flex min-w-0 flex-1 flex-col lg:flex-row">
        <div className={`min-w-0 flex-1 flex-col lg:flex lg:w-[380px] lg:flex-none ${language === "ar" ? "border-l border-border" : "border-r border-border"} ${selectedArticle ? "hidden" : "flex"}`}>
          <header className="flex items-center justify-between border-b border-border px-3 py-2.5">
            <div className="flex items-center gap-2"><Button variant="ghost" size="sm" className="lg:hidden" onClick={() => setShowMobileNav(true)} aria-label={t("openFeeds")}><Menu className="h-4 w-4" /></Button><BrandLogo className="h-16 w-16" /></div>
            <div className="flex items-center gap-0.5"><Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setShowSearch((current) => !current)} aria-label={t("search")}><Search className="h-4 w-4" /></Button><Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")} aria-label={t("toggleTheme")}>{themeReady && resolvedTheme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}</Button><PwaInstallMenuAction /><Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setShowSettings(true)} aria-label={t("settings")}><Settings2 className="h-4 w-4" /></Button></div>
          </header>
          {showSearch && <div className="border-b border-border px-3 py-2"><div className="relative"><Search className={`absolute top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-faint ${language === "ar" ? "right-2.5" : "left-2.5"}`} /><Input autoFocus placeholder={t("searchPlaceholder")} value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} className={`h-8 text-xs ${language === "ar" ? "pr-8 pl-2.5" : "pl-8 pr-2.5"}`} /><button type="button" className={`absolute top-1/2 -translate-y-1/2 ${language === "ar" ? "left-2" : "right-2"}`} onClick={() => { setSearchQuery(""); setShowSearch(false); }} aria-label={t("closeSearch")}><X className="h-3 w-3 text-ink-faint" /></button></div></div>}
          <div className="flex items-center justify-between border-b border-border px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider text-ink-faint"><span>{selectedFeedId ? feeds.find((feed) => feed.id === selectedFeedId)?.title : t("allArticles")}</span><span>{visibleArticles.length}</span></div>
          {loading ? <div className="flex flex-1 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-ink-faint" /></div> : <ArticleList articles={visibleArticles} selectedArticleId={selectedArticleId} onSelectArticle={selectArticle} onToggleRead={markRead} />}
          {error && <p className="border-t border-border p-3 text-xs text-destructive">{error}</p>}
          <div className="hidden border-t border-border px-3 py-1.5 text-center font-mono text-[10px] text-ink-faint lg:block">{t("keyboardHelp")}</div>
        </div>
        <main className="hidden min-w-0 flex-1 bg-paper-raised lg:flex lg:flex-col"><ReaderPane article={selectedArticle} loading={readerLoading} onOpenOriginal={() => selectedArticle?.url && window.open(selectedArticle.url, "_blank", "noopener,noreferrer")} onMarkRead={() => selectedArticle && markRead(selectedArticle.id)} /></main>
        {selectedArticle && <main className="flex min-w-0 flex-1 flex-col bg-paper-raised lg:hidden"><div className="border-b border-border px-3 py-2"><Button variant="ghost" size="sm" className="gap-1.5 text-xs" onClick={() => setSelectedArticleId(null)}>{language === "ar" ? <ArrowRight className="h-3.5 w-3.5" /> : <ArrowLeft className="h-3.5 w-3.5" />}{t("backToArticles")}</Button></div><ReaderPane article={selectedArticle} loading={readerLoading} onOpenOriginal={() => selectedArticle.url && window.open(selectedArticle.url, "_blank", "noopener,noreferrer")} onMarkRead={() => markRead(selectedArticle.id)} /></main>}
      </section>
      <SettingsDialog open={showSettings} onOpenChange={setShowSettings} feeds={feeds.map(toStoredFeed)} onImportFeeds={importFeeds} />
      {refreshing && <div className="pointer-events-none fixed bottom-4 left-1/2 z-30 -translate-x-1/2 rounded-full border border-border bg-paper-raised px-3 py-1.5 text-xs text-ink-subtle shadow-sm"><Rss className="me-1 inline h-3 w-3 animate-pulse" />{t("refreshingFreshArticles")}</div>}
    </div>
  );
}

function toStoredFeed(feed: ReaderFeed): StoredFeed {
  return { id: feed.id, url: feed.url, title: feed.title, category: feed.category };
}

function sortArticles(left: Article, right: Article): number {
  return (right.publishedAt ? Date.parse(right.publishedAt) : 0) - (left.publishedAt ? Date.parse(left.publishedAt) : 0);
}
