"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";
import { useLanguage } from "@/components/language-provider";
import Link from "next/link";

/**
 * After the app-hosted OAuth callback completes its cookie exchange, return to reader.
 * The reader remains accessible without signing in.
 */
export default function AuthCallback() {
  const router = useRouter();
  const { language } = useLanguage();
  useEffect(() => { router.replace("/reader"); }, [router]);
  return (
    <main className="flex min-h-[80dvh] items-center justify-center bg-paper text-ink">
      <div className="flex items-center gap-3 text-sm text-ink-subtle" role="status">
        <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden="true" />
        {language === "ar" ? "بنكمّل تسجيل الدخول..." : "Completing sign in…"}
      </div>
      <Link href="/reader" className="ms-4 text-sm underline underline-offset-4">{language === "ar" ? "افتح الوارد" : "Open Inbox"}</Link>
    </main>
  );
}
