import kit from "../../data/kit.json";

export const metadata = { title: "AI-Ready Scholar kit: latest versions and setup" };

const ABOUT: Record<string, { name: string; what: string }> = {
  "scholar-blueprint": { name: "Blueprint skill", what: "Plans the thesis: HEC and university rules, approach, journals, formats, decision log." },
  "scholar-topic-check": { name: "Topic check skill", what: "Tests a topic as an examiner would. Verdict: Ready, Refine or Not yet." },
  "scholar-gap-finder": { name: "Gap finder skill", what: "Evidence table, rival check, fake-gap alarms and a gap verdict." },
  "scholar-research-workspace": { name: "Research workspace skill", what: "Checks your questions without rewriting them; questionnaire blueprint; thesis skeleton." },
  "workspace-pack": { name: "Workspace pack", what: "Your folder: logs, disclosure draft, Excel reading matrix, Word thesis and article skeletons." },
  "ars-connector": { name: "ARS connector", what: "Live OpenAlex, Semantic Scholar and Crossref data, with a Pakistan lane and HEC notes." },
};

export default function Kit() {
  const k: any = kit;
  return (
    <>
      <header className="nav">
        <div className="wrap navrow">
          <a className="brand" href="/" aria-label="AI-Ready Scholar, home">
            <span className="mark" aria-hidden="true" />
            AI-Ready Scholar
          </a>
          <nav aria-label="Kit">
            <a href="#setup">Set up</a>
            <a href="#logs">Logs</a>
            <a href="#updates">Updates</a>
            <a className="navcta" href="#setup">
              Connect ARS
            </a>
          </nav>
        </div>
      </header>
      <main>
        <section className="band">
          <div className="wrap">
            <h1 className="kith1">The AI-Ready Scholar kit</h1>
            <p className="intro">
              Version {k.kit_version}, released {new Date(k.released).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}. This page always shows the latest version of everything. The four methods are served only through the ARS connector, so connecting ARS always gives you the latest one; there is nothing to download or update.
            </p>
            <div className="tablewrap">
              <table className="kittable">
                <thead>
                  <tr>
                    <th scope="col">Part</th>
                    <th scope="col">What it does</th>
                    <th scope="col">Latest version</th>
                    <th scope="col">Get it</th>
                  </tr>
                </thead>
                <tbody>
                  {k.components.map((c: any) => (
                    <tr key={c.id}>
                      <th scope="row">{ABOUT[c.id]?.name || c.id}</th>
                      <td>{ABOUT[c.id]?.what}</td>
                      <td>{c.version}</td>
                      <td>
                        {c.type === "connector" || c.type === "method" ? (
                          <code>{c.download}</code>
                        ) : (
                          <a className="textlink" href={c.download} download>
                            Download
                          </a>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="band alt" id="setup">
          <div className="wrap">
            <h2>Set up with a free account</h2>
            <div className="setupgrid">
              <div>
                <h3>Claude</h3>
                <ol>
                  <li>Settings, Connectors, Add custom connector: paste <code>https://aireadyscholar.vercel.app/api/mcp</code>. The free plan allows one custom connector. You do this once: the connector always serves the latest method.</li>
                  <li>Connect your research folder (Claude desktop) or a private GitHub repository, so the AI can keep your logs. It creates the workspace for you if it is empty.</li>
                  <li>Start: choose an ARS prompt from the connector menu (for example "ars-topic-check"), or type "Use the ARS topic-check method."</li>
                </ol>
              </div>
              <div>
                <h3>Gemini</h3>
                <ol>
                  <li>Add the ARS connector: <code>https://aireadyscholar.vercel.app/api/mcp</code>. Check whether your Gemini plan allows custom connectors.</li>
                  <li>Type <code>@</code> to attach your NotebookLM notebook, then <code>@ars-connector</code>, and ask: "Call get_method with the name scholar-topic-check and follow it. Quote the version it returns."</li>
                  <li>Check the version line: it must match the version on this page. If it does not, the method was not loaded; treat the answer as unchecked.</li>
                </ol>
              </div>
              <div>
                <h3>ChatGPT</h3>
                <ol>
                  <li>Free ChatGPT cannot add connectors. The route is one shared custom GPT with the ARS Actions (<code>https://aireadyscholar.vercel.app/openapi.json</code>), built once on a paid plan; scholars on free accounts can then open and use it.</li>
                  <li>Until that GPT is published, use Claude or Gemini with ARS.</li>
                </ol>
              </div>
            </div>
          </div>
        </section>

        <section className="band" id="logs">
          <div className="wrap">
            <h2>How your logs stay up to date</h2>
            <p className="intro">Every method writes a log row after each step. Where it goes depends on what the AI can reach.</p>
            <div className="tablewrap">
              <table className="kittable">
                <thead>
                  <tr>
                    <th scope="col">Your set-up</th>
                    <th scope="col">What happens</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <th scope="row">Claude with your workspace folder or repository connected</th>
                    <td>The skill adds rows to logs/ai-use-log.csv, the search and decision logs, saves its output to notes/ and rebuilds logs/disclosure-draft.md. In a git repository each update is a dated commit.</td>
                  </tr>
                  <tr>
                    <th scope="row">A chat that can create files</th>
                    <td>Upload your logs/ai-use-log.csv; the skill gives it back with the new row, ready to save over the old file.</td>
                  </tr>
                  <tr>
                    <th scope="row">A chat without files (any plan, any assistant)</th>
                    <td>The skill prints the row. Paste it into logs/ai-use-log.csv; it opens in Excel.</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="small">The AI never fills the "my decision" column and never changes earlier rows.</p>
          </div>
        </section>

        <section className="band alt" id="updates">
          <div className="wrap split">
            <div>
              <h2>Staying on the latest version</h2>
              <p className="intro">
                With the ARS connector connected, you always get the latest method: the connector serves it, and installed skills load it first. Without the connector, each skill shows its version at the top; download the new one here when the version changes. Your workspace files are never replaced.
              </p>
            </div>
            <ol className="changes">
              {k.changes.map((c: any) => (
                <li key={c.version}>
                  <h3>
                    {c.version} · {c.date}
                  </h3>
                  <p>{c.summary}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>
      </main>
      <footer className="foot">
        <div className="wrap footbase">
          <p>© 2026 AI-Ready Scholar · <a href="/">Home</a> · <a href="/rest/kit">Version data (JSON)</a> · <a href="/rest/health">Connector status</a></p>
        </div>
      </footer>
    </>
  );
}
