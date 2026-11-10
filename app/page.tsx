"use client";

import { useEffect, useRef, useState } from "react";

// Real data: hassan-lit / ARS papers_per_year, "linguistic landscape" AND Pakistan, title or abstract, 9 Nov 2026.
const FIELD: [number, number][] = [
  [2016, 1], [2017, 2], [2018, 1], [2019, 2], [2020, 1], [2021, 2],
  [2022, 3], [2023, 5], [2024, 11], [2025, 9], [2026, 21],
];

const DESCENT: { n: string; title: string; text: string; tool: string; gap?: boolean }[] = [
  {
    n: "250 million",
    title: "records in the open databases",
    text: "Everything OpenAlex and Semantic Scholar have indexed, in every field. This is where every search starts.",
    tool: "Open scholarly data",
  },
  {
    n: "4,710",
    title: "keyword matches for linguistic landscape Pakistan",
    text: "Semantic Scholar, filtered to linguistics since 2016 with a PDF. Loose word matching: its most-cited results are about the UAE.",
    tool: "Workflow 1 · Semantic Scholar",
  },
  {
    n: "58",
    title: "papers that are really about the topic",
    text: "The exact phrase plus Pakistan in the title or abstract. All 15 sampled papers were on topic, so the count can be checked, not trusted blindly.",
    tool: "Workflow 3 · connector",
  },
  {
    n: "7",
    title: "closest studies, read in full",
    text: "Nearly all of them photograph and count signs. Two ask people, through 15 and 20 interviews.",
    tool: "Workflows 1–3 · NotebookLM, skills, connector",
  },
  {
    n: "1",
    title: "candidate gap",
    text: "How the people who read signs in Islamabad and Rawalpindi judge English, Urdu and Roman Urdu, measured with a questionnaire. The scholar tests it; the supervisor decides.",
    tool: "Your judgement",
    gap: true,
  },
];

const TIERS: { tool: string; sees: string; answers: string; stops: string }[] = [
  {
    tool: "Semantic Scholar",
    sees: "The whole database, by keyword",
    answers: "Finding and downloading papers",
    stops: "Cannot count a field or answer questions",
  },
  {
    tool: "NotebookLM",
    sees: "Only the PDFs you upload",
    answers: "What your papers did, and what none of them did",
    stops: "A gap in your sample is not yet a gap in the field",
  },
  {
    tool: "Gemini skill",
    sees: "Your saved method, plus Google Search",
    answers: "The same honest checklist, every time",
    stops: "Cannot query scholarly databases or verify references",
  },
  {
    tool: "Claude + connector + skills",
    sees: "Live OpenAlex, Semantic Scholar and Crossref",
    answers: "Field size, closest studies, gap, references",
    stops: "Cannot see unpublished theses or decide for you",
  },
];

const TOOLS: [string, string][] = [
  ["search_papers", "Search both databases at once, by years, type, open access or Pakistan-affiliated authors."],
  ["papers_per_year", "How many papers a topic has each year, with a sample so you can check the count."],
  ["closest_studies", "The published studies nearest to your question, for an honest rival check."],
  ["verify_reference", "Any reference checked against Crossref, field by field, with a retraction flag."],
  ["get_paper", "One paper, merged from both databases, with its citations over time."],
  ["journal_check", "A journal's profile, open access and fees, our HJRS note, and what to confirm by hand."],
  ["pakistan_requirements", "A dated summary of HEC's GenAI framework, similarity limits and HJRS."],
];

function CopyLine({ value }: { value: string }) {
  const [done, setDone] = useState(false);
  return (
    <div className="copyline">
      <code>{value}</code>
      <button
        type="button"
        onClick={() => {
          navigator.clipboard?.writeText(value).then(() => {
            setDone(true);
            setTimeout(() => setDone(false), 1600);
          });
        }}
      >
        {done ? "Copied" : "Copy"}
      </button>
    </div>
  );
}

