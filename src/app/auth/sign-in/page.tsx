"use client";

import { useState } from "react";
import Link from "next/link";
import { Capacitor } from "@capacitor/core";
import { ArrowLeft, LoaderCircle, LockKeyhole } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { useLanguage } from "@/components/language-provider";
import { authClient } from "@/lib/auth/client";

export default function SignInPage() {
  const { language } = useLanguage();
  const ar = language === "ar";
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const native = Capacitor.isNativePlatform();
  const { data: session, isPending } = authClient.useSession();

  const signIn = async () => {
    if (native || pending) return;
    setError("");
    setPending(true);
    try {
      const result = await authClient.signIn.social({
        provider: "google",
        callbackURL: "/auth/callback",
      });
      if (result.error) setError(result.error.message ?? (ar ? "تعذر تسجيل الدخول." : "Sign in could not start."));
    } catch {
      setError(ar ? "تعذر بدء تسجيل الدخول. حاول مرة أخرى." : "Unable to start sign in. Please try again.");
    } finally {
      setPending(false);
    }
  };

  return (
    <main className="flex min-h-[calc(100dvh-4rem)] items-center justify-center bg-paper px-5 py-12 text-ink">
      <section className="w-full max-w-md rounded-2xl border border-border bg-paper-raised p-7 shadow-sm sm:p-10">
        <div className="mb-8 flex items-center gap-3"><BrandLogo className="h-14 w-14" /><span className="font-serif text-xl">Al-Rawi</span></div>
        <LockKeyhole className="mb-5 h-7 w-7 text-accent2" aria-hidden="true" />
        <h1 className={ar ? "font-arabic text-3xl" : "font-serif text-3xl"}>
          {ar ? "حسابك في الراوي" : "Your Al-Rawi account"}
        </h1>
        <p className="mt-3 text-sm leading-7 text-ink-subtle">
          {ar
            ? "سجل دخولك بحساب Google علشان تقدر تحفظ اشتراكاتك وحالة قراءة RSS في حسابك باختيارك. القراءة من غير حساب ما زالت متاحة."
            : "Sign in with Google to optionally back up your RSS subscriptions and reading states. Reading without an account still works."}
        </p>
        {native ? (
          <p className="mt-7 rounded-lg border border-border bg-muted p-4 text-sm" role="status">
            {ar ? "تسجيل حساب الراوي على Android لسه قيد التجهيز. استخدم نسخة الويب مؤقتًا." : "Al-Rawi account sign-in on Android is not ready yet. Use the web version for now."}
          </p>
        ) : !isPending && session?.user ? (
          <div className="mt-7 space-y-4">
            <p className="text-sm">{ar ? "مسجل الدخول:" : "Signed in as:"} <strong>{session.user.email}</strong></p>
            <Link href="/reader" className="inline-flex min-h-11 items-center rounded-lg bg-ink px-5 text-sm font-semibold text-paper">{ar ? "افتح مساحة القراءة" : "Open reading space"}</Link>
          </div>
        ) : (
          <button type="button" disabled={pending || isPending} onClick={() => void signIn()}
            className="mt-8 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-ink px-5 text-sm font-semibold text-paper transition hover:opacity-90 disabled:opacity-60">
            {pending || isPending ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
            {ar ? "المتابعة باستخدام Google" : "Continue with Google"}
          </button>
        )}
        {error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
        <Link href="/reader" className="mt-7 inline-flex min-h-10 items-center gap-2 text-sm text-ink-subtle hover:text-ink"><ArrowLeft className="h-4 w-4" aria-hidden="true"/>{ar ? "المتابعة من غير حساب" : "Continue as guest"}</Link>
      </section>
    </main>
  );
}
