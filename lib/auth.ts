// Optional shared key. If CONNECTOR_KEY is set, requests need ?key=... (or an x-connector-key header).
export function authorized(req: Request): boolean {
  const want = process.env.CONNECTOR_KEY;
  if (!want) return true;
  const url = new URL(req.url);
  return url.searchParams.get("key") === want || req.headers.get("x-connector-key") === want;
}

export function denied(): Response {
  return new Response(JSON.stringify({ error: "Missing or wrong key. Add ?key=... to the connector URL." }), {
    status: 401,
    headers: { "content-type": "application/json" },
  });
}
