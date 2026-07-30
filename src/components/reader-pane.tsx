"use client";

import { ExternalLink, Loader2, Mail, MailOpen } from "lucide-react";
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
  if (loading) return <div className="flex h-full items-center justify-center"><div className="flex flex-col items-center gap-2"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /><p className="text-xs text-muted-foreground">{t("preparingArticle")}</p></div></div>;
  if (!article) return <div className="flex h-full items-center justify-center"><div className="max-w-xs text-center"><div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted"><MailOpen className="h-5 w-5 text-muted-foreground" /></div><p className="mb-1 text-sm font-medium text-foreground">{t("selectArticle")}</p><p className="text-xs text-muted-foreground">{t("readerHelp")}</p></div></div>;

  return <div className="flex h-full flex-col">
    <div className="border-b border-border/50 px-6 py-4"><h1 className="mb-2 text-xl font-bold leading-tight" dir={article.direction}>{article.title}</h1><div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground" dir={article.direction}><span className="font-medium">{article.feed.title}</span>{article.author && <><span className="text-muted-foreground/40">·</span><span>{article.author}</span></>}<span className="text-muted-foreground/40">·</span><span>{formatDate(article.publishedAt, language)}</span>{article.language === "ar" && <><span className="text-muted-foreground/40">·</span><span className="rounded bg-muted px-1.5 py-0.5 text-[10px]">{t("arabic")}</span></>}</div><div className="mt-3 flex items-center gap-1"><Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs" onClick={onOpenOriginal}><ExternalLink className="h-3.5 w-3.5" />{t("openOriginal")}</Button><Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs" onClick={onMarkRead}>{article.isRead ? <MailOpen className="h-3.5 w-3.5" /> : <Mail className="h-3.5 w-3.5" />}{article.isRead ? t("markUnread") : t("markRead")}</Button></div></div>
    <div className="flex-1 overflow-y-auto"><div className="article-content mx-auto max-w-3xl px-6 py-6" dir={article.direction} lang={article.language === "ar" ? "ar" : "en"} dangerouslySetInnerHTML={{ __html: article.content || `<p>${t("noContent")}</p>` }} /></div>
  </div>;
}

function formatDate(dateString: string | null, language: "en" | "ar"): string {
  if (!dateString) return "";
  return new Intl.DateTimeFormat(language === "ar" ? "ar-EG" : "en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(dateString));
}
