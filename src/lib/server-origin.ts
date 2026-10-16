/**
 * Reject cross-site mutations, even when no Origin header is provided.
 *
 * Next.js may normalize request.url to localhost while preserving the real
 * HTTP Host header (e.g. when a user opens 127.0.0.1). Compare the browser's
 * Origin against both the URL and the actual request Host, never arbitrary
 * X-Forwarded-Host input. Vercel-proxied HTTPS may use X-Forwarded-Proto.
 */
export function isTrustedMutationOrigin(request: Request): boolean {
  const header = request.headers.get("origin");
  if (!header || header === "null") return false;
  let origin: URL;
  try {
    origin = new URL(header);
  } catch {
    return false;
  }
  if (origin.protocol !== "https:" && origin.protocol !== "http:") return false;
  if (origin.href !== origin.origin + "/") return false;

  const target = new URL(request.url);
  if (origin.origin === target.origin) return true;

  const host = request.headers.get("host");
  if (!host || host.toLowerCase() !== origin.host.toLowerCase()) return false;

  if (origin.protocol === target.protocol) return true;
  return origin.protocol === "https:" && request.headers.get("x-forwarded-proto") === "https";
}
