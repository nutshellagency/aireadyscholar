// Quick test of a deployed (or local) connector: node scripts/smoke.mjs https://your-app.vercel.app [key]
const base = (process.argv[2] || "http://localhost:3000").replace(/\/$/, "");
const key = process.argv[3] ? `&key=${encodeURIComponent(process.argv[3])}` : "";

const checks = [
  ["search", `/rest/search?query=${encodeURIComponent("multimodal discourse analysis television news")}&year_from=2018&limit=5`],
  ["search (Pakistan)", `/rest/search?query=${encodeURIComponent("code-switching")}&pakistan_only=true&limit=5`],
  ["per-year", `/rest/per-year?query=${encodeURIComponent("multimodal discourse analysis television news")}`],
  ["closest", `/rest/closest?question=${encodeURIComponent("How do text and image combine in breaking-news graphics on Pakistani TV channels?")}&include_pakistan=true`],
  ["verify", `/rest/verify?citation=${encodeURIComponent("10.1016/j.patter.2023.100779")}`],
  ["journal", `/rest/journal?journal=${encodeURIComponent("Journal of Pragmatics")}`],
  ["pakistan", `/rest/pakistan?x=1`],
];

for (const [name, path] of checks) {
  const t = Date.now();
  try {
    const res = await fetch(base + path + key);
    const json = await res.json();
    const n = json.count ?? json.total ?? json.candidates?.length ?? json.journals?.length ?? (json.as_of ? 1 : 0);
    console.log(`${res.ok ? "OK  " : "FAIL"} ${name.padEnd(18)} ${String(Date.now() - t).padStart(5)} ms  results=${n}${json.errors ? "  errors=" + JSON.stringify(json.errors) : ""}`);
  } catch (e) {
    console.log(`FAIL ${name.padEnd(18)} ${e.message}`);
  }
}
