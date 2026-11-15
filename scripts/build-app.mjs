// Builds a static copy of the site and copies it into the Android app assets.
//   node scripts/build-app.mjs
// Server-only routes (feedback API, sharing images) cannot be exported, so they are set aside during the build and restored after.
import { cpSync, existsSync, mkdirSync, readdirSync, renameSync, rmSync, statSync } from "node:fs";
import { spawnSync } from "node:child_process";

const STASH = ".app-build-stash";
const HIDE = ["app/api", "app/og"];
const key = (p) => p.replaceAll("/", "__");

function restore() {
  if (!existsSync(STASH)) return;
  for (const name of readdirSync(STASH)) {
    const orig = name.replaceAll("__", "/");
    if (!existsSync(orig)) renameSync(`${STASH}/${name}`, orig);
  }
  rmSync(STASH, { recursive: true, force: true });
}

restore(); // recover from an earlier interrupted run
for (const sig of ["SIGINT", "SIGTERM"]) process.on(sig, () => { restore(); process.exit(1); });

let status = 1;
try {
  mkdirSync(STASH, { recursive: true });
  for (const p of HIDE) if (existsSync(p)) renameSync(p, `${STASH}/${key(p)}`);
  rmSync(".next-app", { recursive: true, force: true });
  const env = {
    ...process.env,
    APP_EXPORT: "1",
    NEXT_PUBLIC_GA_ID: "", // never ship website analytics inside the app
    NEXT_PUBLIC_API_BASE: process.env.NEXT_PUBLIC_API_BASE ?? "https://www.pdfrookie.org",
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.pdfrookie.org",
  };
  status = spawnSync("npx", ["next", "build"], { stdio: "inherit", env }).status ?? 1;
} finally {
  restore();
}
if (status !== 0) process.exit(status);

const dest = "android/app/src/main/assets/www";
rmSync(dest, { recursive: true, force: true });
mkdirSync(dest, { recursive: true });
cpSync(".next-app", dest, { recursive: true });
// Android's asset packager silently drops any folder whose name starts with "_" (Next's is "_next", and there are more inside it).
// Store each as "x_..."; the app maps URLs back at runtime (AssetRouting.kt), so the pages need no changes.
let renamed = 0;
(function walk(d) {
  for (const n of readdirSync(d)) {
    let f = `${d}/${n}`;
    if (!statSync(f).isDirectory()) continue;
    if (n.startsWith("_")) { renameSync(f, `${d}/x${n}`); f = `${d}/x${n}`; renamed++; }
    walk(f);
  }
})(dest);
const offenders = [];
(function check(d) {
  for (const n of readdirSync(d)) {
    const f = `${d}/${n}`;
    if (statSync(f).isDirectory()) { if (n.startsWith("_") || n.startsWith(".")) offenders.push(f); check(f); }
  }
})(dest);
if (offenders.length) { console.error("These folders would be silently dropped from the APK:\n  " + offenders.join("\n  ")); process.exit(1); }
console.log(`\nCopied static site to ${dest} (${renamed} "_" folders renamed with an x prefix)`);
