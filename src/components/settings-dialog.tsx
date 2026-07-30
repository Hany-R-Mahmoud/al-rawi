"use client";

import { useRef, useState } from "react";
import { useTheme } from "next-themes";
import { useLanguage } from "@/components/language-provider";
import { Download, Settings2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { makeFeedId } from "@/lib/local-reader";
import type { StoredFeed } from "@/lib/reader-types";

type SettingsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feeds: StoredFeed[];
  onImportFeeds: (feeds: StoredFeed[]) => number;
};

type OpmlFeed = { title: string; url: string; category: string | null };

export function SettingsDialog({ open, onOpenChange, feeds, onImportFeeds }: SettingsDialogProps) {
  const { theme, setTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState("");

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setMessage("");
    try {
      const imported = parseOpml(await file.text()).map((feed) => ({ id: makeFeedId(feed.url), url: feed.url, title: feed.title, category: feed.category }));
      const count = onImportFeeds(imported);
      setMessage(t("importedCount", { count }));
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      setMessage(message === "Invalid OPML file." ? t("invalidOpml") : message === "OPML file has no body." ? t("opmlNoBody") : message || t("couldNotImportOpml"));
    } finally {
      setImporting(false);
      event.target.value = "";
    }
  };

  const exportOpml = () => {
    const outlines = feeds.map((feed) => `    <outline type="rss" text="${escapeXml(feed.title)}" title="${escapeXml(feed.title)}" xmlUrl="${escapeXml(feed.url)}" htmlUrl="${escapeXml(feed.url)}"/>`).join("\n");
    const xml = `<?xml version="1.0" encoding="UTF-8"?><opml version="2.0"><head><title>${escapeXml(t("appName"))}</title></head><body>\n${outlines}\n</body></opml>`;
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([xml], { type: "application/xml" }));
    link.download = "al-rawi-feeds.opml";
    link.click();
    URL.revokeObjectURL(link.href);
  };

  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="sm:max-w-md"><DialogHeader><DialogTitle className="flex items-center gap-2"><Settings2 className="h-4 w-4" />{t("settings")}</DialogTitle><DialogDescription>{t("localPreferences")}</DialogDescription></DialogHeader><div className="space-y-6 py-4"><div className="space-y-2"><Label>{t("language")}</Label><Select value={language} onValueChange={(value) => { if (value === "en" || value === "ar") setLanguage(value); }}><SelectTrigger><span>{language === "ar" ? t("arabic") : t("english")}</span></SelectTrigger><SelectContent><SelectItem value="en">{t("english")}</SelectItem><SelectItem value="ar">{t("arabic")}</SelectItem></SelectContent></Select></div><div className="space-y-2"><Label>{t("theme")}</Label><Select value={theme} onValueChange={(value) => value && setTheme(value)}><SelectTrigger><span>{theme === "dark" ? t("dark") : theme === "light" ? t("light") : t("system")}</span></SelectTrigger><SelectContent><SelectItem value="light">{t("light")}</SelectItem><SelectItem value="dark">{t("dark")}</SelectItem><SelectItem value="system">{t("system")}</SelectItem></SelectContent></Select></div><div className="space-y-3"><Label>{t("feedSubscriptions")}</Label><div className="flex gap-2"><Button variant="outline" size="sm" className="flex-1 gap-2" onClick={() => fileInputRef.current?.click()} disabled={importing}><Upload className="h-3.5 w-3.5" />{importing ? t("importing") : t("importOpml")}</Button><input ref={fileInputRef} type="file" accept=".opml,.xml" className="hidden" onChange={handleImport} /><Button variant="outline" size="sm" className="flex-1 gap-2" onClick={exportOpml}><Download className="h-3.5 w-3.5" />{t("exportOpml")}</Button></div>{message && <p className="text-xs text-ink-subtle" role="status">{message}</p>}</div><div className="space-y-2"><Label>{t("keyboardShortcuts")}</Label><div className="grid grid-cols-2 gap-2 rounded-sm bg-muted/40 p-3 text-xs text-ink-subtle"><span>{t("nextPrevious")}</span><kbd className="keycap">J / K</kbd><span>{t("openOriginalShortcut")}</span><kbd className="keycap">O</kbd><span>{t("markReadShortcut")}</span><kbd className="keycap">M</kbd><span>{t("searchRefresh")}</span><kbd className="keycap">/ / R</kbd></div></div></div></DialogContent></Dialog>;
}

function parseOpml(xml: string): OpmlFeed[] {
  const document = new DOMParser().parseFromString(xml, "application/xml");
  if (document.querySelector("parsererror") || document.documentElement.tagName.toLowerCase() !== "opml") throw new Error("Invalid OPML file.");
  const body = document.querySelector("body");
  if (!body) throw new Error("OPML file has no body.");
  const feeds: OpmlFeed[] = [];
  const seen = new Set<string>();
  const walk = (element: Element, category: string | null) => {
    Array.from(element.children).forEach((child) => {
      if (child.tagName.toLowerCase() !== "outline") return;
      const url = child.getAttribute("xmlUrl");
      const title = child.getAttribute("title") || child.getAttribute("text") || "Untitled";
      const nextCategory = child.getAttribute("category") || category || (!url ? title : null);
      if (url && !seen.has(url)) {
        const parsed = new URL(url);
        if (/^https?:$/.test(parsed.protocol)) {
          const normalized = parsed.toString();
          seen.add(url);
          feeds.push({ title, url: normalized, category: nextCategory });
        }
      } else if (!url) {
        walk(child, nextCategory);
      }
    });
  };
  walk(body, null);
  return feeds;
}

function escapeXml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}
