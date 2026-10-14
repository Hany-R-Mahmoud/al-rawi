import assert from "node:assert/strict";
import test from "node:test";
import { appRouteHref } from "../components/app-route-link";

test("Capacitor navigation must target exported HTML assets, never SPA fallback", () => {
  assert.equal(appRouteHref("reader", true), "/reader/index.html");
  assert.equal(appRouteHref("home", true), "/index.html");
  assert.notEqual(appRouteHref("reader", true), "/reader/");
});

test("web navigation still uses Next.js routes", () => {
  assert.equal(appRouteHref("reader", false), "/reader");
  assert.equal(appRouteHref("home", false), "/");
});
