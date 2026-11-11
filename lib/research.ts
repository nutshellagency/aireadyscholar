// Core research functions shared by the MCP tools and the REST API.
// Every function returns plain JSON: records with links, plus a "note" telling the model
// how to present them. Results are leads for the scholar to open and read, never conclusions.

import kitManifest from "../data/kit.json";
import hjrsList from "../data/hjrs-journals.json";

const OA = "https://api.openalex.org";
const S2 = "https://api.semanticscholar.org/graph/v1";
const S2REC = "https://api.semanticscholar.org/recommendations/v1";
const CR = "https://api.crossref.org";

const OPENALEX_KEY = process.env.OPENALEX_API_KEY || "";
const S2_KEY = process.env.SEMANTIC_SCHOLAR_API_KEY || "";
const EMAIL = process.env.CONTACT_EMAIL || "";
const THIS_YEAR = new Date().getUTCFullYear();

export const LEADS_NOTE =
  "Leads, not conclusions. The scholar opens and reads each paper before relying on it. " +
  "Never describe a topic as unstudied; say 'no study found by these searches'.";

// ---------- small helpers ----------

type Cached = { at: number; value: any };
const cache = new Map<string, Cached>();
const TTL_MS = 60 * 60 * 1000;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Semantic Scholar allows 1 request per second: every call to its host waits its turn.
let s2Chain: Promise<void> = Promise.resolve();
let s2Last = 0;
// Optional shared limiter across all Vercel instances (Upstash Redis, free tier):
// set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN. Without them, each instance queues on its own.
const RURL = process.env.UPSTASH_REDIS_REST_URL || "";
const RTOK = process.env.UPSTASH_REDIS_REST_TOKEN || "";

async function globalS2Slot(maxWaitMs = 20000): Promise<void> {
  if (!RURL || !RTOK) return;
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    try {
      const r = await fetch(RURL, {
        method: "POST",
        headers: { Authorization: `Bearer ${RTOK}`, "Content-Type": "application/json" },
        body: JSON.stringify(["SET", "s2:slot", String(Date.now()), "NX", "PX", "1050"]),
        signal: AbortSignal.timeout(3000),
      });
      const j: any = await r.json();
      if (j?.result === "OK") return; // we own the next 1.05 s window
    } catch {
      return; // limiter down: fall back to the local queue rather than block searches
    }
    await sleep(150 + Math.floor(Math.random() * 100));
  }
}

export async function health() {
  const out: any = {
    openalex_key: !!OPENALEX_KEY,
    semantic_scholar_key: !!S2_KEY,
    contact_email: !!EMAIL,
    shared_limiter_configured: !!(RURL && RTOK),
    shared_limiter_url_looks_like_rest: RURL.startsWith("https://"),
  };
  if (RURL && RTOK) {
    try {
      const r = await fetch(RURL, {
        method: "POST",
        headers: { Authorization: `Bearer ${RTOK}`, "Content-Type": "application/json" },
        body: JSON.stringify(["PING"]),
        signal: AbortSignal.timeout(4000),
      });
      const j: any = await r.json().catch(() => ({}));
      out.shared_limiter_ping = j?.result === "PONG" ? "ok" : `failed (${r.status})`;
    } catch (e: any) {
      out.shared_limiter_ping = `failed (${e?.name || "error"})`;
    }
  }
  try {
    await s2Turn();
    const r = await fetch(`${S2}/paper/search?query=linguistic%20landscape&limit=1&fields=title`, {
      headers: s2Headers(),
      signal: AbortSignal.timeout(8000),
    });
    out.semantic_scholar = r.ok ? "ok" : `answered ${r.status}`;
  } catch (e: any) {
    out.semantic_scholar = `failed (${e?.name || "error"})`;
  }
  return out;
}

function s2Turn(): Promise<void> {
  const turn = s2Chain.then(async () => {
    const wait = s2Last + 1100 - Date.now();
    if (wait > 0) await sleep(wait);
    await globalS2Slot();
    s2Last = Date.now();
  });
  s2Chain = turn.catch(() => {});
  return turn;
}

