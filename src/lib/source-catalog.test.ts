import assert from "node:assert/strict";
import test from "node:test";
import { SOURCE_CATALOG, githubReleasesFeed } from "./source-catalog";
import { youtubeVideoId } from "./inbox-preview";

test("catalog is extensible and describes real capabilities", () => {
  assert.ok(SOURCE_CATALOG.some((entry) => entry.id === "github-public" && entry.method === "feed"));
  assert.ok(SOURCE_CATALOG.some((entry) => entry.id === "gmail" && !entry.worksOnWeb && entry.requiresAccount));
  assert.ok(SOURCE_CATALOG.some((entry) => entry.id === "shared" && !entry.requiresAccount));
});

test("public GitHub release Atom URLs are constructed safely", () => {
  assert.equal(githubReleasesFeed("openai", "codex"), "https://github.com/openai/codex/releases.atom");
  assert.throws(() => githubReleasesFeed("attacker/../", "repo"));
  assert.throws(() => githubReleasesFeed("openai", "../repo"));
});

test("YouTube embeds require known hosts and real video IDs", () => {
  assert.equal(youtubeVideoId("https://www.youtube.com/watch?v=dQw4w9WgXcQ"), "dQw4w9WgXcQ");
  assert.equal(youtubeVideoId("https://evil.test/?v=dQw4w9WgXcQ"), null);
  assert.equal(youtubeVideoId("https://www.youtube.com/watch?v=bad"), null);
});
