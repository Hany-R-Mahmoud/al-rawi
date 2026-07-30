import assert from "node:assert/strict";
import test from "node:test";
import iconv from "iconv-lite";
import { normalizeEncoding } from "./encoding-normalizer";

const arabic = "خبر عربي صحيح";

test("preserves UTF-8 Arabic when the server declares UTF-8", () => {
  const body = Buffer.from(arabic, "utf-8");

  assert.equal(normalizeEncoding(body, "UTF-8"), arabic);
});

test("prefers valid UTF-8 when the feed omits a charset", () => {
  const body = Buffer.from(arabic, "utf-8");

  assert.equal(normalizeEncoding(body), arabic);
});

test("continues decoding genuinely legacy Windows-1256 feeds", () => {
  const body = iconv.encode(arabic, "win1256");

  assert.equal(normalizeEncoding(body, "windows-1256"), arabic);
  assert.equal(normalizeEncoding(body), arabic);
});

test("uses an XML declaration when the HTTP charset is missing", () => {
  const xml = `<?xml version="1.0" encoding="windows-1256"?><title>${arabic}</title>`;
  const body = iconv.encode(xml, "win1256");

  assert.equal(normalizeEncoding(body), xml);
});
