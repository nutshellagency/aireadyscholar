// MCP endpoint for Claude (and any MCP client): https://<your-app>.vercel.app/api/mcp
import { createMcpHandler } from "mcp-handler";
import { z } from "zod";
import { authorized, denied } from "@/lib/auth";
import {
  searchPapers,
  papersPerYear,
  closestStudies,
  verifyReference,
  getPaper,
  journalCheck,
  pakistanRequirements,
} from "@/lib/research";

export const maxDuration = 60;

const asText = (value: unknown) => ({ content: [{ type: "text" as const, text: JSON.stringify(value, null, 1) }] });

const INSTRUCTIONS =
  "Scholar Research Connector: evidence-linked literature search over OpenAlex, Semantic Scholar and Crossref, " +
  "with an optional Pakistan lane and an HEC/HJRS layer. Results are leads for the scholar to open and read, never conclusions. " +
  "The scholar owns the topic, the gap, the questions and every word of the thesis; never write thesis text for them. " +
  "Before using the Pakistan lane or HEC/HJRS rules, ask the scholar whether they want that angle, unless they already said. " +
  "Every paper you list must come from a tool result in this conversation and carry its link. Never invent a reference.";

const handler = createMcpHandler(
  (server) => {
    server.tool(
      "search_papers",
      "Search scholarly literature across OpenAlex and Semantic Scholar (paywalled and open access). Returns ranked papers with abstract snippets, citation counts, a 'kind' label (journal article, preprint, repository upload...), retraction flag and a link for each. Filters: years, type (article, review, preprint, book-chapter, dissertation), open access only, Pakistan-affiliated authors only. Use for discovery sweeps; use verify_reference to check one specific citation.",
      {
        query: z.string().describe("Topic or full research question"),
        year_from: z.number().int().optional(),
        year_to: z.number().int().optional(),
        type: z.string().optional().describe("article | review | preprint | book-chapter | dissertation"),
        open_access_only: z.boolean().optional(),
        pakistan_only: z.boolean().optional().describe("Only papers with at least one author at a Pakistani institution"),
        limit: z.number().int().min(1).max(50).optional(),
      },
      async (args) => asText(await searchPapers(args as any))
    );

    server.tool(
      "papers_per_year",
      "Papers per year on a topic (OpenAlex title-and-abstract search, main concept as an exact phrase), to judge whether an area is crowded, steady or thin. Returns a loose-match count for comparison and a sample of 15 matching papers: read the sample and report how many are on topic before trusting the curve. Counts are estimates; the reading is the scholar's.",
      {
        query: z.string().describe("The main concept, matched as an exact phrase in title or abstract, e.g. linguistic landscape. Several phrases may be joined with AND. Do not use OR or brackets."),
        must_include: z.array(z.string()).optional().describe("Extra words or phrases that must also appear in title or abstract, e.g. [\"signage\"]"),
        year_from: z.number().int().optional(),
        year_to: z.number().int().optional(),
        pakistan: z.enum(["about", "authors"]).optional().describe("about = title or abstract contains the word Pakistan; authors = a Pakistan-affiliated author. Ask the scholar before using."),
        pakistan_only: z.boolean().optional().describe("Old name for pakistan='authors'"),
        include_books: z.boolean().optional().describe("Also count books and chapters (default: articles and dissertations only)"),
      },
      async (args) => asText(await papersPerYear(args as any))
    );

    server.tool(
      "closest_studies",
      "Find the published studies closest to a proposed research question, for the rival check: what has already been done, and what this study must add. Combines Semantic Scholar relevance, OpenAlex keyword search and papers similar to the top hit; optionally adds a lane of papers by Pakistan-affiliated authors. Returns leads only. Unpublished Pakistani theses are not covered: remind the scholar to search prr.hec.gov.pk.",
      {
        question: z.string(),
        year_from: z.number().int().optional(),
        limit: z.number().int().min(3).max(25).optional(),
        include_pakistan: z.boolean().optional(),
      },
      async (args) => asText(await closestStudies(args as any))
    );

    server.tool(
      "verify_reference",
      "Check one reference against Crossref. Pass a DOI or a whole messy reference string. Returns candidate records (all authors, journal, volume, issue, pages, print and online years) plus a retraction flag from OpenAlex. Evidence for a human to compare; it never declares a reference fake.",
      { citation: z.string() },
      async (args) => asText(await verifyReference(args as any))
    );

    server.tool(
      "get_paper",
      "Fetch one paper by DOI or OpenAlex ID, merged from OpenAlex and Semantic Scholar: abstract, citation trajectory, influential citations, retraction flag, and our HJRS note for its journal.",
      { id: z.string() },
      async (args) => asText(await getPaper(args as any))
    );

    server.tool(
      "journal_check",
      "Profile a journal by name or ISSN from OpenAlex (output, citations, h-index, open access, DOAJ, APC) plus our curated HJRS category if listed, and the checks the scholar must still do by hand (HJRS site, Scopus/WoS, scope, AI policy, predatory signs).",
      { journal: z.string() },
      async (args) => asText(await journalCheck(args as any))
    );

    server.tool(
      "pakistan_requirements",
      "Dated summary of HEC's GenAI framework, the 2026 draft AI policy, similarity limits, HJRS and international AI-authorship rules, for orientation. Use when the scholar wants the Pakistan/HEC angle. Not legal advice.",
      {},
      async () => asText(pakistanRequirements())
    );
  },
  { instructions: INSTRUCTIONS } as any,
  { basePath: "/api", maxDuration: 60, verboseLogs: false }
);

// Some MCP clients (possibly Gemini's connector check) send Accept: application/json only, or no Accept.
// The SDK answers those with 406, so we widen the header before handing the request on.
function withAccept(req: Request): Request {
  if (req.method !== "POST") return req;
  const a = (req.headers.get("accept") || "").toLowerCase();
  if (a.includes("application/json") && a.includes("text/event-stream")) return req;
  const headers = new Headers(req.headers);
  headers.set("accept", "application/json, text/event-stream");
  return new Request(req.url, { method: req.method, headers, body: req.body, duplex: "half" } as RequestInit);
}

async function guarded(req: Request) {
  if (!authorized(req)) return denied();
  return handler(withAccept(req));
}

// Gemini (and some other clients) probe the URL with HEAD first. Without this, Next.js routes HEAD to the
// MCP handler, which never answers it, and the probe times out after 60 seconds.
export function HEAD() {
  return new Response(null, { status: 200, headers: { "Content-Type": "application/json", Allow: "GET, POST, DELETE, OPTIONS" } });
}

export { guarded as GET, guarded as POST, guarded as DELETE };
