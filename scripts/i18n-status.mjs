// Translation coverage and safety check.  Usage: node scripts/i18n-status.mjs [lang ...]
// Exits with an error if any translation breaks a {placeholder} or contains something suspicious.
import { existsSync, readFileSync, readdirSync } from "node:fs";

const read = (f) => (existsSync(f) ? JSON.parse(readFileSync(f, "utf8")) : null);
const en = { ui: read("messages/en.json"), guides: read("messages/en.guides.json") };
if (!en.ui || !en.guides) { console.error("Run scripts/i18n-extract.mjs first."); process.exit(1); }

const langs = process.argv.slice(2).length ? process.argv.slice(2) : readdirSync("messages").map((f) => f.match(/^([a-z]{2})\.json$/)?.[1]).filter((l) => l && l !== "en");
const ph = (s) => (s.match(/\{\w+\}/g) ?? []).sort().join(",");
let problems = 0;

for (const lang of langs) {
  console.log(`\n== ${lang} ==`);
  for (const [ns, file] of [["ui", `messages/${lang}.json`], ["guides", `messages/${lang}.guides.json`]]) {
    const tr = read(file) ?? {};
    const keys = Object.keys(en[ns]);
    const done = keys.filter((k) => tr[k] && tr[k].trim());
    const stale = Object.keys(tr).filter((k) => !(k in en[ns]));
    console.log(`  ${ns.padEnd(6)} ${done.length}/${keys.length} translated (${Math.round((done.length / keys.length) * 100)}%)${stale.length ? `, ${stale.length} stale key(s) no longer in the source` : ""}`);
    for (const k of done) {
      if (ph(k) !== ph(tr[k])) { problems++; console.log(`    PLACEHOLDER MISMATCH: "${k.slice(0, 60)}" -> "${tr[k].slice(0, 60)}"`); }
      if (/<[a-z/][^>]*>/i.test(tr[k]) && !/<[a-z/][^>]*>/i.test(k)) { problems++; console.log(`    UNEXPECTED HTML in translation of "${k.slice(0, 60)}"`); }
      if (tr[k].trim() === k.trim() && k.length > 40) console.log(`    (identical to English, check) "${k.slice(0, 60)}"`);
    }
  }
}
console.log(problems ? `\n${problems} PROBLEM(S) FOUND` : "\nNo placeholder or markup problems.");
process.exit(problems ? 1 : 0);
