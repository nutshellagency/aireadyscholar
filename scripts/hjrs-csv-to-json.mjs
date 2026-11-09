// Turns data/hjrs-journals.csv into data/hjrs-journals.json.
// Fill the category (W, X or Y) and valid_until from hjrs.hec.gov.pk, then run:
//   node scripts/hjrs-csv-to-json.mjs "Your Name"
import { readFileSync, writeFileSync } from "node:fs";
const rows = readFileSync(new URL("../data/hjrs-journals.csv", import.meta.url), "utf8").trim().split(/\r?\n/);
const head = rows.shift().split(",");
const split = (line) => { const out = []; let cur = "", q = false;
  for (const ch of line) { if (ch === '"') q = !q; else if (ch === "," && !q) { out.push(cur); cur = ""; } else cur += ch; }
  out.push(cur); return out.map((x) => x.trim()); };
const journals = rows.map(split).map((c) => Object.fromEntries(head.map((h, i) => [h, c[i] || ""])))
  .filter((j) => /^[WXY]$/i.test(j.category))
  .map((j) => ({ ...j, category: j.category.toUpperCase() }));
const skipped = rows.length - journals.length;
writeFileSync(new URL("../data/hjrs-journals.json", import.meta.url), JSON.stringify({
  about: "Curated copy of HJRS categories for English literature, linguistics and ELT journals. Filled from hjrs.hec.gov.pk only.",
  source: "https://hjrs.hec.gov.pk",
  last_checked: new Date().toISOString().slice(0, 10),
  checked_by: process.argv[2] || "",
  journals,
}, null, 2) + "\n");
console.log(`Wrote ${journals.length} journals. Skipped ${skipped} rows with no W/X/Y category (not recognised or not filled).`);
