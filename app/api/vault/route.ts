// Owner-only downloads: the stage prompts and the current method texts. Needs the /login session cookie.
import { COOKIE, validSession } from "../../../lib/auth";
import methods from "../../../data/methods.json";
import { stagesMarkdown } from "../../../lib/stages";
export const dynamic = "force-dynamic";

function cookie(req: Request, name: string) {
  const m = (req.headers.get("cookie") || "").match(new RegExp(`(?:^|; )${name}=([^;]+)`));
  return m ? m[1] : undefined;
}

function file(name: string, body: string, type = "text/markdown; charset=utf-8") {
  return new Response(body, { headers: { "Content-Type": type, "Content-Disposition": `attachment; filename="${name}"`, "Cache-Control": "no-store" } });
}

export async function GET(req: Request) {
  if (!validSession(cookie(req, COOKIE))) return Response.json({ error: "Please log in at /login." }, { status: 401 });
  const u = new URL(req.url);
  const what = u.searchParams.get("file");
  if (what === "stages") return file("ARS-stage-guide.md", stagesMarkdown());
  if (what === "method") {
    const m: any = (methods as any).methods || methods;
    const name = u.searchParams.get("name") || "";
    const entry = m[name];
    if (!entry) return Response.json({ error: "No such method." }, { status: 404 });
    const text = typeof entry === "string" ? entry : entry.text || entry.method || JSON.stringify(entry, null, 2);
    return file(`${name}-SKILL.md`, text);
  }
  return Response.json({ error: "Unknown file." }, { status: 404 });
}
