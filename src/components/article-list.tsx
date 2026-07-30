"use client";

import { useEffect, useRef } from "react";
import { useLanguage } from "@/components/language-provider";
import { Mail, MailOpen } from "lucide-react";
import type { Article } from "@/lib/reader-types";

type ArticleListProps = {
  articles: Article[];
  selectedArticleId: string | null;
  onSelectArticle: (id: string) => void;
  onToggleRead: (id: string) => void;
};

export function ArticleList({ articles, selectedArticleId, onSelectArticle, onToggleRead }: ArticleListProps) {
  const { language, t } = useLanguage();
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!selectedArticleId || !listRef.current) return;
    listRef.current.querySelector(`[data-article-id="${CSS.escape(selectedArticleId)}"]`)?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [selectedArticleId]);

  return (
    <div ref={listRef} className="flex-1 overflow-y-auto divide-y divide-border/50">
      {articles.length === 0 ? (
        <div className="flex h-full flex-col items-center justify-center p-6 text-center"><div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted"><MailOpen className="h-5 w-5 text-muted-foreground" /></div><p className="mb-1 text-sm font-medium text-foreground">{t("noFreshArticles")}</p><p className="text-xs text-muted-foreground">{t("addFeedOrRefresh")}</p></div>
      ) : articles.map((article) => (
        <article key={article.id} data-article-id={article.id} className={`group relative cursor-pointer transition-colors ${selectedArticleId === article.id ? "bg-accent/30" : "hover:bg-muted/30"} ${article.isRead ? "opacity-70" : ""}`} onClick={() => onSelectArticle(article.id)}>
          <div className="p-3 ps-4 pe-10"><div className="mb-1 flex items-center gap-2" dir={article.direction}><span className="truncate text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{article.feed.title}</span><span className="shrink-0 text-[10px] text-muted-foreground/60">{formatDate(article.publishedAt, language)}</span></div><h3 className={`mb-1 text-sm leading-relaxed ${article.isRead ? "font-normal text-muted-foreground" : "font-medium text-foreground"}`} dir={article.direction}>{article.title}</h3>{article.summary && <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground/80" dir={article.direction}>{article.summary}</p>}{article.author && <p className="mt-1 text-[10px] text-muted-foreground/50" dir={article.direction}>{t("by")} {article.author}</p>}</div>
          <button type="button" className="absolute end-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-muted hover:text-foreground group-hover:opacity-100 focus-visible:opacity-100" onClick={(event) => { event.stopPropagation(); onToggleRead(article.id); }} title={article.isRead ? t("markUnread") : t("markRead")} aria-label={article.isRead ? t("markUnread") : t("markRead")}>{article.isRead ? <MailOpen className="h-3.5 w-3.5" /> : <Mail className="h-3.5 w-3.5" />}</button>
        </article>
      ))}
    </div>
  );
}

function formatDate(dateString: string | null, language: "en" | "ar"): string {
  if (!dateString) return "";
  const diff = Date.now() - Date.parse(dateString);
  const hours = Math.floor(diff / 3_600_000);
  if (hours < 1) return language === "ar" ? "الآن" : "Just now";
  if (hours < 24) return language === "ar" ? `منذ ${hours} س` : `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return language === "ar" ? `منذ ${days} يوم` : `${days}d ago`;
  return new Intl.DateTimeFormat(language === "ar" ? "ar-EG" : "en-US", { month: "short", day: "numeric" }).format(new Date(dateString));
}
