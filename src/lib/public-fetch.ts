import { lookup } from "node:dns/promises";

const PRIVATE_HOSTNAMES = new Set(["localhost", "localhost.localdomain", "metadata.google.internal"]);

export type PublicFetchOptions = {
  maxBytes: number;
  accept: string;
  userAgent: string;
};

export type PublicFetchResult = {
  body: Uint8Array;
  contentType: string;
  url: string;
};

export async function fetchPublicResource(value: string, options: PublicFetchOptions): Promise<PublicFetchResult> {
  let target = await validatePublicUrl(value);

  for (let redirects = 0; redirects <= 3; redirects += 1) {
    const response = await fetch(target, {
      redirect: "manual",
      headers: { Accept: options.accept, "User-Agent": options.userAgent },
      signal: AbortSignal.timeout(15_000),
    });

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location) throw new Error("Resource redirect has no destination.");
      target = await validatePublicUrl(new URL(location, target).toString());
      continue;
    }

    if (!response.ok) throw new Error(`Resource fetch failed with HTTP ${response.status}.`);
    const reader = response.body?.getReader();
    if (!reader) throw new Error("Resource response had no body.");

    const chunks: Uint8Array[] = [];
    let total = 0;
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      total += chunk.value.byteLength;
      if (total > options.maxBytes) throw new Error("Resource is too large.");
      chunks.push(chunk.value);
    }

    return { body: concatBytes(chunks, total), contentType: response.headers.get("content-type") || "", url: target.toString() };
  }

  throw new Error("Too many resource redirects.");
}

async function validatePublicUrl(value: string): Promise<URL> {
  const target = new URL(value);
  if (!/^https?:$/.test(target.protocol) || PRIVATE_HOSTNAMES.has(target.hostname.toLowerCase()) || isPrivateIp(target.hostname)) {
    throw new Error("Only public HTTP(S) URLs are supported.");
  }
  const addresses = await lookup(target.hostname, { all: true, verbatim: true });
  if (addresses.some(({ address }) => isPrivateIp(address))) throw new Error("URL host resolves to a private network.");
  return target;
}

function concatBytes(chunks: Uint8Array[], total: number): Uint8Array {
  const result = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return result;
}

function isPrivateIp(address: string): boolean {
  if (address.includes(":")) {
    const value = address.toLowerCase();
    return value === "::1" || value.startsWith("fc") || value.startsWith("fd") || value.startsWith("fe8") || value.startsWith("fe9") || value.startsWith("fea") || value.startsWith("feb");
  }
  if (!/^\d{1,3}(?:\.\d{1,3}){3}$/.test(address)) return false;
  const octets = address.split(".").map(Number);
  if (octets.some((part) => part > 255)) return true;
  const [first, second] = octets;
  return first === 10 || first === 127 || (first === 169 && second === 254) || (first === 172 && second >= 16 && second <= 31) || (first === 192 && second === 168) || first === 0;
}
