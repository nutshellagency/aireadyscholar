import { COOKIE } from "../../../lib/auth";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  return new Response(null, {
    status: 303,
    headers: { Location: new URL("/login", req.url).toString(), "Set-Cookie": `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0` },
  });
}