async function getJson(url: string, headers: Record<string, string> = {}): Promise<any> {
  const hit = cache.get(url);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.value;
  const isS2 = url.includes("api.semanticscholar.org");
  let res: Response | null = null;
  for (let attempt = 0; attempt < 4; attempt++) {
    if (isS2) await s2Turn();
    res = await fetch(url, {
      headers: { "User-Agent": `ScholarResearchConnector/0.1${EMAIL ? ` (mailto:${EMAIL})` : ""}`, ...headers },
      signal: AbortSignal.timeout(15000),
    });
    if (res.status !== 429 && res.status < 500) break;
    if (attempt < 3) await sleep(1000 * 2 ** attempt + Math.floor(Math.random() * 300));
  }
  res = res as Response;
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`${new URL(url).host} answered ${res.status}${body ? `: ${body.slice(0, 200)}` : ""}`);
  }
  const value = await res.json();
  cache.set(url, { at: Date.now(), value });
  if (cache.size > 500) cache.delete(cache.keys().next().value as string);
  return value;
}

function oaUrl(path: string, params: Record<string, string | number | undefined>): string {
  const u = new URL(OA + path);
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== "") u.searchParams.set(k, String(v));
  if (OPENALEX_KEY) u.searchParams.set("api_key", OPENALEX_KEY);
  return u.toString();
}

function s2Headers(): Record<string, string> {
  return S2_KEY ? { "x-api-key": S2_KEY } : {};
}

