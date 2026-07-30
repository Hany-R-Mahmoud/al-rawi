import assert from "node:assert/strict";
import test from "node:test";
import { buildAndroidIntentUrl, isLikelyWebView, isWithinTtl, readTimestamp, restoreTransportedHash } from "@/lib/pwa";

test("builds an Android intent with an encoded HTTPS fallback and preserved hash", () => {
  const intent = buildAndroidIntentUrl("https://example.com/reader?source=home#story-42");
  assert.ok(intent);
  assert.match(intent, /^intent:\/\/example\.com\/reader\?source=home/);
  assert.match(intent, /S\.browser_fallback_url=https%3A%2F%2Fexample\.com%2Freader%3Fsource%3Dhome%26__pwa_hash%3Dstory-42/);
});

test("restores a transported hash before client routing", () => {
  const location = { href: "https://example.com/reader?__pwa_hash=story-42" } as Location;
  let replaced = "";
  restoreTransportedHash(location, { replaceState: (_state, _title, url) => { replaced = String(url); } });
  assert.equal(replaced, "/reader#story-42");
});

test("recognizes representative embedded-browser user agents", () => {
  assert.equal(isLikelyWebView("Mozilla/5.0 (Linux; Android 14; Pixel) AppleWebKit/537.36 Chrome/125.0.0.0 Mobile Safari/537.36 wv"), true);
  assert.equal(isLikelyWebView("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148"), true);
  assert.equal(isLikelyWebView("Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/125.0.0.0 Mobile Safari/537.36"), false);
});

test("rejects future timestamps and expires old values", () => {
  const now = 10_000;
  const storage = { getItem: () => String(now + 1) };
  assert.equal(readTimestamp(storage, "key", now), null);
  assert.equal(isWithinTtl(now - 100, 500, now), true);
  assert.equal(isWithinTtl(now - 501, 500, now), false);
});
