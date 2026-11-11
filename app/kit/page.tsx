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
            <a className="navcta" href="/downloads/scholar-skills.zip">
              Download all skills
            </a>
          </nav>
        </div>
      </header>
      <main>
        <section className="band">
          <div className="wrap">
            <h1 className="kith1">The AI-Ready Scholar kit</h1>
            <p className="intro">
              Version {k.kit_version}, released {new Date(k.released).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}. This page always shows the latest version of everything. Every skill tells you when yours is older.
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
                        {c.type === "connector" ? (
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
                  <li>Settings, Capabilities, Skills: upload each skill zip.</li>
                  <li>Settings, Connectors, Add custom connector: paste <code>https://aireadyscholar.vercel.app/api/mcp</code>. The free plan allows one custom connector.</li>
                  <li>Download the workspace pack and unzip it into a folder on your computer, or into a private GitHub repository.</li>
                  <li>Start a new chat and say: "Use the scholar-topic-check skill."</li>
                </ol>
              </div>
              <div>
                <h3>Gemini</h3>
                <ol>
                  <li>Create a skill for each SKILL.md: paste its text as the instructions.</li>
                  <li>Attach your NotebookLM notebook with your papers.</li>
                  <li>Custom connectors (the ARS connector) need a Google AI Pro or Ultra plan. Without one, the skill still works but cannot search the databases.</li>
                </ol>
              </div>
              <div>
                <h3>ChatGPT</h3>
                <ol>
                  <li>Paste a SKILL.md into a project's instructions.</li>
                  <li>To use the connector, a custom GPT with Actions imports <code>https://aireadyscholar.vercel.app/openapi.json</code>. Building a GPT needs a paid plan; anyone can use a shared one.</li>
                </ol>
              </div>
            </div>
          </div>
        </section>

        <section className="band" id="logs">
          <div className="wrap">
            <h2>How your logs stay up to date</h2>
            <p className="intro">Every skill writes a log row after each step. Where it goes depends on what the AI can reach.</p>
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
                Each skill shows its version at the top. When the ARS connector is connected, the skill checks this kit once per chat and tells you if a newer version exists. To update: download the new zip here, remove the old skill, upload the new one. Your workspace files are never replaced.
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
