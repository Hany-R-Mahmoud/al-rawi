import Link from "next/link";
import type { ComponentProps } from "react";

/**
 * Capacitor's Android WebViewLocalServer runs with html5mode=true, which
 * resolves extensionless /reader/ requests to the root index.html.
 * Full document navigation to an explicit exported HTML asset avoids that
 * SPA fallback; regular web builds retain Next.js client navigation.
 */
type AppPage = "home" | "reader";

export function appRouteHref(page: AppPage, nativeExport: boolean): string {
  if (nativeExport) return page === "reader" ? "/reader/index.html" : "/index.html";
  return page === "reader" ? "/reader" : "/";
}

type AppRouteLinkProps = Omit<ComponentProps<"a">, "href"> & { page: AppPage };

export function AppRouteLink({ page, ...props }: AppRouteLinkProps) {
  const nativeExport = process.env.NEXT_PUBLIC_CAPACITOR_BUILD === "1";
  const href = appRouteHref(page, nativeExport);

  // An ordinary anchor intentionally causes a *single* full-page asset load
  // inside Capacitor. Next Link would generate extensionless SPA navigation.
  if (nativeExport) return <a href={href} {...props} />;
  return <Link href={href} {...props} />;
}
