"use client";

import { useEffect, useRef, useState } from "react";

const TOOLS: [string, string][] = [
  ["search_papers", "Search OpenAlex and Semantic Scholar together, with filters for years, type, open access and Pakistan-affiliated authors."],
  ["papers_per_year", "See whether an area is crowded or thin, with a warning when your words differ from the field's."],
  ["closest_studies", "Find the published studies closest to your question, for an honest rival check."],
  ["verify_reference", "Check any reference against Crossref, field by field, with a retraction flag."],
  ["get_paper", "One paper, merged from both databases, with its citation trajectory."],
  ["journal_check", "Journal profile, open access, DOAJ, fees, and our HJRS note, plus what to check by hand."],
  ["pakistan_requirements", "A dated summary of HEC's GenAI rules, similarity limits, HJRS and international AI policies."],
];

export default function Home() {
  const stage = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const onMove = (e: MouseEvent) => {
      if (!stage.current) return;
      const x = e.clientX / window.innerWidth - 0.5;
      const y = e.clientY / window.innerHeight - 0.5;
      stage.current.style.transform = `rotateY(${x * 14}deg) rotateX(${-y * 10}deg)`;
    };
    const layers = Array.from(document.querySelectorAll<HTMLElement>("[data-depth]"));
    const onScroll = () => {
      const s = window.scrollY;
      for (const el of layers) {
        const d = Number(el.dataset.depth || 0);
        el.style.transform = `translate3d(0, ${s * d}px, 0)`;
      }
    };
    const cards = Array.from(document.querySelectorAll<HTMLElement>(".card"));
    const tilt = (e: MouseEvent) => {
      const el = e.currentTarget as HTMLElement;
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      el.style.transform = `rotateY(${x * 8}deg) rotateX(${-y * 8}deg) translateZ(6px)`;
    };
    const reset = (e: MouseEvent) => ((e.currentTarget as HTMLElement).style.transform = "");
    window.addEventListener("mousemove", onMove);
    window.addEventListener("scroll", onScroll, { passive: true });
    cards.forEach((c) => {
      c.addEventListener("mousemove", tilt);
      c.addEventListener("mouseleave", reset);
    });
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("scroll", onScroll);
      cards.forEach((c) => {
        c.removeEventListener("mousemove", tilt);
        c.removeEventListener("mouseleave", reset);
      });
    };
  }, []);

  const [origin, setOrigin] = useState("https://aireadyscholar.vercel.app");
  useEffect(() => setOrigin(window.location.origin), []);

  return (
    <>
      <header className="nav">
        <div className="wrap">
          <a className="brand" href="#top">
            AI-Ready <span>Scholar</span>
          </a>
          <nav aria-label="Sections">
            <a href="#workflows">Workflows</a>
            <a href="#connector">Connector</a>
            <a href="#ethics">Ethics</a>
            <a href="#connect">Connect</a>
            <a href="#course">Course</a>
          </nav>
        </div>
      </header>

      <main id="top">
        <section className="hero">
          <div className="glow layer" data-depth="0.25" />
          <div className="wrap">
            <div className="layer" data-depth="-0.08">
              <p className="eyebrow">For English literature &amp; linguistics scholars</p>
              <h1>
                From a broad idea to a <em>defensible</em> research gap.
              </h1>
              <p className="lede">
                Ethical AI assistance that searches real databases, checks every reference and logs every step. It saves you
                weeks. It never writes your research.
              </p>
              <div className="cta">
                <a className="btn primary" href="#connect">
                  Connect the research tools
                </a>
                <a className="btn" href="#course">
                  Join the course
                </a>
              </div>
            </div>
            <div className="stage" ref={stage} aria-hidden="true">
              <div className="sheet s1">
                <h4>Search log</h4>
                <div className="rule" />
                <div className="rule short" />
                <div className="rule" />
                <span className="tag">OpenAlex</span>
                <span className="tag">Semantic Scholar</span>
              </div>
              <div className="sheet s2">
                <h4>Evidence table</h4>
                <div className="rule" />
                <div className="rule" />
                <div className="rule short" />
                <div className="rule" />
                <span className="tag">p. 14</span>
                <span className="tag">p. 203</span>
              </div>
              <div className="sheet s3">
                <h4>Gap statement</h4>
                <div className="rule" />
                <div className="rule short" />
                <div className="rule" />
                <span className="tag">specific</span>
                <span className="tag">evidenced</span>
                <span className="tag">logged</span>
                <span className="stamp">YOUR WORDS</span>
              </div>
            </div>
          </div>
        </section>

        <section className="block" id="workflows">
          <div className="wrap">
            <p className="eyebrow">Three ways to work</p>
            <h2>Three workflows, one rule: you stay the author.</h2>
            <p className="intro">Start free and by hand, then automate. Every workflow keeps the decisions, the writing and the disclosure with you.</p>
            <div className="cards">
              <div className="card">
                <p className="num">WORKFLOW 1</p>
                <h3>Free tools</h3>
                <p>Semantic Scholar to find and filter papers, NotebookLM, Gemini or ChatGPT to read your PDFs with you, citing the page.</p>
              </div>
              <div className="card">
                <p className="num">WORKFLOW 2</p>
                <h3>Custom assistants</h3>
                <p>Gemini Gems and Custom GPTs that keep your method and prompts. GPTs can call this connector through Actions.</p>
              </div>
              <div className="card feature">
                <p className="num">WORKFLOW 3</p>
                <h3>Agentic</h3>
                <p>Claude with this connector and our research skills: it searches live databases, follows the method and logs every step.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="block" id="connector">
          <div className="wrap">
            <p className="eyebrow">The research connector</p>
            <h2>Seven tools. Every paper with a link.</h2>
            <p className="intro">
              Built on open scholarly data: OpenAlex, Semantic Scholar and Crossref. With an optional Pakistan lane and an HEC/HJRS layer.
              Results are leads to open and read, never conclusions.
            </p>
            <div className="tools">
              {TOOLS.map(([name, text]) => (
                <div className="tool" key={name}>
                  <code>{name}</code>
                  <p>{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="block" id="ethics">
          <div className="wrap">
            <p className="eyebrow">Ethics first</p>
            <h2>Inside HEC&apos;s guidelines, by design.</h2>
            <div className="ethics">
              <div className="ethic">
                <h3>Your ideas, your words</h3>
                <p>AI questions, searches and checks. You choose the topic, the gap and every sentence of the thesis.</p>
              </div>
              <div className="ethic">
                <h3>Nothing invented</h3>
                <p>No AI data, quotations or references. Every reference is checked against its real record.</p>
              </div>
              <div className="ethic">
                <h3>Logged and disclosed</h3>
                <p>A dated AI-use log from day one, and a disclosure statement before the references, as HEC&apos;s framework asks.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="block" id="connect">
          <div className="wrap">
            <p className="eyebrow">Connect</p>
            <h2>Use it with the AI you already have.</h2>
            <div className="connect">
              <div className="card">
                <h3>Claude</h3>
                <p>Settings → Connectors → Add custom connector. Works on the free plan.</p>
                <code>{origin}/api/mcp</code>
              </div>
              <div className="card">
                <h3>ChatGPT GPTs</h3>
                <p>In the GPT builder: Actions → Import from URL.</p>
                <code>{origin}/openapi.json</code>
              </div>
              <div className="card">
                <h3>Any MCP client</h3>
                <p>Codex, Cursor, VS Code and other MCP clients: add a remote server.</p>
                <code>{origin}/api/mcp</code>
              </div>
            </div>
          </div>
        </section>

        <section className="block" id="course">
          <div className="wrap">
            <p className="eyebrow">The AI-Ready Scholar course</p>
            <h2>Eight weeks. Your thesis, with AI at every step.</h2>
            <div className="band">
              <div>
                <h3>Topic, gap, reading, analysis, writing, publishing.</h3>
                <p>Live online, weekend classes, recordings included, free tools first. By Skill Metrica, with Faizul Hassan.</p>
              </div>
              <div>
                <a className="btn primary" href="mailto:hassan.mgartist@gmail.com?subject=AI-Ready%20Scholar%20course">
                  Ask about the next cohort
                </a>
                <p style={{ marginTop: 12, fontSize: 14 }}>hassan.mgartist@gmail.com</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer>
        <div className="wrap">
          <p>AI-Ready Scholar · Research Connector. Data: OpenAlex (CC0), Semantic Scholar, Crossref.</p>
          <p>Not affiliated with HEC. Not legal advice. Check your university&apos;s AI policy.</p>
        </div>
      </footer>
    </>
  );
}
