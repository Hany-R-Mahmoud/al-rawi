import assert from "node:assert/strict";
import { test } from "node:test";
import { isTrustedMutationOrigin } from "./server-origin";

const req = (url: string, origin?: string, headers: Record<string, string> = {}) =>
  new Request(url, {
    method: "POST",
    headers: { ...(origin ? { Origin: origin } : {}), ...headers },
  });

test("same URL origin is accepted", () => {
  assert.equal(isTrustedMutationOrigin(req("https://al-rawi-rss.vercel.app/api/account/backup", "https://al-rawi-rss.vercel.app")), true);
});

test("Next-normalized localhost URL accepts original matching Host", () => {
  assert.equal(isTrustedMutationOrigin(req("http://localhost:3111/api/account/backup", "http://127.0.0.1:3111", { Host: "127.0.0.1:3111" })), true);
});

test("proxy HTTPS URL accepts matching original Host and protocol", () => {
  assert.equal(isTrustedMutationOrigin(req("http://localhost:3000/api/account/backup", "https://al-rawi-rss.vercel.app", { Host: "al-rawi-rss.vercel.app", "X-Forwarded-Proto": "https" })), true);
});

test("cross-site, missing, null and forged-host origins are rejected", () => {
  assert.equal(isTrustedMutationOrigin(req("https://al-rawi-rss.vercel.app/api/account/backup", "https://evil.example", { Host: "al-rawi-rss.vercel.app" })), false);
  assert.equal(isTrustedMutationOrigin(req("https://al-rawi-rss.vercel.app/api/account/backup")), false);
  assert.equal(isTrustedMutationOrigin(req("https://al-rawi-rss.vercel.app/api/account/backup", "null")), false);
  assert.equal(isTrustedMutationOrigin(req("http://localhost:3000/api/account/backup", "http://evil.example", { Host: "al-rawi-rss.vercel.app" })), false);
});

test("mismatched protocol and malformed origins are rejected", () => {
  assert.equal(isTrustedMutationOrigin(req("https://al-rawi-rss.vercel.app/api/account/backup", "http://al-rawi-rss.vercel.app", { Host: "al-rawi-rss.vercel.app" })), false);
  assert.equal(isTrustedMutationOrigin(req("https://al-rawi-rss.vercel.app/api/account/backup", "https://al-rawi-rss.vercel.app.evil.example")), false);
  assert.equal(isTrustedMutationOrigin(req("https://al-rawi-rss.vercel.app/api/account/backup", "invalid-uri")), false);
});
