"use client";

import { useState } from "react";
import Link from "next/link";
import { Capacitor } from "@capacitor/core";
import { CloudDownload, CloudUpload, LogIn, LogOut, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/language-provider";
import { authClient } from "@/lib/auth/client";
import { restoreRssBackup, saveRssBackup } from "@/lib/cloud-backup";
import type { StoredFeed } from "@/lib/reader-types";

type Props = { feeds: StoredFeed[]; onImportFeeds: (feeds: StoredFeed[]) => number };
const copy = {
  en: {
    title: "Your Al-Rawi account", native: "Android account sign-in is not ready yet. Local reading and the separately authorized Gmail/YouTube sources continue working.",
    guest: "Sign in with Google on the web to optionally back up RSS subscriptions and reading states.",
    signIn: "Sign in with Google", signOut: "Sign out", backUp: "Back up RSS",
    restore: "Restore RSS", note: "Nothing syncs automatically. This saves RSS feeds and up to 200 recent RSS reading states only. Gmail, YouTube, shared notes and Google tokens stay on this device.",
    successSave: "Your RSS backup was saved.", successRestore: "RSS data restored and merged with local content.",
    failure: "Could not reach your cloud account. Check your session or server configuration.",
  },
  ar: {
    title: "حساب الراوي", native: "تسجيل حساب الراوي على Android لسه مش جاهز. القراءة المحلية ومصادر Gmail وYouTube المستقلة هتفضل شغالة.",
    guest: "سجّل دخولك من الويب علشان تحفظ اشتراكات RSS وحالة القراءة باختيارك.",
    signIn: "الدخول باستخدام Google", signOut: "تسجيل الخروج", backUp: "احفظ RSS",
    restore: "استرجع RSS", note: "مفيش رفع تلقائي. الحفظ فقط لاشتراكات RSS وآخر ٢٠٠ حالة قراءة؛ Gmail وYouTube والملاحظات والـ Tokens بتفضل على جهازك.",
    successSave: "اتحفظت نسخة RSS على حسابك.", successRestore: "تم استرجاع ودمج بيانات RSS المحلية.",
    failure: "تعذر الاتصال بالحساب. راجع تسجيل الدخول وإعدادات الخادم.",
  },
};

export function AccountSettings(props: Props) {
  const { language } = useLanguage();
  if (Capacitor.isNativePlatform()) {
    return <p className="rounded-lg border border-border bg-muted p-4 text-sm leading-7 text-ink-subtle">{copy[language].native}</p>;
  }
  return <WebAccountSettings {...props} />;
}

function WebAccountSettings({ feeds, onImportFeeds }: Props) {
  const { language } = useLanguage();
  const t = copy[language];
  const { data: session, isPending } = authClient.useSession();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const run = async (action: () => Promise<void>, success: string) => {
    setBusy(true); setMessage(""); setError("");
    try { await action(); setMessage(success); }
    catch { setError(t.failure); }
    finally { setBusy(false); }
  };

  return <section className="space-y-4 py-2">
    <h3 className="font-serif text-xl text-ink">{t.title}</h3>
    {isPending ? <LoaderCircle className="h-5 w-5 animate-spin" aria-label="Loading account" /> : !session?.user ? (
      <div className="space-y-4 rounded-xl border border-border p-4">
        <p className="text-sm leading-7 text-ink-subtle">{t.guest}</p>
        <Link href="/auth/sign-in" className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-ink px-4 text-sm font-semibold text-paper"><LogIn className="h-4 w-4" />{t.signIn}</Link>
      </div>
    ) : <>
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-muted/45 p-4">
        <div className="min-w-0"><p className="truncate text-sm font-semibold text-ink">{session.user.name || session.user.email}</p><p className="truncate text-xs text-ink-subtle">{session.user.email}</p></div>
        <Button type="button" variant="outline" size="sm" className="min-h-10 gap-2" disabled={busy} onClick={() => void run(async () => {
          const result = await authClient.signOut();
          if (result.error) throw new Error("Sign out failed");
          window.location.assign("/reader");
        }, "")}><LogOut className="h-4 w-4" />{t.signOut}</Button>
      </div>
      <div className="space-y-3 border-t border-border pt-5">
        <p className="text-sm leading-7 text-ink-subtle">{t.note}</p>
        <div className="flex flex-wrap gap-2">
          <Button type="button" disabled={busy} size="sm" className="min-h-11 gap-2" onClick={() => void run(() => saveRssBackup(feeds), t.successSave)}><CloudUpload className="h-4 w-4"/>{t.backUp}</Button>
          <Button type="button" disabled={busy} variant="outline" size="sm" className="min-h-11 gap-2" onClick={() => void run(() => restoreRssBackup(onImportFeeds), t.successRestore)}><CloudDownload className="h-4 w-4"/>{t.restore}</Button>
          {busy && <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true"/>}
        </div>
      </div>
    </>}
    {message && <p role="status" className="text-sm text-ink">{message}</p>}
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
  </section>;
}
