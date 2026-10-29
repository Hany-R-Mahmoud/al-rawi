import { execFileSync } from "node:child_process";
import { existsSync, renameSync, rmSync, mkdtempSync } from "node:fs";
import { resolve } from "node:path";
import { tmpdir } from "node:os";

const isWindows = process.platform === "win32";
const npx = isWindows ? "npx.cmd" : "npx";
const stash = mkdtempSync(resolve(tmpdir(), "al-rawi-native-"));

// Native APK is a static export. Server-only auth endpoints, OAuth callback
// pages and Next.js proxy must not be included in its export/build graph.
const excluded = [
  ["src/app/api", "api"],
  ["src/app/auth", "auth"],
  ["src/proxy.ts", "proxy.ts"],
];
const moved = [];
try {
  for (const [src, name] of excluded) {
    const source = resolve(src);
    if (!existsSync(source)) continue;
    const target = resolve(stash, name);
    renameSync(source, target);
    moved.push({ source, target });
  }
  // Turbopack cannot bind its local build-helper port in some locked-down
  // environments. Webpack produces the same static export without that server.
  execFileSync(npx, ["next", "build", "--webpack"], {
    stdio: "inherit",
    shell: isWindows,
    env: { ...process.env, CAPACITOR_BUILD: "1", NEXT_PUBLIC_CAPACITOR_BUILD: "1" },
  });
  execFileSync(npx, ["cap", "sync", "android"], { stdio: "inherit", shell: isWindows });
} finally {
  for (const { source, target } of moved.reverse()) {
    if (existsSync(target)) renameSync(target, source);
  }
  rmSync(stash, { recursive: true, force: true });
}
