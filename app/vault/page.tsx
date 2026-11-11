import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { COOKIE, validSession } from "../../lib/auth";
import vault from "../../data/vault.json";
import stages from "../../data/stages.json";
import kit from "../../data/kit.json";
import methods from "../../data/methods.json";

export const metadata = { title: "Owner area · AI-Ready Scholar", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

async function messages() {
  const url = process.env.UPSTASH_REDIS_REST_URL, tok = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !tok) return null;
  try {
    const r = await fetch(url, { method: "POST", headers: { Authorization: `Bearer ${tok}`, "Content-Type": "application/json" }, body: JSON.stringify(["LRANGE", "contact:messages", 0, 19]), cache: "no-store", signal: AbortSignal.timeout(5000) });
    const j = await r.json();
    return (j?.result || []).map((s: string) => { try { return JSON.parse(s); } catch { return null; } }).filter(Boolean);
  } catch {
    return null;
  }
}

export default async function Vault() {
  const jar = await cookies();
  if (!validSession(jar.get(COOKIE)?.value)) redirect("/login");
  const v: any = vault, s: any = stages, k: any = kit, m: any = (methods as any).methods;
  const msgs = await messages();
  return (
    <>
      <header className="nav">
        <div className="wrap navrow">
          <a className="brand" href="/" aria-label="AI-Ready Scholar, home">
            <span className="mark" aria-hidden="true" />
            AI-Ready Scholar · owner
          </a>
          <nav aria-label="Owner">
            <a href="#seminar">Seminar</a>
            <a href="#stages">Stage prompts</a>
            <a href="#downloads">Downloads</a>
            <a href="#messages">Messages</a>
            <form method="post" action="/api/logout" style={{ display: "inline" }}>
              <button className="navcta" type="submit" style={{ border: 0, cursor: "pointer", font: "inherit" }}>Log out</button>
            </form>
          </nav>
        </div>
      </header>
      <main>
        <section className="band" id="seminar">
          <div className="wrap">
            <h1 className="kith1">Everything for the seminar</h1>
            <p className="intro">Kit {k.kit_version} · list updated {v.updated}. The deck and rehearsal open in Claude (only you can see them).</p>
            <div className="tablewrap">
              <table className="kittable">
                <thead><tr><th scope="col">Material</th><th scope="col">What it is</th><th scope="col">Version</th><th scope="col">Open</th></tr></thead>
                <tbody>
                  {v.seminar.map((x: any) => (
                    <tr key={x.name}><th scope="row">{x.name}</th><td>{x.what}</td><td>{x.version}</td><td><a className="textlink" href={x.href} target="_blank" rel="noopener noreferrer">Open</a></td></tr>
                  ))}
                  <tr><th scope="row">Stage guide</th><td>The six stages as one Markdown file: goal, how, take care, what you leave with, and what to type.</td><td>{s.version}</td><td><a className="textlink" href="/api/vault?file=stages">Download</a></td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="band alt" id="stages">
          <div className="wrap">
            <h2>Stage prompts, in plain words</h2>
            <p className="intro">From a broad area to one topic. Free tools do the heavy reading; ARS does the precise checks. One stage per chat, carrying the method's summary forward.</p>
            <ol className="changes">
              {s.stages.map((st: any) => (
                <li key={st.stage}>
                  <h3>Stage {st.stage}: {st.title}</h3>
                  <p className="small">{st.tool}</p>
                  <p><b>Type:</b> {st.prompt}</p>
                  <details style={{ marginTop: 10 }}>
                    <summary>Goal, how, take care, what you leave with</summary>
                    {([["Goal, and why", "goal"], ["How to do it", "how"], ["Take care", "care"], ["You leave with", "leave"]] as const).map(([h, key]) => (
                      <div key={key} style={{ marginTop: 10 }}>
                        <b>{h}</b>
                        <ul>{st[key].map((x: string) => <li key={x}>{x}</li>)}</ul>
                      </div>
                    ))}
                  </details>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="band" id="downloads">
          <div className="wrap">
            <h2>Downloads and live checks</h2>
            <div className="tablewrap">
              <table className="kittable">
                <thead><tr><th scope="col">Item</th><th scope="col">Version</th><th scope="col">Get it</th></tr></thead>
                <tbody>
                  <tr><th scope="row">Workspace pack (Word and Excel)</th><td>{k.components.find((c: any) => c.id === "workspace-pack")?.version}</td><td><a className="textlink" href="/downloads/AI-Ready-Scholar-Workspace.zip" download>Download</a></td></tr>
                  {Object.keys(m).map((name) => (
                    <tr key={name}><th scope="row">{name} method (owner copy)</th><td>{m[name].version}</td><td><a className="textlink" href={`/api/vault?file=method&name=${name}`}>Download</a></td></tr>
                  ))}
                  <tr><th scope="row">Connector address</th><td>{k.components.find((c: any) => c.id === "ars-connector")?.version}</td><td><code>https://aireadyscholar.vercel.app/api/mcp</code></td></tr>
                  <tr><th scope="row">Connector health</th><td>live</td><td><a className="textlink" href="/rest/health" target="_blank">Check</a></td></tr>
                  <tr><th scope="row">Custom GPT Actions file</th><td>live</td><td><a className="textlink" href="/openapi.json" target="_blank">Open</a></td></tr>
                  {v.repos.map((r: any) => (
                    <tr key={r.name}><th scope="row">{r.name}</th><td>private</td><td><a className="textlink" href={r.href} target="_blank" rel="noopener noreferrer">Open</a></td></tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="small">Method copies here are for you only; scholars use the methods through the ARS connector.</p>
          </div>
        </section>

        <section className="band alt" id="messages">
          <div className="wrap">
            <h2>Contact messages</h2>
            {msgs === null ? (
              <p className="intro">The message store is not reachable right now.</p>
            ) : msgs.length === 0 ? (
              <p className="intro">No messages yet.</p>
            ) : (
              <ol className="changes">
                {msgs.map((x: any, i: number) => (
                  <li key={i}>
                    <h3>{x.name} · {x.role || "—"}</h3>
                    <p className="small">{x.email} · {x.university || "—"} · {new Date(x.at).toLocaleString("en-GB", { timeZone: "Asia/Karachi" })}</p>
                    <p>{x.message}</p>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </section>
      </main>
    </>
  );
}