function cleanDoi(doi?: string | null): string | null {
  if (!doi) return null;
  return doi.replace(/^https?:\/\/(dx\.)?doi\.org\//i, "").trim().toLowerCase() || null;
}

const DOI_RE = /10\.\d{4,9}\/[^\s"<>]+/i;

function abstractFromIndex(idx: Record<string, number[]> | null | undefined, max = 900): string | null {
  if (!idx) return null;
  const words: string[] = [];
  for (const [word, positions] of Object.entries(idx)) for (const p of positions) words[p] = word;
  const text = words.filter(Boolean).join(" ");
  return text.length > max ? text.slice(0, max) + "…" : text;
}

// Label what kind of record this is, so grey literature is never passed off as peer reviewed.
function sourceKind(type?: string, sourceType?: string, venue?: string): string {
  const v = (venue || "").toLowerCase();
  if (type === "preprint" || /ssrn|arxiv|biorxiv|medrxiv|research square|preprints\.org/.test(v)) return "preprint";
  if (sourceType === "repository" || /zenodo|figshare|researchgate|academia\.edu/.test(v)) return "repository upload (may not be peer reviewed)";
  if (type === "dissertation") return "thesis or dissertation";
  if (type === "book-chapter" || type === "book") return "book or chapter";
  if (sourceType === "conference" || type === "proceedings-article") return "conference paper";
  if (type === "review") return "review article";
  if (type === "article" || type === "journal-article") return "journal article";
  return type || "unknown";
}

function hjrsLookup(issns: string[] = [], name?: string): any | null {
  const list: any[] = ((hjrsList as any).journals || []).filter((j: any) => !j.example_only);
  const norm = (s: string) => s.replace(/[^0-9x]/gi, "").toLowerCase();
  const wanted = issns.filter(Boolean).map(norm);
  const byIssn = list.find((j) => [j.issn, j.eissn].filter(Boolean).map(norm).some((x: string) => wanted.includes(x)));
  if (byIssn) return byIssn;
  if (name) {
    const n = name.trim().toLowerCase();
    return list.find((j) => (j.title || "").trim().toLowerCase() === n) || null;
  }
  return null;
}

function hjrsInfo(issns: string[] = [], name?: string) {
  const hit = hjrsLookup(issns, name);
  const checked = (hjrsList as any).last_checked || "never";
  const check_by_hand = {
    url: "https://hjrs.hec.gov.pk",
    type_this: issns.filter(Boolean)[0] || name || "",
    how: "Open the link in a normal browser, search the ISSN or journal name, and read the category for the relevant subject area and its validity dates.",
  };
  if (!hit) {
    return {
      in_our_list: false,
      check_by_hand,
      note: `Not in our curated HJRS list (last checked: ${checked}). Absence here proves nothing: check HJRS by hand.`,
    };
  }
  const expired = !!hit.valid_until && new Date(hit.valid_until) < new Date();
  return {
    in_our_list: true,
    category: hit.category,
    subject: hit.subject || null,
    valid_until: hit.valid_until || null,
    expired,
    list_checked: checked,
    check_by_hand,
    note: expired
      ? "Our copy of this category has passed its validity date. Treat it as unknown until checked on HJRS."
      : "From our curated copy of HJRS. Confirm the current category on HJRS before relying on it.",
  };
}

// ---------- record shapes ----------

function fromOpenAlex(w: any) {
  const loc = w.primary_location || {};
  const src = loc.source || {};
  const doi = cleanDoi(w.doi);
  const authors = (w.authorships || []).map((a: any) => a.author?.display_name).filter(Boolean);
  const countries = Array.from(new Set((w.authorships || []).flatMap((a: any) => a.countries || [])));
  return {
    title: w.title || w.display_name,
    year: w.publication_year,
    authors: authors.slice(0, 6),
    author_count: authors.length,
    venue: src.display_name || null,
    issn: src.issn_l || null,
    kind: sourceKind(w.type, src.type, src.display_name),
    cited_by: w.cited_by_count ?? null,
    citations_by_year: (w.counts_by_year || []).slice(0, 6),
    retracted: !!w.is_retracted,
    open_access_pdf: w.open_access?.oa_url || loc.pdf_url || null,
    abstract: abstractFromIndex(w.abstract_inverted_index),
    author_countries: countries,
    pakistan_author: countries.includes("PK"),
    doi,
    url: doi ? `https://doi.org/${doi}` : w.id,
    openalex_id: w.id,
    found_by: "openalex",
  };
}

function fromS2(p: any) {
  const doi = cleanDoi(p.externalIds?.DOI);
  return {
    title: p.title,
    year: p.year,
    authors: (p.authors || []).map((a: any) => a.name).slice(0, 6),
    author_count: (p.authors || []).length,
    venue: p.venue || null,
    issn: null,
    kind: sourceKind((p.publicationTypes || []).includes("Review") ? "review" : (p.publicationTypes || []).includes("JournalArticle") ? "article" : undefined, undefined, p.venue),
    cited_by: p.citationCount ?? null,
    influential_citations: p.influentialCitationCount ?? null,
    retracted: false,
    open_access_pdf: p.openAccessPdf?.url || null,
    abstract: p.abstract ? (p.abstract.length > 900 ? p.abstract.slice(0, 900) + "…" : p.abstract) : null,
    doi,
    url: doi ? `https://doi.org/${doi}` : p.url,
    s2_id: p.paperId,
    found_by: "semantic_scholar",
  };
}

function mergeByDoi(lists: any[][]): any[] {
  const out: any[] = [];
  const seen = new Map<string, any>();
  for (const list of lists) {
    for (const r of list) {
      const key = r.doi || (r.title || "").toLowerCase().replace(/\W+/g, " ").trim();
      if (!key) continue;
      const prev = seen.get(key);
      if (prev) {
        for (const [k, v] of Object.entries(r)) if (prev[k] == null || prev[k] === "") prev[k] = v;
        if (!String(prev.found_by).includes(r.found_by)) prev.found_by = `${prev.found_by}+${r.found_by}`;
      } else {
        seen.set(key, r);
        out.push(r);
      }
    }
  }
  return out;
}

const OA_SELECT =
  "id,doi,title,display_name,publication_year,type,cited_by_count,counts_by_year,authorships,primary_location,open_access,is_retracted,abstract_inverted_index";

const S2_FIELDS = "paperId,title,year,abstract,externalIds,citationCount,influentialCitationCount,venue,url,openAccessPdf,publicationTypes,authors";

function oaFilter(o: { year_from?: number; year_to?: number; type?: string; open_access_only?: boolean; pakistan_only?: boolean }) {
  const f: string[] = [];
  if (o.year_from || o.year_to) f.push(`publication_year:${o.year_from || 1900}-${o.year_to || THIS_YEAR}`);
  if (o.type) f.push(`type:${o.type}`);
  if (o.open_access_only) f.push("is_oa:true");
  if (o.pakistan_only) f.push("authorships.countries:pk");
  return f.join(",") || undefined;
}

async function safe<T>(label: string, p: Promise<T>, errors: string[]): Promise<T | null> {
  try {
    return await p;
  } catch (e: any) {
    errors.push(`${label}: ${e?.message || e}`);
    return null;
  }
}

// ---------- tools ----------

export async function searchPapers(a: {
  query: string;
  year_from?: number;
  year_to?: number;
  type?: string;
  open_access_only?: boolean;
  pakistan_only?: boolean;
  limit?: number;
}) {
  const limit = Math.min(Math.max(a.limit || 20, 1), 50);
  const errors: string[] = [];
  const oa = safe(
    "OpenAlex",
    getJson(oaUrl("/works", { search: a.query, filter: oaFilter(a), per_page: limit, select: OA_SELECT })).then((j) =>
      (j.results || []).map(fromOpenAlex)
    ),
    errors
  );
  const s2Params = new URLSearchParams({ query: a.query, limit: String(Math.min(limit, 40)), fields: S2_FIELDS });
  if (a.year_from || a.year_to) s2Params.set("year", `${a.year_from || ""}-${a.year_to || ""}`);
  if (a.open_access_only) s2Params.set("openAccessPdf", "");
  const s2 = a.pakistan_only
    ? Promise.resolve([] as any[])
    : safe("Semantic Scholar", getJson(`${S2}/paper/search?${s2Params}`, s2Headers()).then((j) => (j.data || []).map(fromS2)), errors);
  const [oaRes, s2Res] = await Promise.all([oa, s2]);
  const papers = mergeByDoi([oaRes || [], s2Res || []]).slice(0, limit);
  return {
    query: a.query,
    filters: { year_from: a.year_from, year_to: a.year_to, type: a.type, open_access_only: !!a.open_access_only, pakistan_only: !!a.pakistan_only },
    count: papers.length,
    papers,
    errors: errors.length ? errors : undefined,
    note:
      LEADS_NOTE +
      " Label each paper's 'kind'. Flag any record with retracted: true and never offer it as evidence." +
      (a.pakistan_only ? " Pakistan filter = at least one author affiliated with a Pakistani institution (OpenAlex)." : ""),
  };
}

// OpenAlex title_and_abstract.search accepts "exact phrases" joined by AND. Brackets, OR and | make it
// silently ignore the filter and count every work, so they are stripped here and a guard checks the total.
function quoteTerm(t: string): string {
  const x = t.replace(/[()|"]/g, " ").replace(/\b(OR|NOT)\b/g, " ").replace(/\s+/g, " ").trim();
  return /\s/.test(x) ? `"${x}"` : x;
}

function buildExpression(a: { query: string; must_include?: string[]; pakistan?: string }): string {
  const pieces = a.query.split(/\bAND\b/).map(quoteTerm).filter(Boolean);
  for (const t of a.must_include || []) if (quoteTerm(t)) pieces.push(quoteTerm(t));
  if (a.pakistan === "about") pieces.push("Pakistan");
  return pieces.join(" AND ");
}

const IMPLAUSIBLE = 5_000_000; // a topic count this large means the filter was not applied

export async function papersPerYear(a: {
  query: string;
  must_include?: string[];
  year_from?: number;
  year_to?: number;
  pakistan?: "about" | "authors";
  pakistan_only?: boolean;
  include_books?: boolean;
}) {
  const from = a.year_from || THIS_YEAR - 10;
  const to = a.year_to || THIS_YEAR;
  const pakistan = a.pakistan || (a.pakistan_only ? "authors" : undefined);
  const errors: string[] = [];
  const expr = buildExpression({ query: a.query, must_include: a.must_include, pakistan });
  const base = [
    `publication_year:${from}-${to}`,
    a.include_books ? "type:article|book-chapter|book|dissertation|preprint" : "type:article|dissertation",
  ];
  if (pakistan === "authors") base.push("authorships.countries:pk");
  const strictFilter = [...base, `title_and_abstract.search:${expr}`].join(",");

  const strict = await safe("OpenAlex", getJson(oaUrl("/works", { filter: strictFilter, group_by: "publication_year" })), errors);
  const counts: Record<string, number> = {};
  for (const g of strict?.group_by || []) counts[g.key] = g.count;
  const total = Object.values(counts).reduce((s, n) => s + n, 0);
  if (total > IMPLAUSIBLE) {
    return {
      query: a.query,
      expression_used: expr,
      error: "OpenAlex did not apply the topic filter (the count equals the whole database). Rephrase with plain words or phrases joined by AND, without brackets or OR.",
    };
  }

  // Sample of the strict set so the model can check precision before trusting the curve.
  const sampleRes = await safe(
    "OpenAlex (sample)",
    getJson(oaUrl("/works", { filter: strictFilter, per_page: 15, sort: "relevance_score:desc", search: a.query, select: OA_SELECT })),
    errors
  );
  const sample = (sampleRes?.results || []).map((w: any) => {
    const r = fromOpenAlex(w);
    return { title: r.title, year: r.year, venue: r.venue, kind: r.kind, pakistan_author: r.pakistan_author, url: r.url, doi: r.doi };
  });

  // Broad = loose full-text match on the same words, to show how much the vocabulary matters.
  const loose = await safe(
    "OpenAlex (broad)",
    getJson(oaUrl("/works", { search: [a.query, ...(a.must_include || [])].join(" "), filter: base.join(","), per_page: 1, select: "id" })),
    errors
  );
  const broad: number | null = loose?.meta?.count ?? null;

  let reading: string;
  if (total === 0) reading = "Zero matches usually means the phrase is not the field's own vocabulary. Rerun with the words the closest papers use before reading this as an open gap.";
  else if (broad && broad > total * 10)
    reading = `The strict count (${total}) is far below the loose match (${broad}). Loose matching catches papers that only mention the words; trust the strict curve, but check the sample for papers outside the topic.`;
  else reading = "Strict and loose counts are close. Check the sample: if many titles are off-topic, add a must_include term or narrow the phrase.";

  return {
    query: a.query,
    expression_used: expr,
    window: `${from}-${to}`,
    pakistan_mode: pakistan || "none",
    counts_by_year: Object.fromEntries(Object.entries(counts).sort()),
    total,
    broad_match: broad,
    reading,
    sample_for_precision_check: sample,
    errors: errors.length ? errors : undefined,
    note:
      "Counts are estimates from OpenAlex title-and-abstract search. Show the yearly curve plainly, then read the sample: say roughly how many sample titles are on topic, and treat the count as an upper limit if many are not. " +
      "pakistan_mode 'about' = title or abstract contains the word Pakistan (studies that name only a city, e.g. Islamabad, are missed: rerun with must_include ['Islamabad'] to check); 'authors' = at least one Pakistan-affiliated author (affiliation data is patchy). " +
      (THIS_YEAR === to ? `${to} is a partial year.` : ""),
  };
}

const STOP = new Set(
  "a an the of in on at to for and or with by from as is are was were be how what which who whom why when where do does did this that these those their its into about among between towards toward through within using use study studies analysis role impact effect effects case pakistani's".split(" ")
);
const GENERIC = new Set("readers reader people perceptions perception attitudes attitude views opinions evaluation evaluate evaluations patterns practices".split(" "));

function keywords(q: string): string[] {
  const seen = new Set<string>();
  return q
    .toLowerCase()
    .replace(/[^a-z0-9\u00c0-\u024f\s-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP.has(w) && !seen.has(w) && (seen.add(w), true))
    .slice(0, 7);
}

// Closest-match lane: all keywords must appear in title or abstract; relax step by step if too few hits.
async function openAlexClosest(question: string, filter: string | undefined, limit: number): Promise<any[]> {
  const k = keywords(question);
  const tries = [k, k.filter((w) => !GENERIC.has(w)), [...k].sort((x, y) => y.length - x.length).slice(0, 3)].filter(
    (t, i, all) => t.length >= 2 && all.findIndex((u) => u.join(" ") === t.join(" ")) === i
  );
  const found: any[] = [];
  for (const t of tries) {
    const f = [filter, `title_and_abstract.search:${t.join(" ")}`].filter(Boolean).join(",");
    const j = await getJson(oaUrl("/works", { filter: f, search: t.join(" "), per_page: limit, select: OA_SELECT }));
    if ((j.meta?.count || 0) > IMPLAUSIBLE) continue;
    for (const w of j.results || []) if (!found.some((x) => x.id === w.id)) found.push(w);
    if (found.length >= Math.min(5, limit)) break;
  }
  if (!found.length) {
    const j = await getJson(oaUrl("/works", { search: k.join(" "), filter, per_page: limit, select: OA_SELECT }));
    found.push(...(j.results || []));
  }
  return found.slice(0, limit).map(fromOpenAlex);
}

export async function closestStudies(a: { question: string; year_from?: number; limit?: number; include_pakistan?: boolean }) {
  const limit = Math.min(Math.max(a.limit || 10, 3), 25);
  const errors: string[] = [];
  const s2Params = new URLSearchParams({ query: a.question.slice(0, 300), limit: String(limit), fields: S2_FIELDS });
  if (a.year_from) s2Params.set("year", `${a.year_from}-`);
  const [s2Res, oaRes] = await Promise.all([
    safe("Semantic Scholar", getJson(`${S2}/paper/search?${s2Params}`, s2Headers()).then((j) => (j.data || []).map(fromS2)), errors),
    safe("OpenAlex", openAlexClosest(a.question, oaFilter({ year_from: a.year_from }), limit), errors),
  ]);
  let recs: any[] = [];
  const seed = (s2Res || [])[0]?.s2_id;
  if (seed) {
    recs =
      (await safe(
        "Semantic Scholar recommendations",
        getJson(`${S2REC}/papers/forpaper/${seed}?limit=8&fields=${S2_FIELDS}`, s2Headers()).then((j) =>
          (j.recommendedPapers || []).map((p: any) => ({ ...fromS2(p), found_by: "semantic_scholar_similar" }))
        ),
        errors
      )) || [];
  }
  let pk: any[] = [];
  if (a.include_pakistan) {
    pk =
      (await safe(
        "OpenAlex (Pakistan lane)",
        openAlexClosest(a.question, oaFilter({ year_from: a.year_from, pakistan_only: true }), 8).then((list) =>
          list.map((r: any) => ({ ...r, found_by: "openalex_pakistan_lane" }))
        ),
        errors
      )) || [];
  }
  const studies = mergeByDoi([s2Res || [], oaRes || [], pk, recs]).slice(0, limit + 8);
  return {
    question: a.question,
    lanes: ["semantic_scholar relevance", "openalex keyword", "semantic_scholar similar-to-top-hit", ...(a.include_pakistan ? ["openalex pakistan authors"] : [])],
    count: studies.length,
    studies,
    errors: errors.length ? errors : undefined,
    reminder:
      "Unpublished Pakistani MPhil/PhD theses are mostly not indexed. The scholar should also search the HEC Pakistan Research Repository (prr.hec.gov.pk) and the department library.",
    note:
      LEADS_NOTE +
      " Read the whole list before judging: a near-duplicate can sit anywhere in it. For each close study, report only what its record shows.",
  };
}

export async function verifyReference(a: { citation: string }) {
  const errors: string[] = [];
  const doiMatch = a.citation.match(DOI_RE);
  const shape = (m: any) => ({
    doi: cleanDoi(m.DOI),
    title: (m.title || [])[0] || null,
    authors: (m.author || []).map((x: any) => [x.family, x.given].filter(Boolean).join(", ")),
    journal: (m["container-title"] || [])[0] || null,
    volume: m.volume || null,
    issue: m.issue || null,
    pages: m.page || null,
    year_issued: m.issued?.["date-parts"]?.[0]?.[0] ?? null,
    year_online: m["published-online"]?.["date-parts"]?.[0]?.[0] ?? null,
    year_print: m["published-print"]?.["date-parts"]?.[0]?.[0] ?? null,
    type: m.type || null,
    url: m.DOI ? `https://doi.org/${m.DOI}` : null,
  });
  const mail = EMAIL ? `mailto=${encodeURIComponent(EMAIL)}` : "";
  let mode = "bibliographic";
  let candidates: any[] = [];
  if (doiMatch) {
    mode = "doi";
    const doi = doiMatch[0].replace(/[.,;)]+$/, "");
    const r = await safe("Crossref", getJson(`${CR}/works/${encodeURIComponent(doi)}${mail ? `?${mail}` : ""}`), errors);
    if (r?.message) candidates = [shape(r.message)];
    else errors.push(`DOI ${doi} is not registered with Crossref (or Crossref did not answer). That alone does not make the reference fake.`);
  }
  if (!candidates.length) {
    const r = await safe(
      "Crossref",
      getJson(`${CR}/works?rows=3&query.bibliographic=${encodeURIComponent(a.citation.slice(0, 500))}${mail ? `&${mail}` : ""}`),
      errors
    );
    candidates = (r?.message?.items || []).map(shape);
  }
  for (const c of candidates) {
    if (!c.doi) continue;
    const w = await safe("OpenAlex", getJson(oaUrl(`/works/doi:${c.doi}`, { select: "is_retracted" })), errors);
    if (w) c.retracted = !!w.is_retracted;
  }
  return {
    citation: a.citation,
    mode,
    candidates,
    errors: errors.length ? errors : undefined,
    note:
      "Evidence for a human to compare, field by field, with what the author wrote. Never call a reference fake: say 'no record found by these routes'. " +
      "A year difference may be online-first versus print. Flag retracted: true.",
  };
}

export async function getPaper(a: { id: string }) {
  const errors: string[] = [];
  const raw = a.id.trim();
  const doi = cleanDoi(raw.match(DOI_RE)?.[0] || null);
  const oaPath = doi ? `/works/doi:${doi}` : `/works/${raw.replace(/^https?:\/\/openalex\.org\//, "")}`;
  const [w, p] = await Promise.all([
    safe("OpenAlex", getJson(oaUrl(oaPath, { select: OA_SELECT })), errors),
    doi
      ? safe("Semantic Scholar", getJson(`${S2}/paper/DOI:${encodeURIComponent(doi)}?fields=${S2_FIELDS},tldr`, s2Headers()), errors)
      : Promise.resolve(null),
  ]);
  const base = w ? fromOpenAlex(w) : p ? fromS2(p) : null;
  if (base && p) {
    (base as any).influential_citations = p.influentialCitationCount ?? null;
    (base as any).tldr = p.tldr?.text || null;
    if (!base.abstract && p.abstract) base.abstract = p.abstract;
  }
  return {
    paper: base,
    hjrs: base?.issn ? hjrsInfo([base.issn], base.venue || undefined) : undefined,
    errors: errors.length ? errors : undefined,
    note: "Flag retracted: true and never offer a retracted paper as evidence. The TLDR is machine-written; read the abstract and paper.",
  };
}

export async function journalCheck(a: { journal: string }) {
  const errors: string[] = [];
  const q = a.journal.trim();
  const issn = q.match(/\b\d{4}-?\d{3}[\dxX]\b/)?.[0];
  const path = issn ? `/sources/issn:${issn.includes("-") ? issn : issn.slice(0, 4) + "-" + issn.slice(4)}` : "/sources";
  const r = await safe("OpenAlex", getJson(issn ? oaUrl(path, {}) : oaUrl(path, { search: q, per_page: 3 })), errors);
  const sources = issn ? (r ? [r] : []) : r?.results || [];
  const journals = sources.map((s: any) => ({
    name: s.display_name,
    issns: s.issn || [],
    publisher: s.host_organization_name || null,
    country: s.country_code || null,
    type: s.type || null,
    works_count: s.works_count ?? null,
    cited_by_count: s.cited_by_count ?? null,
    h_index: s.summary_stats?.h_index ?? null,
    open_access: !!s.is_oa,
    in_doaj: !!s.is_in_doaj,
    apc_usd: s.apc_usd ?? null,
    homepage: s.homepage_url || null,
    openalex_id: s.id,
    hjrs: hjrsInfo(s.issn || [], s.display_name),
  }));
  return {
    query: q,
    journals,
    errors: errors.length ? errors : undefined,
    must_check_by_hand: [
      "HJRS category (W, X or Y) on hjrs.hec.gov.pk",
      "Scopus or Web of Science listing (Clarivate Master Journal List, mjl.clarivate.com)",
      "Aims and scope on the journal's own site: has it published similar papers in the last three years?",
      "AI policy, fees (APC) and citation style in the author guidelines",
      "Predatory warning signs: guaranteed fast acceptance, fees before review, unverifiable editors",
    ],
    note: "OpenAlex profile only. Impact factors and Web of Science status are not in any open API. Never state an HJRS category from memory.",
  };
}

export function pakistanRequirements() {
  return {
    as_of: "2026-11",
    hec_genai_framework: {
      title: "Framework on Use of Generative AI Tools in Higher Education Institutes, v3.3 (13 Feb 2024)",
      allowed_examples: ["generating research question ideas", "improving language and readability", "translation", "formatting references"],
      forbidden: ["generating, fabricating or altering research data", "listing AI as an author", "submitting AI-generated text as one's own"],
      disclosure: "Declare AI use in a statement placed before the references, naming the tool and the purpose.",
    },
    hec_draft_ai_policy_2026: "Circulated August 2026 (check its current status): each university sets its own AI policy and committee; fabricated references, invented data and AI-generated false results count as serious academic misconduct.",
    plagiarism: "Similarity index 19% or less overall, and under 5% from any single source (HEC plagiarism policy, as applied by universities and HEC-recognised journals).",
    hjrs: "HEC Journal Recognition System ranks journals W, X and Y; categories are recalculated each cycle. Always check hjrs.hec.gov.pk.",
    international: "COPE and ICMJE: AI tools cannot be authors. Major publishers require AI disclosure in a stated place (for example Elsevier: a declaration section before the references).",
    note: "Summary for orientation, not legal advice. The university's own policy and the journal's author guidelines take precedence; cite the original documents.",
  };
}


// Latest versions of every kit component, so skills can tell the scholar when theirs is out of date.
export function kitStatus(a: { component?: string; installed_version?: string } = {}) {
  const k: any = kitManifest;
  const newer = (x: string, y: string) => {
    const p = (v: string) => (v || "0").split(".").map((n) => parseInt(n, 10) || 0);
    const [a1, b1, c1] = p(x), [a2, b2, c2] = p(y);
    return a1 !== a2 ? a1 > a2 : b1 !== b2 ? b1 > b2 : c1 > c2;
  };
  const comp = a.component ? k.components.find((c: any) => c.id === a.component) : null;
  return {
    kit_version: k.kit_version,
    released: k.released,
    home: k.home,
    components: k.components,
    latest_changes: k.changes.slice(0, 3),
    check: comp && a.installed_version
      ? {
          component: comp.id,
          installed: a.installed_version,
          latest: comp.version,
          update_available: newer(comp.version, a.installed_version),
          how_to_update: newer(comp.version, a.installed_version)
            ? `Download ${comp.download}, remove the old ${comp.id} skill, and upload the new one. Steps for Claude, Gemini and ChatGPT: ${k.home}`
            : "Up to date.",
        }
      : undefined,
    note: "Tell the scholar in one line only if an update is available, then continue.",
  };
}
