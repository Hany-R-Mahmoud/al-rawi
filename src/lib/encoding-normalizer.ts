import iconv from "iconv-lite";

/**
 * Detects and normalizes legacy Arabic encodings to UTF-8.
 * Handles Windows-1256, ISO-8859-6, and other common encodings.
 */
export function normalizeEncoding(
  body: string | Buffer,
  detectedEncoding?: string | null
): string {
  if (typeof body === "string") {
    // Already a string — assume UTF-8
    return body;
  }

  const encoding =
    normalizeEncodingName(detectedEncoding) ?? detectXmlEncoding(body);

  // UTF-8 is the safest default for feeds. In particular, do not decode
  // valid UTF-8 bytes as Windows-1256: the result can still contain Arabic
  // code points, so checking only for Arabic characters cannot detect that
  // corruption.
  if (encoding === "utf-8") return body.toString("utf-8");

  if (encoding && iconv.encodingExists(encoding)) {
    try {
      const decoded = iconv.decode(body, encoding);
      return decoded;
    } catch {
      // Fall through to buffer-as-utf8
    }
  }

  // With no reliable declared encoding, prefer a byte-valid UTF-8 decode.
  const asUtf8 = body.toString("utf-8");
  if (isValidUtf8(body)) return asUtf8;

  // The remaining candidates are for genuinely legacy feeds.
  for (const enc of ["win1256", "ISO-8859-6", "utf-8"]) {
    try {
      if (iconv.encodingExists(enc)) {
        const decoded = iconv.decode(body, enc as iconv.Encoding);
        if (enc === "utf-8" || hasArabicChars(decoded)) return decoded;
      }
    } catch {
      continue;
    }
  }

  // Last resort: treat buffer as UTF-8
  return asUtf8;
}

function normalizeEncodingName(encoding?: string | null): string | null {
  if (!encoding) return null;
  const lower = encoding.toLowerCase().replace(/[^a-z0-9]/g, "");
  const map: Record<string, string> = {
    utf8: "utf-8",
    unicode11utf8: "utf-8",
    usascii: "utf-8",
    win1256: "win1256",
    windows1256: "win1256",
    cp1256: "win1256",
    iso88596: "ISO-8859-6",
    arabic: "win1256",
    iso88596i: "ISO-8859-6",
  };
  return map[lower] || null;
}

function detectXmlEncoding(body: Buffer): string | null {
  // The XML declaration is ASCII-compatible, so inspecting the initial
  // bytes is safe before choosing a decoder.
  const prefix = body.subarray(0, 512).toString("ascii");
  const match = prefix.match(/<\?xml[^>]*encoding\s*=\s*["']([^"']+)["']/i);
  return normalizeEncodingName(match?.[1]);
}

function isValidUtf8(body: Buffer): boolean {
  const decoded = body.toString("utf-8");
  return Buffer.from(decoded, "utf-8").equals(body);
}

function hasArabicChars(text: string): boolean {
  // Arabic Unicode range: U+0600 to U+06FF
  // Arabic Supplement: U+0750 to U+077F
  // Arabic Extended-A: U+08A0 to U+08FF
  const arabicRegex =
    /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
  return arabicRegex.test(text);
}

/**
 * Detects whether text is primarily Arabic/RTL.
 * Returns 'rtl' if Arabic characters dominate, 'ltr' otherwise.
 */
export function detectDirection(text: string): "rtl" | "ltr" {
  const arabicChars = text.match(
    /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/g
  );
  if (!arabicChars) return "ltr";
  const totalChars = text.replace(/\s/g, "").length;
  if (totalChars === 0) return "ltr";
  return arabicChars.length / totalChars > 0.3 ? "rtl" : "ltr";
}

export function detectLanguage(text: string): "ar" | "en" | "unknown" {
  const arabicRatio = hasArabicChars(text)
    ? (text.match(/[\u0600-\u06FF]/g)?.length ?? 0) /
      Math.max(text.replace(/\s/g, "").length, 1)
    : 0;
  if (arabicRatio > 0.3) return "ar";
  // Simple English detection: mostly ASCII letters
  const latinRatio =
    (text.match(/[a-zA-Z]/g)?.length ?? 0) /
    Math.max(text.replace(/\s/g, "").length, 1);
  if (latinRatio > 0.5) return "en";
  return "unknown";
}
