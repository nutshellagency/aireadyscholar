// Contact form: stores each message in Upstash Redis (list "contact:messages").
// Read them in the Upstash console (Data Browser), or at /api/contact?admin=YOUR_ADMIN_KEY if ADMIN_KEY is set in Vercel.
export const dynamic = "force-dynamic";

const RURL = process.env.UPSTASH_REDIS_REST_URL || "";
const RTOK = process.env.UPSTASH_REDIS_REST_TOKEN || "";
const ADMIN = process.env.ADMIN_KEY || "";

async function redis(cmd: (string | number)[]) {
  const r = await fetch(RURL, {
    method: "POST",
    headers: { Authorization: `Bearer ${RTOK}`, "Content-Type": "application/json" },
    body: JSON.stringify(cmd),
    signal: AbortSignal.timeout(5000),
  });
  return r.json();
}

const clean = (v: unknown, max: number) => String(v ?? "").replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, max);

export async function POST(req: Request) {
  if (!RURL || !RTOK) return Response.json({ error: "The message service is not set up yet." }, { status: 503 });
  let body: any;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "The form data could not be read." }, { status: 400 });
  }
  if (body.website) return Response.json({ ok: true }); // honeypot: quietly ignore bots
  const msg = {
    name: clean(body.name, 100),
    email: clean(body.email, 150),
    university: clean(body.university, 150),
    role: clean(body.role, 60),
    message: clean(body.message, 3000),
    at: new Date().toISOString(),
  };
  if (!msg.name || !msg.message) return Response.json({ error: "Please add your name and a message." }, { status: 400 });
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(msg.email)) return Response.json({ error: "Please check your email address." }, { status: 400 });

  const ip = (req.headers.get("x-forwarded-for") || "unknown").split(",")[0].trim();
  try {
    const n = await redis(["INCR", `contact:rate:${ip}`]);
    if (n?.result === 1) await redis(["EXPIRE", `contact:rate:${ip}`, 3600]);
    if ((n?.result || 0) > 5) return Response.json({ error: "Too many messages from this connection. Please try again in an hour." }, { status: 429 });
    await redis(["LPUSH", "contact:messages", JSON.stringify(msg)]);
    await redis(["LTRIM", "contact:messages", 0, 999]);
  } catch {
    return Response.json({ error: "The message service did not answer." }, { status: 502 });
  }
  return Response.json({ ok: true });
}

export async function GET(req: Request) {
  const key = new URL(req.url).searchParams.get("admin") || "";
  if (!ADMIN || key !== ADMIN) return Response.json({ error: "Not found." }, { status: 404 });
  const j = await redis(["LRANGE", "contact:messages", 0, 99]);
  const items = (j?.result || []).map((s: string) => {
    try {
      return JSON.parse(s);
    } catch {
      return s;
    }
  });
  return Response.json({ count: items.length, messages: items });
}
