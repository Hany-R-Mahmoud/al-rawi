import { execFileSync } from "node:child_process";
import { existsSync, renameSync, rmSync } from "node:fs";
import { resolve } from "node:path";
import { tmpdir } from "node:os";
import { mkdtempSync } from "node:fs";

const isWindows = process.platform === "win32";
const npx = isWindows ? "npx.cmd" : "npx";
const api = resolve("src/app/api");
const stash = mkdtempSync(resolve(tmpdir(), "al-rawi-api-"));
const held = resolve(stash, "api");
const hadApi = existsSync(api);
if (hadApi) renameSync(api, held);
try {
  execFileSync(npx, ["next", "build"], {
    stdio: "inherit",
    shell: isWindows,
    env: { ...process.env, CAPACITOR_BUILD: "1", NEXT_PUBLIC_CAPACITOR_BUILD: "1" },
  });
  execFileSync(npx, ["cap", "sync", "android"], { stdio: "inherit", shell: isWindows });
} finally {
  if (hadApi) renameSync(held, api);
  rmSync(stash, { recursive: true, force: true });
}
