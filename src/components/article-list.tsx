"use client";

import { useEffect, useRef } from "react";
import { useLanguage } from "@/components/language-provider";
import { BookOpenText, Mail, MailOpen } from "lucide-react";
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
    listRef.current.querySelector('[data-article-id="' + CSS.escape(selectedArticleId) + '"]')?.scrollIntoView({ block: "nearest", behavior: "instant" });
  }, [selectedArticleId]);

  if (!articles.length) return <div className="flex flex-1 flex-col items-center justify-center gap-3 px-7 py-12 text-center">
    <BookOpenText className="h-9 w-9 text-accent2" strokeWidth={1.3} aria-hidden />
    <h2 className={"text-xl text-ink " + (language === "ar" ? "font-arabic" : "font-serif")}>{t("noFreshArticles")}</h2>
    <p className="max-w-[230px] text-sm leading-6 text-ink-subtle">{t("addFeedOrRefresh")}</p>
  </div>;

  return (
    <div ref={listRef} className="min-h-0 flex-1 divide-y divide-border/80 overflow-y-auto overscroll-contain" role="list" aria-label={t("articles")}>
      {articles.map((article) => {
        const selected = selectedArticleId === article.id;
        return (
          <article key={article.id} role="listitem" data-article-id={article.id} className={"group relative flex items-start gap-1 transition-colors " + (selected ? "bg-muted/80" : "hover:bg-muted/35")}>
            <button type="button" aria-current={selected ? "true" : undefined} onClick={() => onSelectArticle(article.id)}
              className="min-h-[112px] min-w-0 flex-1 px-4 py-4 text-start outline-offset-[-3px] focus-visible:outline-2 focus-visible:outline-accent2">
              <div className="mb-2 flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[10px] text-ink-faint" dir={article.direction}>
                <span className="max-w-[150px] truncate font-semibold text-accent2">{article.feed.title}</span>
                <span aria-hidden>·</span><span>{formatDate(article.publishedAt, language)}</span>
              </div>
              <h3 className={"line-clamp-3 text-[15px] leading-6 " + (article.isRead ? "font-normal text-ink-subtle" : "font-semibold text-ink")} dir={article.direction}>{article.title}</h3>
              {article.summary && <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-ink-faint" dir={article.direction}>{article.summary}</p>}
            </button>
            <button type="button" aria-label={article.isRead ? t("markUnread") : t("markRead")} title={article.isRead ? t("markUnread") : t("markRead")}
              onClick={() => onToggleRead(article.id)} className="me-2 mt-3 flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-ink-faint transition hover:bg-paper-raised hover:text-ink focus-visible:outline-2 focus-visible:outline-accent2">
              {article.isRead ? <MailOpen className="h-4 w-4" aria-hidden /> : <Mail className="h-4 w-4" aria-hidden />}
            </button>
          </article>
        );
      })}
    </div>
  );
}

function formatDate(dateString: string | null, language: "en" | "ar"): string {
  if (!dateString) return "";
  const parsed = Date.parse(dateString);
  if (!Number.isFinite(parsed)) return "";
  const hours = Math.floor((Date.now() - parsed) / 3_600_000);
  if (hours >= 0 && hours < 1) return language === "ar" ? "الآن" : "Just now";
  if (hours >= 1 && hours < 24) return language === "ar" ? "منذ " + hours + " س" : hours + "h ago";
  const days = Math.floor(hours / 24);
  if (days >= 1 && days < 7) return language === "ar" ? "منذ " + days + " يوم" : days + "d ago";
  return new Intl.DateTimeFormat(language === "ar" ? "ar-EG" : "en-US", { month: "short", day: "numeric" }).format(parsed);
}