export default function Home() {
  const fieldRef = useRef<HTMLDivElement>(null);
  const descentRef = useRef<HTMLElement>(null);
  const [step, setStep] = useState(0);
  const [hover, setHover] = useState<[number, number] | null>(null);
  const [origin, setOrigin] = useState("https://aireadyscholar.vercel.app");

  useEffect(() => setOrigin(window.location.origin), []);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const sec = descentRef.current;
    if (!sec) return;
    if (reduce) {
      sec.classList.add("still");
      return;
    }
    const planes = Array.from(sec.querySelectorAll<HTMLElement>(".plane"));
    const GAP = 1100;
    let raf = 0;
    const update = () => {
      raf = 0;
      const r = sec.getBoundingClientRect();
      const total = sec.offsetHeight - window.innerHeight;
      const p = Math.min(1, Math.max(0, -r.top / Math.max(1, total)));
      const z = p * (planes.length - 1) * GAP;
      planes.forEach((el, i) => {
        const d = i * GAP - z; // distance in front of the camera
        const o = d < -350 ? 0 : d < 0 ? 1 + d / 350 : Math.max(0, 1 - d / (GAP * 2.6));
        const off = Math.max(0, d);
        el.style.transform = `translate3d(calc(-50% + ${off * 0.32}px), calc(-50% - ${off * 0.24}px), ${-d}px)`;
        el.style.zIndex = String(100 - i);
        el.style.opacity = String(o);
        el.style.pointerEvents = Math.abs(d) < GAP / 2 ? "auto" : "none";
      });
      setStep(Math.round(p * (planes.length - 1)));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    const onMove = (e: MouseEvent) => {
      if (!fieldRef.current) return;
      const x = e.clientX / window.innerWidth - 0.5;
      const y = e.clientY / window.innerHeight - 0.5;
      fieldRef.current.style.setProperty("--rz", `${-38 + x * 8}deg`);
      fieldRef.current.style.setProperty("--rx", `${58 - y * 6}deg`);
    };
    window.addEventListener("mousemove", onMove);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      window.removeEventListener("mousemove", onMove);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  const total = FIELD.reduce((s, [, n]) => s + n, 0);

  return (
    <>
      <a className="skip" href="#main">
        Skip to content
      </a>
      <header className="nav">
        <div className="wrap navrow">
          <a className="brand" href="#top" aria-label="AI-Ready Scholar, home">
            <span className="mark" aria-hidden="true" />
            AI-Ready Scholar
          </a>
          <nav aria-label="Sections">
            <a href="#method">Method</a>
            <a href="#tools">Tools</a>
            <a href="#connect">Connect</a>
            <a href="#course">Course</a>
          </nav>
        </div>
      </header>

      <main id="main">
        <section className="hero" id="top">
          <div className="wrap herogrid">
            <div className="herotext">
              <h1>From a broad idea to a research gap you can defend.</h1>
              <p className="lede">
                Free AI tools and an open research connector for English literature and linguistics scholars in Pakistan.
                The tools search, count and check. You read, decide and write.
              </p>
              <div className="actions">
                <a className="btn primary" href="#connect">
                  Connect the research tools
                </a>
                <a className="btn" href="#method">
                  See the method
                </a>
              </div>
            </div>

            <figure className="fieldfig">
              <div className="fieldstage" aria-hidden="true">
                <div className="field" ref={fieldRef}>
                  {FIELD.map(([year, n]) => (
                    <div
                      key={year}
                      className={`col${year === 2026 ? " partial" : ""}${hover?.[0] === year ? " on" : ""}`}
                      onMouseEnter={() => setHover([year, n])}
                      onMouseLeave={() => setHover(null)}
                    >
                      {Array.from({ length: n }).map((_, k) => (
                        <span key={k} className={`sheet${k === n - 1 ? " top" : ""}`} style={{ transform: `translateZ(${(k + 1) * 8}px)` }} />
                      ))}
                      <span className="yr">{String(year).slice(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
              <figcaption>
                <strong>{hover ? `${hover[0]}: ${hover[1]} ${hover[1] === 1 ? "paper" : "papers"}` : `${total} papers`}</strong>
                <span>
                  Linguistic landscape studies about Pakistan, 2016–2026, one sheet per paper. Counted live by the connector
                  on 9 November 2026; 2026 is a partial year.
                </span>
              </figcaption>
              <table className="sr-only">
                <caption>Papers per year</caption>
                <tbody>
                  {FIELD.map(([y, n]) => (
                    <tr key={y}>
                      <th scope="row">{y}</th>
                      <td>{n}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </figure>
          </div>
        </section>

        <section className="descent" id="method" ref={descentRef} aria-label="The method, from broad to narrow">
          <div className="descentsticky">
            <div className="descenthead wrap">
              <h2>One real topic, from everything to one gap</h2>
              <ol className="rail" aria-hidden="true">
                {DESCENT.map((d, i) => (
                  <li key={i} className={i === step ? "on" : i < step ? "past" : ""}>
                    {i + 1}
                  </li>
                ))}
              </ol>
            </div>
            <div className="space">
              {DESCENT.map((d, i) => (
                <article key={i} className={`plane${d.gap ? " gap" : ""}`}>
                  <p className="num">{d.n}</p>
                  <h3>{d.title}</h3>
                  <p>{d.text}</p>
                  <p className="by">{d.tool}</p>
                </article>
              ))}
            </div>
            <p className="scrollhint wrap">Scroll to narrow the field.</p>
          </div>
        </section>

        <section className="band" id="tiers">
          <div className="wrap">
            <h2>Each tool stops somewhere. Knowing where is the skill.</h2>
            <p className="intro">
              Most scholars start with free tools, so the course does too. Each step up shows what the previous one could
              not see.
            </p>
            <div className="tablewrap">
              <table className="tiers">
                <thead>
                  <tr>
                    <th scope="col">Tool</th>
                    <th scope="col">What it can see</th>
                    <th scope="col">What it answers well</th>
                    <th scope="col">Where it stops</th>
                  </tr>
                </thead>
                <tbody>
                  {TIERS.map((t) => (
                    <tr key={t.tool}>
                      <th scope="row">{t.tool}</th>
                      <td>{t.sees}</td>
                      <td>{t.answers}</td>
                      <td>{t.stops}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="band alt" id="tools">
          <div className="wrap split">
            <div>
              <h2>The research connector</h2>
              <p className="intro">
                One open server, seven tools. Every paper comes back with a link, so nothing is taken on trust. It never
                writes thesis text.
              </p>
              <p className="small">Data from OpenAlex, Semantic Scholar and Crossref. Google Scholar is left out on purpose: it has no official API.</p>
            </div>
            <dl className="toollist">
              {TOOLS.map(([name, text]) => (
                <div key={name}>
                  <dt>
                    <code>{name}</code>
                  </dt>
                  <dd>{text}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section className="band" id="ethics">
          <div className="wrap">
            <h2>Three promises the tools keep</h2>
            <div className="promises">
              <div>
                <h3>Your ideas, your words</h3>
                <p>The tools find, count and check. Topics, gaps, questions and every sentence of the thesis stay yours.</p>
              </div>
              <div>
                <h3>Nothing invented</h3>
                <p>Every paper comes from a live search and carries its link. References are checked against Crossref.</p>
              </div>
              <div>
                <h3>Logged and disclosed</h3>
                <p>Each step leaves a log line, ready for the AI-use declaration that HEC's framework asks for.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="band alt" id="connect">
          <div className="wrap">
            <h2>Connect it to your assistant</h2>
            <div className="connect">
              <div>
                <h3>Claude</h3>
                <p>Settings, Connectors, Add custom connector. Paste:</p>
                <CopyLine value={`${origin}/api/mcp`} />
              </div>
              <div>
                <h3>ChatGPT custom GPT</h3>
                <p>Configure, Actions, Import from URL. Paste:</p>
                <CopyLine value={`${origin}/openapi.json`} />
              </div>
              <div>
                <h3>Gemini CLI, Cursor and other MCP clients</h3>
                <p>Add a remote MCP server with this address:</p>
                <CopyLine value={`${origin}/api/mcp`} />
              </div>
            </div>
          </div>
        </section>

        <section className="band course" id="course">
          <div className="wrap split">
            <div>
              <h2>The AI-Ready Scholar course</h2>
              <p className="intro">
                Starts with a seminar at CUST, Islamabad, on 12 November 2026, then continues online. Taught as technical
                training in the tools; research method stays with your supervisor.
              </p>
            </div>
            <div className="coursebox">
              <p>Ask about the next online cohort.</p>
              <a className="btn primary" href="mailto:hassan.mgartist@gmail.com?subject=AI-Ready%20Scholar%20course">
                Email the course team
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="foot">
        <div className="wrap">
          <p>
            AI-Ready Scholar. Data: OpenAlex, Semantic Scholar, Crossref. Not affiliated with HEC. Check HJRS and your
            university's rules yourself.
          </p>
        </div>
      </footer>
    </>
  );
}
