"use client";

import { useEffect, useState } from "react";
import { ArrowUpRight, Archive, Bookmark, BookmarkCheck, Check, CircleCheck, Eye, EyeOff, Loader2, PlayCircle } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/language-provider";
import { loadInboxPreview, type InboxPreview } from "@/lib/inbox-preview";
import { openExternalUrl } from "@/lib/open-url";
import type { InboxItem, InboxStatus } from "@/lib/inbox-types";

type Props = {
  item: InboxItem | null;
  onClose: () => void;
  onStatus: (item: InboxItem, status: InboxStatus) => Promise<void>;
  onRead: (item: InboxItem, read: boolean) => Promise<void>;
};

export function InboxDetail({ item, onClose, onStatus, onRead }: Props) {
  const { t, language } = useLanguage();
  const [preview, setPreview] = useState<InboxPreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [playVideo, setPlayVideo] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!item) return;
    let live = true;
    queueMicrotask(() => { if (live) { setLoading(true); setPreview(null); setPlayVideo(false); setError(""); } });
    void loadInboxPreview(item).then((result) => { if (live) setPreview(result); })
      .catch(() => { if (live) { setPreview({ kind: "text", content: item.text }); setError(t("hubPreviewLimited")); } })
      .finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, [item, t]);

  if (!item) return null;
  const date = new Intl.DateTimeFormat(language === "ar" ? "ar-EG" : "en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(item.receivedAt));
  const updateStatus = async (status: InboxStatus) => { try { await onStatus(item, status); } catch { setError(t("inboxError")); } };
  const updateRead = async (read: boolean) => { try { await onRead(item, read); } catch { setError(t("inboxError")); } };

  return (
    <Dialog open={!!item} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="flex max-h-[92dvh] min-h-[420px] w-[calc(100vw-24px)] max-w-[800px] flex-col gap-0 overflow-hidden border-border bg-paper-raised p-0">
        <DialogHeader className="shrink-0 border-b border-border px-5 pb-5 pt-7 sm:px-8">
          <p className="font-mono text-[11px] text-accent2">{t("hubDetailSource")} · {item.feedTitle || item.source.toUpperCase()} · {date}</p>
          <DialogTitle dir="auto" className={"mt-2 pe-8 text-2xl leading-snug text-ink sm:text-3xl " + (language === "ar" ? "font-arabic" : "font-serif")}>{item.title}</DialogTitle>
          <DialogDescription className="text-xs text-ink-faint">{t("hubDetailHelp")}</DialogDescription>
          <div className="flex flex-wrap gap-1.5 pt-3">
            <Button variant="outline" size="sm" className="min-h-9 gap-1.5" onClick={() => void updateRead(!item.readAt)}>
              {item.readAt ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {item.readAt ? t("markUnread") : t("markRead")}
            </Button>
            <Button variant="outline" size="sm" className="min-h-9 gap-1.5" onClick={() => void updateStatus(item.status === "saved" ? "new" : "saved")}>
              {item.status === "saved" ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
              {item.status === "saved" ? t("hubUnsave") : t("inboxSave")}
            </Button>
            {item.status !== "done" && <Button variant="ghost" size="sm" className="min-h-9 gap-1" onClick={() => void updateStatus("done")}><CircleCheck className="h-4 w-4"/>{t("inboxDone")}</Button>}
            {item.status !== "archived" && <Button variant="ghost" size="sm" className="min-h-9 gap-1" onClick={() => void updateStatus("archived")}><Archive className="h-4 w-4"/>{t("inboxArchive")}</Button>}
            {item.status === "archived" && <Button variant="outline" size="sm" className="min-h-9 gap-1" onClick={() => void updateStatus("new")}><Check className="h-4 w-4"/>{t("inboxRestore")}</Button>}
            {item.url && <Button variant="default" size="sm" className="min-h-9 gap-1.5" onClick={() => void openExternalUrl(item.url!).catch(() => setError(t("inboxError")))}><ArrowUpRight className="h-4 w-4"/>{t("hubOpenOriginal")}</Button>}
          </div>
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-7 sm:px-8">
          {error && <p role="alert" className="mb-4 text-xs text-destructive">{error}</p>}
          {loading && <p role="status" className="flex items-center gap-2 text-xs text-ink-subtle"><Loader2 className="h-4 w-4 animate-spin"/>{t("hubLoadingPreview")}</p>}
          {preview?.kind === "html" && <article className="article-content" dir={preview.direction === "rtl" ? "rtl" : "auto"} dangerouslySetInnerHTML={{ __html: preview.content }} />}
          {preview?.kind === "text" && <div className="whitespace-pre-wrap break-words text-sm leading-8 text-ink" dir="auto">{preview.content || t("hubNoPreview")}</div>}
          {preview?.kind === "video" && <section className="space-y-4">
            {playVideo ? (
              <iframe title={item.title} className="aspect-video w-full rounded-md border border-border" loading="lazy"
                src={"https://www.youtube-nocookie.com/embed/" + preview.videoId}
                referrerPolicy="strict-origin-when-cross-origin" allow="encrypted-media; picture-in-picture; fullscreen" allowFullScreen />
            ) : (
              <button className="flex aspect-video w-full flex-col items-center justify-center gap-3 rounded-md border border-border bg-muted text-ink transition hover:bg-paper" onClick={() => setPlayVideo(true)}>
                <PlayCircle className="h-12 w-12 text-accent2" aria-hidden /><span className="text-sm">{t("hubPlayHere")}</span>
              </button>
            )}
            {item.text && <p className="whitespace-pre-wrap text-sm leading-7 text-ink-subtle" dir="auto">{item.text}</p>}
            <p className="text-xs text-ink-faint">{t("hubYoutubePrivacy")}</p>
          </section>}
        </div>
      </DialogContent>
    </Dialog>
  );
}
