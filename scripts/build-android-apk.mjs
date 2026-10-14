/**
 * Build an installable Android debug APK using only a terminal.
 * npm run build:capacitor exports the Next.js app and syncs native plugins;
 * the Gradle wrapper then compiles and packages the Android application.
 */
import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, rmSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const android = join(root, "android");
const isWindows = process.platform === "win32";
const gradlew = join(android, isWindows ? "gradlew.bat" : "gradlew");
const apk = join(android, "app", "build", "outputs", "apk", "debug", "app-debug.apk");
const target = join(root, "artifacts", "al-rawi-debug.apk");

function run(command, args, cwd = root) {
  console.log("\n> " + [command, ...args].join(" ") + "\n");
  execFileSync(command, args, { cwd, stdio: "inherit", env: process.env, shell: isWindows });
}

// Avoid accidentally handing out a debug APK left behind by a failed earlier build.
rmSync(target, { force: true });

try {
  if (!existsSync(gradlew)) {
    throw new Error("Android Gradle wrapper is missing. Check the android/ directory.");
  }

  if (!process.env.ALRAWI_GOOGLE_ANDROID_CLIENT_ID) {
    console.warn(
      "Google OAuth client ID is not set. RSS and native notification capture " +
      "can run, but Gmail and YouTube connections will remain unconfigured.\n" +
      "For Google sign-in, set ALRAWI_GOOGLE_ANDROID_CLIENT_ID before building.\n"
    );
  }

  run(isWindows ? "npm.cmd" : "npm", ["run", "build:capacitor"]);
  run(gradlew, ["--no-daemon", ":app:assembleDebug"], android);

  if (!existsSync(apk) || statSync(apk).size < 100_000) {
    throw new Error("Expected debug APK does not exist after successful Gradle build.");
  }

  mkdirSync(dirname(target), { recursive: true });
  copyFileSync(apk, target);

  console.log("\nAndroid debug APK created: " + target);
  console.log("Size: " + (statSync(target).size / (1024 * 1024)).toFixed(1) + " MB");
  console.log("Install: adb install -r artifacts/al-rawi-debug.apk");
  console.log("A successful build is not a substitute for real-device acceptance tests.");
} catch (error) {
  console.error("\nAndroid APK build failed: " + error.message);
  console.error(
    "Prerequisites: JDK 21 and Android SDK Platform 36/Build Tools 36, " +
    "with JAVA_HOME and ANDROID_HOME (or android/local.properties) configured."
  );
  process.exitCode = 1;
}
