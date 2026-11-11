import kit from "../../data/kit.json";

export const metadata = { title: "Connect ARS · AI-Ready Scholar" };

const STEPS = [
  ["Connect ARS, once", "In Claude: Settings, Connectors, Add custom connector. Paste the address below. The free plan allows one custom connector, and that is enough."],
  ["Give it a folder", "In the Claude desktop app, connect your research folder, or a private GitHub repository. No folder? Every method prints the log row for you to paste."],
  ["Set up the project", "Type: “Use the ARS research-workspace method to set up my project.” It creates logs/, notes/ and your thesis skeleton."],
  ["Check the version", "The first answer should say “Using ARS method …, version …”, matching this site. If it does not, add: “Call ARS get_method first.”"],
];

const METHODS = [
  ["Blueprint", "At the start of your degree", "Use the ARS blueprint method."],
  ["Topic check", "Before your supervisor sees a topic", "Use the ARS topic-check method. My topic: …"],
  ["Gap finder", "When the topic is ready, before chapter 2", "Use the ARS gap-finder method. My gap: …"],
  ["Research workspace", "On day one, then for your questions", "Use the ARS research-workspace method to set up my project."],
];

export default function Connect() {
  const k: any = kit;
  return (
    <>
      <header className="nav">
        <div className="wrap navrow">
          <a className="brand" href="/" aria-label="AI-Ready Scholar, home">
            <span className="mark" aria-hidden="true" />
            AI-Ready Scholar
          </a>
          <nav aria-label="Main">
            <a href="/#course">Course</a>
            <a href="/#toolkit">Toolkit</a>
            <a href="/kit">Kit</a>
            <a className="navcta" href="/connect">Connect ARS</a>
          </nav>
        </div>
      </header>
      <main>
        <section className="band">
          <div className="wrap">
            <h1 className="kith1">Connect ARS in four steps</h1>
            <p className="intro">ARS, the AI-Ready Scholar connector, gives Claude live records from OpenAlex, Semantic Scholar and Crossref, and the four research methods, always at the latest version ({k.kit_version}). Nothing to download or update.</p>
            <p className="intro"><b>Connector address:</b> <code>https://aireadyscholar.vercel.app/api/mcp</code></p>
            <div className="setupgrid" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
              {STEPS.map(([h, p], i) => (
                <div key={h}>
                  <h3>{i + 1} · {h}</h3>
                  <p style={{ marginTop: 10, color: "#2f434d" }}>{p}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="band alt">
          <div className="wrap">
            <h2>What to type, and when</h2>
            <p className="intro">Call a method in plain words. In Claude you can also open the + menu, choose ARS, and pick ars-blueprint, ars-topic-check, ars-gap-finder or ars-research-workspace.</p>
            <div className="tablewrap">
              <table className="kittable">
                <thead><tr><th scope="col">Method</th><th scope="col">When</th><th scope="col">Type this</th></tr></thead>
                <tbody>
                  {METHODS.map(([n, w, t]) => (
                    <tr key={n}><th scope="row">{n}</th><td>{w}</td><td><i>“{t}”</i></td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="band">
          <div className="wrap">
            <h2>Free accounts, used well</h2>
            <div className="setupgrid">
              <div>
                <h3>Claude (free)</h3>
                <ol>
                  <li>One custom connector: use it for ARS.</li>
                  <li>One stage per chat. Each method ends with a short carry-forward block: paste it first in the next chat.</li>
                  <li>Paste findings, not whole PDFs.</li>
                </ol>
              </div>
              <div>
                <h3>Gemini</h3>
                <ol>
                  <li>The Gemini app adds custom connectors such as ARS only with the Ultra plan (Gemini Spark).</li>
                  <li>On any plan, use Gemini Notebook (NotebookLM) for the heavy reading: up to 50 sources per notebook, free.</li>
                </ol>
              </div>
              <div>
                <h3>ChatGPT</h3>
                <ol>
                  <li>Free ChatGPT cannot add connectors.</li>
                  <li>A shared custom GPT with the ARS Actions (<code>https://aireadyscholar.vercel.app/openapi.json</code>) can be built once on a paid plan and used by free accounts.</li>
                </ol>
              </div>
            </div>
            <p className="small" style={{ marginTop: 24 }}>Plans change often: check yours. Every paper ARS returns is a lead to open and read; the decisions and every word of the thesis are yours.</p>
          </div>
        </section>
      </main>
    </>
  );
}
