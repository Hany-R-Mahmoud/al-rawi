"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, GitBranch, LockKeyhole, Mail, Plug2, RefreshCw, Rss, Share2, Tv } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/components/language-provider";
import { useNative } from "@/hooks/use-native";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { githubReleasesFeed } from "@/lib/source-catalog";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { isNative } from "@/lib/native-shares";
import {
  connectSource, disconnectSource, gmailLabels, onSourcesChanged,
  selectedGmailLabel, setSelectedGmailLabel, sourceStatus, syncSource,
  type GmailLabel, type GoogleSource,
} from "@/lib/native-sources";

export function SourcesSettings({ onAddFeed }: { onAddFeed: (url: string, title?: string, category?: string) => Promise<void> }) {
  const { t, language } = useLanguage();
  const native = useNative();
  const [configured, setConfigured] = useState(false);
  const [connected, setConnected] = useState({ gmail: false, youtube: false });
  const [labels, setLabels] = useState<GmailLabel[]>([]);
  const [labelId, setLabelId] = useState("");
  const [busy, setBusy] = useState<GoogleSource | null>(null);
  const [error, setError] = useState("");
  const [feedUrl, setFeedUrl] = useState("");
  const [githubRepo, setGithubRepo] = useState("");
  const [adding, setAdding] = useState(false);

  const refresh = useCallback(async () => {
    if (!isNative()) return;
    try {
      const status = await sourceStatus();
      setConfigured(status.configured);
      setConnected({ gmail: status.gmail, youtube: status.youtube });
      if (status.gmail) {
        const [options, saved] = await Promise.all([gmailLabels(), selectedGmailLabel()]);
        setLabels(options);
        setLabelId(options.some((label) => label.id === saved) ? saved : "");
      }
    } catch { setError(t("sourcesError")); }
  }, [t]);

  useEffect(() => {
    queueMicrotask(() => { void refresh(); });
    const visible = () => { if (document.visibilityState === "visible") void refresh(); };
    let dispose: (() => Promise<void>) | undefined;
    let dead = false;
    void onSourcesChanged(() => void refresh()).then((cleanup) => { if (dead) void cleanup(); else dispose = cleanup; }).catch(() => {});
    document.addEventListener("visibilitychange", visible);
    return () => { dead = true; void dispose?.(); document.removeEventListener("visibilitychange", visible); };
  }, [refresh]);

  const connect = async (source: GoogleSource) => {
    setBusy(source);
    setError("");
    try { await connectSource(source); }
    catch { setError(t("sourcesError")); }
    finally { setBusy(null); }
  };
  const disconnect = async (source: GoogleSource) => {
    setBusy(source);
    setError("");
    try {
      await disconnectSource(source);
      if (source === "gmail") { setLabels([]); setLabelId(""); await setSelectedGmailLabel(""); }
      await refresh();
    } catch { setError(t("sourcesError")); }
    finally { setBusy(null); }
  };
  const sync = async (source: GoogleSource) => {
    setBusy(source);
    setError("");
    try { const count = await syncSource(source, true); toast.success(t("sourcesSyncDone", { count })); }
    catch { setError(t("sourcesError")); }
    finally { setBusy(null); }
  };

  const addFeed = async (value: string, title?: string, category?: string) => {
    setAdding(true);
    setError("");
    try {
      await onAddFeed(value, title, category);
      setFeedUrl("");
      setGithubRepo("");
      toast.success(t("hubSourceAdded"));
    } catch (e) {
      setError(e instanceof Error && e.message ? e.message : t("hubSourceAddError"));
    } finally {
      setAdding(false);
    }
  };

  const addGithub = async () => {
    try {
      const parts = githubRepo.trim().replace(/^https?:\/\/github\.com\//i, "").replace(/\/$/, "").split("/");
      if (parts.length !== 2) throw Error(t("hubSourceAddError"));
      await addFeed(githubReleasesFeed(parts[0], parts[1]), parts[0] + "/" + parts[1] + " releases", "GitHub");
    } catch { setError(t("hubSourceAddError")); }
  };

  const options = [
    { id: "gmail" as const, icon: Mail, name: t("inboxSourceGmail"), detail: t("sourcesGmailHint") },
    { id: "youtube" as const, icon: Tv, name: t("inboxSourceYoutube"), detail: t("sourcesYouTubeHint") },
  ];
  return (
    <section className="space-y-5">
      <header>
        <p className="mb-1 font-mono text-[10px] uppercase tracking-[.16em] text-accent2">{t("uiSourcesAndroid")}</p>
        <h3 className={"text-2xl text-ink " + (language === "ar" ? "font-arabic" : "font-serif")}>{t("sourcesTitle")}</h3>
        <p className="mt-2 max-w-xl text-sm leading-6 text-ink-subtle">{t("sourcesDescription")}</p>
      </header>
      <div className="space-y-5 border-y border-border py-5">
        <div className="flex items-start gap-3">
          <Rss className="mt-1 h-5 w-5 shrink-0 text-accent2" aria-hidden />
          <div className="min-w-0 flex-1">
            <h4 className="font-semibold text-ink">{t("hubSourcesAddFeeds")}</h4>
            <p className="mt-1 text-xs leading-6 text-ink-subtle">{t("hubSourcesAddHelp")}</p>
          </div>
        </div>
        <form className="flex flex-wrap gap-2" onSubmit={(event) => { event.preventDefault(); void addFeed(feedUrl.trim()); }}>
          <Input type="url" required value={feedUrl} onChange={(event) => setFeedUrl(event.target.value)} placeholder={t("hubFeedUrl")} aria-label={t("hubFeedUrl")} className="min-w-0 flex-1 sm:min-w-[220px]" />
          <Button type="submit" disabled={adding || !feedUrl.trim()} className="min-h-10">{t("hubFeedAdd")}</Button>
        </form>
        <div className="flex items-start gap-3 border-t border-border pt-5">
          <GitBranch className="mt-1 h-5 w-5 shrink-0 text-accent2" aria-hidden />
          <div className="min-w-0 flex-1">
            <h4 className="font-semibold text-ink">{t("hubGithubName")}</h4>
            <p className="mt-1 text-xs leading-6 text-ink-subtle">{t("hubGithubHelp")}</p>
          </div>
        </div>
        <form className="flex flex-wrap gap-2" onSubmit={(event) => { event.preventDefault(); void addGithub(); }}>
          <Input required value={githubRepo} onChange={(event) => setGithubRepo(event.target.value)}
            aria-label={t("hubGithubName")} placeholder={t("hubGithubExample")} className="min-w-0 flex-1 sm:min-w-[220px]" />
          <Button type="submit" variant="outline" disabled={adding || !githubRepo.trim()} className="min-h-10">{t("hubFollowGithub")}</Button>
        </form>
        <div className="flex items-start gap-3 border-t border-border pt-5">
          <Share2 className="mt-1 h-5 w-5 shrink-0 text-accent2" aria-hidden />
          <div>
            <h4 className="font-semibold text-ink">{t("hubOtherSources")}</h4>
            <p className="mt-1 text-xs leading-6 text-ink-subtle">{t("hubShareGuide")}</p>
          </div>
        </div>
        <p className="border-s-2 border-accent2 bg-muted/45 px-4 py-3 text-xs leading-6 text-ink-subtle">{t("hubNoNotificationAccess")}</p>
      </div>
      {!native && <p className="border-s-2 border-accent2 bg-muted/45 px-4 py-3 text-xs leading-6 text-ink-subtle">{t("sourcesNativeOnly")} {t("uiSourcesNoAccount")}</p>}
      {native && !configured && <p className="border-s-2 border-accent2 bg-muted/45 px-4 py-3 text-xs leading-6 text-ink-subtle">{t("uiSourceNoClient")}</p>}
      {error && <p role="alert" className="border-s-2 border-destructive px-3 py-2 text-xs text-destructive">{error}</p>}
      <div className="divide-y divide-border border-y border-border">
        {options.map(({ id, icon: Icon, name, detail }) => (
          <section key={id} className="py-5">
            <div className="flex flex-wrap items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-border bg-paper-raised text-accent2"><Icon className="h-5 w-5" aria-hidden /></div>
              <div className="min-w-[180px] flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="font-semibold text-ink">{name}</h4>
                  {connected[id] && <span className="inline-flex items-center gap-1 text-[11px] text-accent2"><CheckCircle2 className="h-3.5 w-3.5" aria-hidden />{t("sourcesConnected")}</span>}
                </div>
                <p className="mt-1 text-xs leading-6 text-ink-subtle">{detail}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {!connected[id] ? (
                  <Button variant="outline" size="sm" className="min-h-10 gap-1.5" disabled={!native || !configured || busy !== null} onClick={() => void connect(id)}>
                    <Plug2 className="h-3.5 w-3.5" aria-hidden />{busy === id ? t("sourcesConnecting") : t("sourcesConnect")}
                  </Button>
                ) : (
                  <>
                    <Button variant="default" size="sm" className="min-h-10 gap-1.5" disabled={busy !== null || (id === "gmail" && !labelId)} onClick={() => void sync(id)}>
                      <RefreshCw className="h-3.5 w-3.5" aria-hidden />{busy === id ? t("sourcesRefreshing") : t("sourcesRefresh")}
                    </Button>
                    <Button variant="ghost" size="sm" className="min-h-10" disabled={busy !== null} onClick={() => void disconnect(id)}>{t("sourcesDisconnect")}</Button>
                  </>
                )}
              </div>
            </div>
            {id === "gmail" && connected.gmail && <div className="ms-[60px] mt-5 max-w-md space-y-2">
              <label className="text-xs font-medium text-ink">{t("uiSourceGmailLabel")}</label>
              <Select value={labelId} onValueChange={(idValue) => { if (!idValue) return; setLabelId(idValue); void setSelectedGmailLabel(idValue); }}>
                <SelectTrigger className="min-h-10 w-full text-sm">{labels.find((l) => l.id === labelId)?.name || t("sourcesChooseLabel")}</SelectTrigger>
                <SelectContent>{labels.map((label) => <SelectItem key={label.id} value={label.id}>{label.name}</SelectItem>)}</SelectContent>
              </Select>
              {!labels.length && <p className="text-xs leading-5 text-ink-faint">{t("sourcesNoLabels")}</p>}
            </div>}
          </section>
        ))}
      </div>
      <p className="text-xs leading-6 text-ink-subtle">{t("hubGmailPrivacy")} {t("hubNewsletterNote")}</p>
      <p className="flex items-start gap-2 text-xs leading-6 text-ink-faint"><LockKeyhole className="mt-1 h-4 w-4 shrink-0 text-accent2" aria-hidden />{t("uiSourcesPrivacy")} {t("sourcesNeverAutomatic")}</p>
    </section>
  );
}
