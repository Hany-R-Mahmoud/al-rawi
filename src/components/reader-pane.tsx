"use client";

import { ArrowUpRight, BookOpenText, Loader2, Mail, MailOpen } from "lucide-react";
import { useLanguage } from "@/components/language-provider";
import { Button } from "@/components/ui/button";
import type { Article } from "@/lib/reader-types";

type ReaderPaneProps = {
  article: Article | null;
  loading: boolean;
  onOpenOriginal: () => void;
  onMarkRead: () => void;
};

export function ReaderPane({ article, loading, onOpenOriginal, onMarkRead }: ReaderPaneProps) {
  const { language, t } = useLanguage();
  if (loading) return <div className="flex h-full flex-1 flex-col items-center justify-center gap-3" role="status"><Loader2 className="h-6 w-6 animate-spin text-accent2 motion-reduce:animate-none" aria-hidden /><p className="text-sm text-ink-subtle">{t("preparingArticle")}</p></div>;
  if (!article) return <div className="flex h-full flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
    <BookOpenText className="h-11 w-11 text-accent2" strokeWidth={1.2} aria-hidden />
    <h2 className={"text-2xl text-ink " + (language === "ar" ? "font-arabic" : "font-serif")}>{t("selectArticle")}</h2>
    <p className="max-w-xs text-sm leading-7 text-ink-subtle">{t("readerHelp")}</p>
  </div>;

  return <div className="flex h-full min-h-0 flex-1 flex-col">
    <header className="shrink-0 border-b border-border bg-paper-raised px-5 py-6 sm:px-8 sm:py-8 xl:px-12">
      <p className="mb-3 font-mono text-[10px] uppercase tracking-[.16em] text-accent2">{article.feed.title}</p>
      <h1 className={"max-w-4xl text-2xl font-normal leading-snug tracking-tight text-ink sm:text-3xl xl:text-4xl " + (article.language === "ar" ? "font-arabic" : "font-serif")} dir={article.direction}>{article.title}</h1>
      <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-faint" dir={article.direction}>
        {article.author && <span>{article.author}</span>}
        {article.author && <span aria-hidden>·</span>}
        <time>{formatDate(article.publishedAt, language)}</time>
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        <Button variant="default" size="sm" className="min-h-10 gap-2" onClick={onOpenOriginal}><ArrowUpRight className="h-4 w-4" aria-hidden />{t("openOriginal")}</Button>
        <Button variant="outline" size="sm" className="min-h-10 gap-2" onClick={onMarkRead}>{article.isRead ? <MailOpen className="h-4 w-4" aria-hidden /> : <Mail className="h-4 w-4" aria-hidden />}{article.isRead ? t("markUnread") : t("markRead")}</Button>
      </div>
    </header>
    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-paper-raised">
      <div className="article-content mx-auto max-w-[740px] px-5 py-8 sm:px-8 sm:py-12 xl:py-14" dir={article.direction} lang={article.language === "ar" ? "ar" : "en"} dangerouslySetInnerHTML={{ __html: article.content || "<p>" + t("noContent") + "</p>" }} />
    </div>
  </div>;
}

function formatDate(dateString: string | null, language: "en" | "ar"): string {
  if (!dateString) return "";
  const parsed = Date.parse(dateString);
  if (!Number.isFinite(parsed)) return "";
  return new Intl.DateTimeFormat(language === "ar" ? "ar-EG" : "en-US", { year: "numeric", month: "long", day: "numeric" }).format(parsed);
}
