"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useLanguage } from "@/components/language-provider";
import { useNative } from "@/hooks/use-native";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { isNative } from "@/lib/native-notifications";
import {
  connectSource, disconnectSource, gmailLabels, onSourcesChanged,
  selectedGmailLabel, setSelectedGmailLabel, sourceStatus, syncSource,
  type GmailLabel, type GoogleSource,
} from "@/lib/native-sources";

export function SourcesSettings() {
  const { t } = useLanguage();
  const native = useNative();
  const [configured, setConfigured] = useState(false);
  const [connected, setConnected] = useState({ gmail: false, youtube: false });
  const [labels, setLabels] = useState<GmailLabel[]>([]);
  const [labelId, setLabelId] = useState("");
  const [busy, setBusy] = useState<GoogleSource | null>(null);
  const [error, setError] = useState("");

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
    const onResume = () => { if (document.visibilityState === "visible") void refresh(); };
    let dispose: (() => Promise<void>) | undefined;
    let disposed = false;
    void onSourcesChanged(() => void refresh()).then((callback) => {
      if (disposed) void callback();
      else dispose = callback;
    }).catch(() => {});
    document.addEventListener("visibilitychange", onResume);
    return () => {
      disposed = true;
      void dispose?.();
      document.removeEventListener("visibilitychange", onResume);
    };
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
      await refresh();
      if (source === "gmail") { setLabels([]); setLabelId(""); await setSelectedGmailLabel(""); }
    } catch { setError(t("sourcesError")); }
    finally { setBusy(null); }
  };

  const sync = async (source: GoogleSource) => {
    setBusy(source);
    setError("");
    try {
      const count = await syncSource(source, true);
      toast.success(t("sourcesSyncDone", { count }));
    } catch { setError(t("sourcesError")); }
    finally { setBusy(null); }
  };

  return (
    <section className="space-y-3 border-t border-border pt-4">
      <h3 className="text-sm font-semibold">{t("sourcesTitle")}</h3>
      <p className="text-xs leading-relaxed text-ink-subtle">{t("sourcesDescription")}</p>
      {!native && <p className="text-xs text-ink-faint">{t("sourcesNativeOnly")}</p>}
      {native && !configured && <p className="text-xs text-ink-faint">{t("sourcesNotConfigured")}</p>}
      {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
      {(["gmail", "youtube"] as const).map((source) => (
        <div key={source} className="space-y-2 rounded-lg border border-border bg-paper-raised p-3">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-sm font-medium">{source === "gmail" ? t("inboxSourceGmail") : t("inboxSourceYoutube")}</h4>
            <span className="text-[11px] text-ink-faint">{connected[source] ? t("sourcesConnected") : t("sourcesNotConnected")}</span>
          </div>
          <p className="text-xs text-ink-subtle">{source === "gmail" ? t("sourcesGmailHint") : t("sourcesYouTubeHint")}</p>
          {source === "gmail" && connected.gmail && (
            <div className="space-y-1">
              <label className="text-xs text-ink-subtle">{t("sourcesSelectLabel")}</label>
              <Select value={labelId} onValueChange={(value) => {
                if (!value) return;
                setLabelId(value);
                void setSelectedGmailLabel(value);
              }}>
                <SelectTrigger className="w-full text-xs">
                  {labels.find((l) => l.id === labelId)?.name || t("sourcesChooseLabel")}
                </SelectTrigger>
                <SelectContent>
                  {labels.map((label) => <SelectItem key={label.id} value={label.id}>{label.name}</SelectItem>)}
                </SelectContent>
              </Select>
              {!labels.length && <p className="text-xs text-ink-faint">{t("sourcesNoLabels")}</p>}
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            {!connected[source] ? (
              <Button variant="outline" size="sm" disabled={!native || !configured || busy !== null} onClick={() => void connect(source)}>
                {busy === source ? t("sourcesConnecting") : t("sourcesConnect")}
              </Button>
            ) : (
              <>
                <Button variant="outline" size="sm" disabled={busy !== null || (source === "gmail" && !labelId)} onClick={() => void sync(source)}>
                  {busy === source ? t("sourcesRefreshing") : t("sourcesRefresh")}
                </Button>
                <Button variant="outline" size="sm" disabled={busy !== null} onClick={() => void disconnect(source)}>{t("sourcesDisconnect")}</Button>
              </>
            )}
          </div>
        </div>
      ))}
      <p className="text-[11px] leading-relaxed text-ink-faint">{t("sourcesNeverAutomatic")}</p>
    </section>
  );
}
