import { COOKIE, MAX_AGE, checkLogin, newSession } from "../../../lib/auth";
export const dynamic = "force-dynamic";

const RURL = process.env.UPSTASH_REDIS_REST_URL || "";
const RTOK = process.env.UPSTASH_REDIS_REST_TOKEN || "";

async function tooMany(ip: string) {
  if (!RURL || !RTOK) return false;
  try {
    const call = (cmd: (string | number)[]) =>
      fetch(RURL, { method: "POST", headers: { Authorization: `Bearer ${RTOK}`, "Content-Type": "application/json" }, body: JSON.stringify(cmd), signal: AbortSignal.timeout(4000) }).then((r) => r.json());
    const n = await call(["INCR", `login:rate:${ip}`]);
    if (n?.result === 1) await call(["EXPIRE", `login:rate:${ip}`, 900]);
    return (n?.result || 0) > 10;
  } catch {
    return false;
  }
}

function go(req: Request, path: string, cookie?: string) {
  const h = new Headers({ Location: new URL(path, req.url).toString(), "Cache-Control": "no-store" });
  if (cookie) h.append("Set-Cookie", cookie);
  return new Response(null, { status: 303, headers: h });
}

export async function POST(req: Request) {
  const ip = (req.headers.get("x-forwarded-for") || "unknown").split(",")[0].trim();
  if (await tooMany(ip)) return go(req, "/login?e=wait");
  const f = await req.formData().catch(() => null);
  const user = String(f?.get("username") || "").trim();
  const pass = String(f?.get("password") || "");
  if (!checkLogin(user, pass)) return go(req, "/login?e=1");
  return go(req, "/vault", `${COOKIE}=${newSession()}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${MAX_AGE}`);
}
