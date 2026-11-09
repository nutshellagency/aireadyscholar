// Plain REST endpoints, for Custom GPT Actions and quick browser tests.
// Example: /rest/search?query=code-switching%20Pakistani%20TV&year_from=2018
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

const num = (v: string | null) => (v ? Number(v) : undefined);
const bool = (v: string | null) => v === "true" || v === "1";

export async function GET(req: Request, ctx: { params: Promise<{ tool: string }> }) {
  if (!authorized(req)) return denied();
  const { tool } = await ctx.params;
  const q = new URL(req.url).searchParams;
  try {
    let out: unknown;
    switch (tool) {
      case "search":
        out = await searchPapers({
          query: q.get("query") || "",
          year_from: num(q.get("year_from")),
          year_to: num(q.get("year_to")),
          type: q.get("type") || undefined,
          open_access_only: bool(q.get("open_access_only")),
          pakistan_only: bool(q.get("pakistan_only")),
          limit: num(q.get("limit")),
        });
        break;
      case "per-year":
        out = await papersPerYear({
          query: q.get("query") || "",
          year_from: num(q.get("year_from")),
          year_to: num(q.get("year_to")),
          pakistan_only: bool(q.get("pakistan_only")),
        });
        break;
      case "closest":
        out = await closestStudies({
          question: q.get("question") || "",
          year_from: num(q.get("year_from")),
          limit: num(q.get("limit")),
          include_pakistan: bool(q.get("include_pakistan")),
        });
        break;
      case "verify":
        out = await verifyReference({ citation: q.get("citation") || "" });
        break;
      case "paper":
        out = await getPaper({ id: q.get("id") || "" });
        break;
      case "journal":
        out = await journalCheck({ journal: q.get("journal") || "" });
        break;
      case "pakistan":
        out = pakistanRequirements();
        break;
      default:
        return Response.json({ error: `Unknown tool '${tool}'. Try search, per-year, closest, verify, paper, journal, pakistan.` }, { status: 404 });
    }
    return Response.json(out);
  } catch (e: any) {
    return Response.json({ error: e?.message || String(e) }, { status: 502 });
  }
}
