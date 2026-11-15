// Lists every English string that needs translating and writes it to messages/en.json (interface + tools) and messages/en.guides.json (guides).
// Usage: node --experimental-strip-types --no-warnings scripts/i18n-extract.mjs
import { readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { CATEGORIES, TOOLS_FOR_I18N } from "../lib/tools.ts";
import { GUIDES } from "../lib/guides.ts";

const ui = new Set();
const guides = new Set();

// 1. t("...") calls in the source
function walk(dir) {
  for (const n of readdirSync(dir)) {
    const f = path.join(dir, n);
    if (statSync(f).isDirectory()) walk(f);
    else if (/\.(tsx|ts)$/.test(n)) scan(f);
  }
}
function scan(file) {
  const src = readFileSync(file, "utf8");
  for (const m of src.matchAll(/\bt\(\s*("(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*')/g)) {
    try { ui.add(m[1].startsWith('"') ? JSON.parse(m[1]) : Function(`"use strict";return ${m[1]}`)()); } catch { /* not a plain literal */ }
  }
}
for (const d of ["app", "views", "components", "lib"]) walk(d);

// 2. Data that is translated when rendered
for (const c of CATEGORIES) { ui.add(c.title); ui.add(c.title.split(" ")[0]); ui.add(c.blurb); }
for (const t of TOOLS_FOR_I18N) {
  ui.add(t.title); ui.add(t.seoTitle); ui.add(t.desc);
  t.steps.forEach((s) => ui.add(s));
  t.faqs.forEach((f) => { ui.add(f.q); ui.add(f.a); });
}
// Home page "perks" are plain data passed through t() as variables
const home = readFileSync("views/Home.tsx", "utf8");
for (const m of home.matchAll(/title: "([^"]+)", text: "([^"]+)"/g)) { ui.add(m[1]); ui.add(m[2]); }
// guide titles are shown on tool pages (interface namespace)
for (const g of GUIDES) ui.add(g.title);

// 3. Guides (separate file: long, and only loaded on guide pages)
for (const g of GUIDES) {
  guides.add(g.title); guides.add(g.description); guides.add(g.cta);
  g.steps.forEach((s) => guides.add(s));
  g.body.forEach((b) => (b.t === "ul" || b.t === "ol" ? b.items.forEach((i) => guides.add(i)) : guides.add(b.text)));
  g.faqs.forEach((f) => { guides.add(f.q); guides.add(f.a); });
}

const dump = (set) => Object.fromEntries([...set].sort((a, b) => a.localeCompare(b)).map((k) => [k, k]));
writeFileSync("messages/en.json", JSON.stringify(dump(ui), null, 2) + "\n");
writeFileSync("messages/en.guides.json", JSON.stringify(dump(guides), null, 2) + "\n");
const words = (s) => [...s].reduce((n, k) => n + k.split(/\s+/).length, 0);
console.log(`interface + tools: ${ui.size} strings (~${words(ui)} words) -> messages/en.json`);
console.log(`guides:            ${guides.size} strings (~${words(guides)} words) -> messages/en.guides.json`);
