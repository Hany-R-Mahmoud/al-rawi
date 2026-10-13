/** Native shell cannot serve Next.js API routes. Point it at the verified production backend. */
const NATIVE_API_ORIGIN = "https://al-rawi-rss.vercel.app";

export function apiUrl(path: `/api/${string}`): string {
  // NEXT_PUBLIC is intentionally build-time; browser requests remain same-origin.
  return process.env.NEXT_PUBLIC_CAPACITOR_BUILD === "1"
    ? `${NATIVE_API_ORIGIN}${path}`
    : path;
}
