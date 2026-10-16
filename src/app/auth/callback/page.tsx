"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";

/**
 * After proxy.ts completes the Neon OAuth cookie exchange, return to reader.
 * The reader remains accessible without signing in.
 */
export default function AuthCallback() {
  const router = useRouter();
  useEffect(() => { router.replace("/reader"); }, [router]);
  return (
    <main className="flex min-h-[80dvh] items-center justify-center bg-paper text-ink">
      <div className="flex items-center gap-3 text-sm text-ink-subtle" role="status">
        <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden="true" />
        Completing sign in…
      </div>
    </main>
  );
}
