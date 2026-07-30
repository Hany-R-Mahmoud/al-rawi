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

  const encoding = normalizeEncodingName(detectedEncoding);

  if (encoding && encoding !== "utf-8" && iconv.encodingExists(encoding)) {
    try {
      const decoded = iconv.decode(body, encoding);
      return decoded;
    } catch {
      // Fall through to buffer-as-utf8
    }
  }

  // If encoding is unknown, try common Arabic encodings
  for (const enc of ["win1256", "ISO-8859-6", "utf-8"]) {
    try {
      if (iconv.encodingExists(enc)) {
        const decoded = iconv.decode(body, enc as iconv.Encoding);
        // Check if the result has valid Arabic characters
        if (hasArabicChars(decoded)) return decoded;
      }
    } catch {
      continue;
    }
  }

  // Last resort: treat buffer as UTF-8
  return body.toString("utf-8");
}

function normalizeEncodingName(encoding?: string | null): string | null {
  if (!encoding) return null;
  const lower = encoding.toLowerCase().replace(/[^a-z0-9]/g, "");
  const map: Record<string, string> = {
    win1256: "win1256",
    windows1256: "win1256",
    "windows-1256": "win1256",
    cp1256: "win1256",
    iso88596: "ISO-8859-6",
    "iso-8859-6": "ISO-8859-6",
    arabic: "win1256",
    "iso-8859-6i": "ISO-8859-6",
  };
  return map[lower] || null;
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
