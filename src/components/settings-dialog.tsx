"use client";

import { useRef, useState } from "react";
import { useTheme } from "next-themes";
import { useLanguage } from "@/components/language-provider";
import { Download, Palette, Plug2, Settings2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { makeFeedId } from "@/lib/local-reader";
import { SourcesSettings } from "@/components/sources-settings";
import type { StoredFeed } from "@/lib/reader-types";

export type SettingsSection = "appearance" | "sources";
type SettingsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  section: SettingsSection;
  onSectionChange: (section: SettingsSection) => void;
  feeds: StoredFeed[];
  onImportFeeds: (feeds: StoredFeed[]) => number;
  onAddFeed: (url: string, title?: string, category?: string) => Promise<void>;
};
type OpmlFeed = { title: string; url: string; category: string | null };

export function SettingsDialog({ open, onOpenChange, section, onSectionChange, feeds, onImportFeeds, onAddFeed }: SettingsDialogProps) {
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
    const outlines = feeds.map((feed) => '    <outline type="rss" text="' + escapeXml(feed.title) + '" title="' + escapeXml(feed.title) + '" xmlUrl="' + escapeXml(feed.url) + '" htmlUrl="' + escapeXml(feed.url) + '"/>').join("\n");
    const xml = '<?xml version="1.0" encoding="UTF-8"?><opml version="2.0"><head><title>' + escapeXml(t("appName")) + '</title></head><body>\n' + outlines + '\n</body></opml>';
    const link = document.createElement("a");
    const url = URL.createObjectURL(new Blob([xml], { type: "application/xml" }));
    link.href = url;
    link.download = "al-rawi-feeds.opml";
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  };

  const tabs = [
    { id: "appearance" as const, icon: Palette, label: t("uiPreferences") },
    { id: "sources" as const, icon: Plug2, label: t("sourcesTitle") },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(90dvh,850px)] overflow-y-auto border-border bg-paper sm:max-w-[720px]">
        <DialogHeader className="pb-2">
          <DialogTitle className="flex items-center gap-2 font-serif text-2xl text-ink"><Settings2 className="h-5 w-5 text-accent2" aria-hidden />{t("settings")}</DialogTitle>
          <DialogDescription className="text-sm leading-6 text-ink-subtle">{t("uiSettingsDescription")}</DialogDescription>
        </DialogHeader>
        <nav className="flex gap-1 overflow-x-auto border-b border-border pb-3" aria-label={t("settings")}>
          {tabs.map(({ id, icon: Icon, label }) => (
            <button key={id} type="button" aria-pressed={section === id} onClick={() => onSectionChange(id)}
              className={"inline-flex min-h-10 shrink-0 items-center gap-2 rounded-md px-3 text-xs font-medium transition focus-visible:outline-2 focus-visible:outline-accent2 " +
                (section === id ? "bg-ink text-paper" : "text-ink-subtle hover:bg-muted hover:text-ink")}>
              <Icon className="h-4 w-4" aria-hidden />{label}
            </button>
          ))}
        </nav>
        {section === "appearance" && (
          <div className="space-y-7 pb-3 pt-2">
            <section className="space-y-3">
              <div><h3 className="font-serif text-lg text-ink">{t("uiReadingPreferences")}</h3><p className="text-xs leading-5 text-ink-faint">{t("uiReadingPreferencesHelp")}</p></div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2"><Label>{t("language")}</Label><Select value={language} onValueChange={(value) => { if (value === "en" || value === "ar") setLanguage(value); }}><SelectTrigger className="w-full"><span>{language === "ar" ? t("arabic") : t("english")}</span></SelectTrigger><SelectContent><SelectItem value="en">{t("english")}</SelectItem><SelectItem value="ar">{t("arabic")}</SelectItem></SelectContent></Select></div>
                <div className="space-y-2"><Label>{t("theme")}</Label><Select value={theme} onValueChange={(value) => value && setTheme(value)}><SelectTrigger className="w-full"><span>{theme === "dark" ? t("dark") : theme === "light" ? t("light") : t("system")}</span></SelectTrigger><SelectContent><SelectItem value="light">{t("light")}</SelectItem><SelectItem value="dark">{t("dark")}</SelectItem><SelectItem value="system">{t("system")}</SelectItem></SelectContent></Select></div>
              </div>
            </section>
            <section className="space-y-3 border-t border-border pt-6">
              <div><h3 className="font-serif text-lg text-ink">{t("feedSubscriptions")}</h3><p className="text-xs leading-5 text-ink-faint">{t("uiOpmlHelp")}</p></div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" className="min-h-10 flex-1 gap-2" onClick={() => fileInputRef.current?.click()} disabled={importing}><Upload className="h-4 w-4" aria-hidden />{importing ? t("importing") : t("importOpml")}</Button>
                <input ref={fileInputRef} type="file" accept=".opml,.xml" className="sr-only" aria-label={t("importOpml")} onChange={handleImport} />
                <Button variant="outline" size="sm" className="min-h-10 flex-1 gap-2" onClick={exportOpml}><Download className="h-4 w-4" aria-hidden />{t("exportOpml")}</Button>
              </div>
              {message && <p className="text-xs text-ink-subtle" role="status">{message}</p>}
            </section>
            <section className="border-t border-border pt-6">
              <h3 className="font-serif text-lg text-ink">{t("keyboardShortcuts")}</h3>
              <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-3 rounded-md bg-muted/45 p-4 text-xs text-ink-subtle">
                <span>{t("nextPrevious")}</span><kbd className="justify-self-end font-mono">J / K</kbd>
                <span>{t("openOriginalShortcut")}</span><kbd className="justify-self-end font-mono">O</kbd>
                <span>{t("markReadShortcut")}</span><kbd className="justify-self-end font-mono">M</kbd>
                <span>{t("searchRefresh")}</span><kbd className="justify-self-end font-mono">/ / R</kbd>
              </div>
            </section>
          </div>
        )}
        {section === "sources" && <div className="pb-3 pt-2"><SourcesSettings onAddFeed={onAddFeed} /></div>}
      </DialogContent>
    </Dialog>
  );
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
