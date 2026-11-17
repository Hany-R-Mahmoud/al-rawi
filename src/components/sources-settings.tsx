"use client";

import { useCallback, useEffect, useState } from "react";
import { Bell, GitBranch, Rss } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/components/language-provider";
import { useNative } from "@/hooks/use-native";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { getCapturePackages, isListenerEnabled, listLaunchableApps, openListenerSettings, setCapturePackages, type CaptureApp } from "@/lib/native-capture";
import { githubReleasesFeed } from "@/lib/source-catalog";
import { isNative } from "@/lib/native-shares";

export function SourcesSettings({ onAddFeed }: { onAddFeed: (url: string, title?: string, category?: string) => Promise<void> }) {
  const { t, language } = useLanguage();
  const native = useNative();
  const [error, setError] = useState("");
  const [feedUrl, setFeedUrl] = useState("");
  const [githubRepo, setGithubRepo] = useState("");
  const [adding, setAdding] = useState(false);
  const [captureEnabled, setCaptureEnabled] = useState<boolean | null>(null);
  const [capturePackages, setCapturePackagesState] = useState<string[]>([]);
  const [captureApps, setCaptureApps] = useState<CaptureApp[]>([]);
  const [captureBusy, setCaptureBusy] = useState(false);
  const [captureError, setCaptureError] = useState(false);
  const [captureSearch, setCaptureSearch] = useState("");
  const [addAppsOpen, setAddAppsOpen] = useState(false);

  const refreshCapture = useCallback(async () => {
    if (!isNative()) return;
    try {
      const [permission, selected, available] = await Promise.all([
        isListenerEnabled(), getCapturePackages(), listLaunchableApps(),
      ]);
      setCaptureEnabled(permission.enabled);
      setCapturePackagesState(selected.packages);
      setCaptureApps(available.apps);
      setCaptureError(false);
    } catch { setCaptureError(true); }
  }, []);

  const toggleCapture = async (name: string, enabled: boolean) => {
    setCaptureBusy(true);
    try {
      const next = enabled ? [...capturePackages, name] : capturePackages.filter((p) => p !== name);
      const result = await setCapturePackages(next);
      setCapturePackagesState(result.packages);
      setCaptureError(false);
    } catch { setCaptureError(true); }
    finally { setCaptureBusy(false); }
  };

  useEffect(() => {
    if (!native) return;
    queueMicrotask(() => { void refreshCapture(); });
    const visible = () => {
      if (document.visibilityState === "visible") void refreshCapture();
    };
    document.addEventListener("visibilitychange", visible);
    window.addEventListener("focus", refreshCapture);
    return () => {
      document.removeEventListener("visibilitychange", visible);
      window.removeEventListener("focus", refreshCapture);
    };
  }, [native, refreshCapture]);

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

  return (
    <section className="space-y-5">
      <header>
        <p className="mb-1 font-mono text-[10px] uppercase tracking-[.16em] text-accent2">{t("uiSourcesAndroid")}</p>
        <h3 className={"text-2xl text-ink " + (language === "ar" ? "font-arabic" : "font-serif")}>{t("sourcesTitle")}</h3>
        <p className="mt-2 max-w-xl text-sm leading-6 text-ink-subtle">{t("sourcesDescription")}</p>
      </header>
      {!native && <section className="rounded-md border border-border bg-paper-raised p-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-ink"><Bell className="h-4 w-4 text-accent2" />{t("captureTitle")}</div>
        <p className="mt-2 text-sm leading-6 text-ink-subtle">{language === "ar" ? "التقاط إشعارات التطبيقات المختارة متاح في تطبيق أندرويد فقط. على الويب تقدر تضيف روابط وملاحظات وتتابع RSS." : "Capture from selected apps requires the Android app. On the web, you can save links and notes and follow RSS feeds."}</p>
      </section>}
      {native && <section className="space-y-4 border-y border-border py-5" aria-label={t("captureTitle")}>
        <div className="flex items-center gap-3">
          <Bell className="h-5 w-5 shrink-0 text-accent2" aria-hidden />
          <h4 className="font-semibold text-ink">{t("captureTitle")}</h4>
        </div>
        <p className="text-sm leading-6 text-ink-subtle">{t("capturePrivacy")}</p>
        {captureEnabled === null && !captureError && <p role="status" className="text-sm text-ink-subtle">{language === "ar" ? "بنراجع إذن الإشعارات..." : "Checking notification access..."}</p>}
        {captureEnabled === false && <>
          <p className="text-sm leading-6 text-ink-subtle">{t("captureHintOff")}</p>
          <Button className="min-h-11" onClick={() => void openListenerSettings().catch(() => setCaptureError(true))}>{t("captureGrantAction")}</Button>
        </>}
        {captureEnabled === true && <>
          <p className="text-sm leading-6 text-ink-subtle">{t("captureOn")}</p>
          <h5 className="font-medium text-ink">{t("captureAppsTitle")}</h5>
          {!capturePackages.length && <p className="text-sm text-ink-subtle">{t("captureEmptyApps")}</p>}
          <div className="space-y-2">
            {capturePackages.map((name) => {
              const label = captureApps.find((app) => app.packageName === name)?.label ||
                (name === "com.google.android.youtube" ? "YouTube" : name === "com.google.android.gm" ? "Gmail" : name);
              return <label key={name} className="flex min-h-11 items-center justify-between gap-4 rounded-md border border-border px-3 py-2 text-sm text-ink">
                <span dir="auto" className="min-w-0 break-words">{label}</span>
                <Switch aria-label={label} checked disabled={captureBusy} onCheckedChange={() => void toggleCapture(name, false)} />
              </label>;
            })}
          </div>
          <Button variant="outline" className="min-h-11" onClick={() => setAddAppsOpen((v) => !v)}>{t("captureAddApp")}</Button>
          {addAppsOpen && <div className="space-y-2">
            <Input aria-label={language === "ar" ? "ابحث عن تطبيق" : "Search apps"} placeholder={language === "ar" ? "ابحث عن تطبيق..." : "Search installed apps..."} value={captureSearch} onChange={(event) => setCaptureSearch(event.target.value)} />
            <div className="max-h-64 space-y-2 overflow-y-auto">
            {captureApps.filter((app) => !capturePackages.includes(app.packageName) && (app.label + " " + app.packageName).toLowerCase().includes(captureSearch.toLowerCase())).map((app) =>
              <label key={app.packageName} className="flex min-h-11 items-center justify-between gap-4 border-b border-border px-2 py-1 text-sm text-ink">
                <span dir="auto" className="min-w-0 break-words">{app.label}</span>
                <Switch aria-label={app.label} checked={false} disabled={captureBusy || capturePackages.length >= 50} onCheckedChange={() => void toggleCapture(app.packageName, true)} />
              </label>
            )}
            </div>
          </div>}
        </>}
        {captureError && <div className="flex flex-wrap items-center gap-2"><p role="alert" className="text-xs text-destructive">{t("inboxError")}</p><Button variant="outline" size="sm" onClick={() => void refreshCapture()}>{language === "ar" ? "إعادة المحاولة" : "Retry"}</Button></div>}
      </section>}
      <section className="border-t border-border pt-6">
        <h4 className="mb-3 text-sm font-semibold text-ink">{language === "ar" ? "مصادر القراءة" : "Reading sources"}</h4>
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

      </div>
      </section>
      {error && <p role="alert" className="border-s-2 border-destructive px-3 py-2 text-xs text-destructive">{error}</p>}
    </section>
  );
}
