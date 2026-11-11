"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

// Photos: Unsplash (free licence). Toned with one green duotone in CSS so every image shares the palette.
const U = (id: string, w = 1600) => `https://images.unsplash.com/photo-${id}?w=${w}&q=75&auto=format&fit=crop`;
const IMG = {
  library: U("1717525666803-a9886669cbdb", 2000),
  street: U("1660807694412-c076e52479a9"),
  lecture: U("1758270704080-e3556e6794a7"),
  reader: U("1532294220147-279399e4e00f"),
  desk: U("1640622842223-e1e39f4bf627"),
};

// Real data: ARS papers_per_year, "linguistic landscape" AND Pakistan, title or abstract, 9 Nov 2026.
const FIELD: [number, number][] = [
  [2016, 1], [2017, 2], [2018, 1], [2019, 2], [2020, 1], [2021, 2],
  [2022, 3], [2023, 5], [2024, 11], [2025, 9], [2026, 21],
];

const MODULES: { title: string; outcome: string; tools: string[] }[] = [
  { title: "How AI works, where it fails, the rules", outcome: "Know what HEC's GenAI framework, your university and journals allow; set up your blueprint, decision log and AI-use log.", tools: ["scholar-blueprint", "HEC GenAI framework", "Workspace pack"] },
  { title: "AI as your critical friend", outcome: "Write prompts that ask for questions and objections, not answers, and keep the decision yours.", tools: ["Prompt structure", "Gemini skills", "Custom GPTs"] },
  { title: "Choosing a topic and finding the gap", outcome: "Count the field, run the rival check and the fake-gap alarms, and build an evidence table you can defend.", tools: ["ARS connector", "scholar-topic-check", "scholar-gap-finder"] },
  { title: "Reading and reviewing with AI agents", outcome: "Search with exact phrases, read your PDFs in NotebookLM, and build a reading matrix with a citation in every cell.", tools: ["Semantic Scholar", "NotebookLM", "Reading matrix"] },
  { title: "Discourse and corpus analysis", outcome: "Use corpus tools and AI checks for discourse and textual work, with every finding traced to your own data.", tools: ["AntConc", "LancsBox", "QualCoder"] },
  { title: "Collecting and analysing data", outcome: "Plan instruments from published scales, pilot, get ethics approval, and analyse in jamovi or SPSS. AI never touches the data.", tools: ["scholar-research-workspace", "jamovi", "SPSS"] },
  { title: "Writing with AI, not by AI", outcome: "Fill the thesis or article skeleton in your own words, choose a journal on evidence, and write your AI declaration from your log.", tools: ["Thesis skeleton", "Article skeleton", "AI declaration"] },
  { title: "Your research agent and capstone", outcome: "Run the whole system on your own topic in Claude, Gemini or ChatGPT, with logs updating as you go, and present it.", tools: ["Claude", "Gemini", "ChatGPT", "ARS connector"] },
];

const DESCENT: { n: string; title: string; text: string; tool: string; gap?: boolean }[] = [
  { n: "250 million", title: "records in the open databases", text: "Everything OpenAlex and Semantic Scholar have indexed, in every field.", tool: "Where every search starts" },
  { n: "4,710", title: "keyword matches on Semantic Scholar", text: "Filtered to linguistics since 2016. Loose matching: the most-cited results are about the UAE.", tool: "Module 4 · Semantic Scholar" },
  { n: "58", title: "papers really about the topic", text: "The exact phrase plus Pakistan in the title or abstract. 13 of 15 sampled were fully on topic, so the count can be checked.", tool: "Module 3 · ARS connector" },
  { n: "7", title: "closest studies, read in full", text: "Nearly all of them photograph and count signs. Only a handful ask people, through 8 to 20 interviews.", tool: "Modules 3 and 4 · gap finder, NotebookLM" },
  { n: "1", title: "candidate gap", text: "How the people who read signs in Islamabad and Rawalpindi judge English, Urdu and Roman Urdu. The scholar tests it; the supervisor decides.", tool: "Your judgement", gap: true },
];

const TOOLKIT: { name: string; text: string; href?: string; label?: string }[] = [
  { name: "ARS research connector", text: "Live OpenAlex, Semantic Scholar and Crossref data in Claude, Gemini, ChatGPT and other MCP tools. Every paper with a link; every reference checkable." },
  { name: "Four scholar skills", text: "Blueprint, topic check, gap finder and research workspace: the same examiner-style method every time, and they never write your thesis.", href: "/downloads/scholar-skills.zip", label: "Download the skills" },
  { name: "Workspace pack", text: "Excel logs for AI use, searches, reading, gap evidence and decisions, plus Word skeletons for a thesis, a journal article and your AI declaration.", href: "/downloads/AI-Ready-Scholar-Workspace.zip", label: "Download the pack" },
];

function CopyLine({ value }: { value: string }) {
  const [done, setDone] = useState(false);
  return (
    <div className="copyline">
      <code>{value}</code>
      <button
        type="button"
        onClick={() =>
          navigator.clipboard?.writeText(value).then(() => {
            setDone(true);
            setTimeout(() => setDone(false), 1600);
          })
        }
      >
        {done ? "Copied" : "Copy"}
      </button>
    </div>
  );
}

function Photo({ src, alt, className = "" }: { src: string; alt: string; className?: string }) {
  return (
    <div className={`photo ${className}`}>
      <img src={src} alt={alt} loading="lazy" />
    </div>
  );
}

function ContactForm() {
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget).entries());
    setState("sending");
    setError("");
    try {
      const r = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || "The message could not be sent.");
      setState("sent");
      (e.target as HTMLFormElement).reset();
    } catch (err: any) {
      setState("error");
      setError(err.message);
    }
  }
  if (state === "sent") {
    return (
      <div className="formdone" role="status">
        <h3>Message sent</h3>
        <p>Thank you. The course team will reply to your email, usually within two working days.</p>
        <button type="button" className="btn" onClick={() => setState("idle")}>
          Send another message
        </button>
      </div>
    );
  }
  return (
    <form className="contactform" onSubmit={submit} noValidate={false}>
      <div className="row2">
        <label>
          Name
          <input name="name" required maxLength={100} autoComplete="name" />
        </label>
        <label>
          Email
          <input name="email" type="email" required maxLength={150} autoComplete="email" />
        </label>
      </div>
      <div className="row2">
        <label>
          University or department
          <input name="university" maxLength={150} autoComplete="organization" />
        </label>
        <label>
          I am a
          <select name="role" defaultValue="MPhil or MS scholar">
            <option>MPhil or MS scholar</option>
            <option>PhD scholar</option>
            <option>Supervisor or faculty</option>
            <option>Department or university</option>
            <option>Other</option>
          </select>
        </label>
      </div>
      <label>
        Message
        <textarea name="message" required rows={5} maxLength={3000} placeholder="Ask about the next cohort, a seminar at your department, or the toolkit." />
      </label>
      <label className="hp" aria-hidden="true">
        Website
        <input name="website" tabIndex={-1} autoComplete="off" />
      </label>
      <p className="consent">We use your details only to reply to this message.</p>
      {state === "error" && (
        <p className="formerror" role="alert">
          {error} You can also email hassan.mgartist@gmail.com.
        </p>
      )}
      <button className="btn primary" type="submit" disabled={state === "sending"}>
        {state === "sending" ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}

export default function Home() {
  const fieldRef = useRef<HTMLDivElement>(null);
  const descentRef = useRef<HTMLElement>(null);
  const [step, setStep] = useState(0);
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
        const d = i * GAP - z;
        const o = d < -350 ? 0 : d < 0 ? 1 + d / 350 : Math.max(0, 1 - d / (GAP * 2.6));
        const off = Math.max(0, d);
        el.style.transform = `translate3d(calc(-50% + ${off * 0.32}px), calc(-50% - ${off * 0.24}px), ${-d}px)`;
        el.style.opacity = String(o);
        el.style.zIndex = String(100 - i);
      });
      setStep(Math.round(p * (planes.length - 1)));
      // gentle parallax on photos
      document.querySelectorAll<HTMLElement>(".photo.parallax img").forEach((img) => {
        const b = img.parentElement!.getBoundingClientRect();
        const c = (b.top + b.height / 2 - window.innerHeight / 2) / window.innerHeight;
        img.style.transform = `translate3d(0, ${c * -40}px, 0) scale(1.12)`;
      });
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
            <a href="#course">Course</a>
            <a href="#modules">Modules</a>
            <a href="#toolkit">Toolkit</a>
            <a href="#method">Case study</a>
            <a href="/kit">Kit</a>
            <a className="navcta" href="#contact">
              Join the next cohort
            </a>
          </nav>
        </div>
      </header>

      <main id="main">
        {/* HERO */}
        <section className="hero" id="top">
          <Photo src={IMG.library} alt="A large library hall with tall green shelves" className="herobg" />
          <div className="wrap herogrid">
            <div className="herotext">
              <h1>
                Become an <span className="nowrap">AI-Ready Scholar.</span>
              </h1>
              <p className="lede">
                An eight-week course in agentic AI for English literature and linguistics researchers in Pakistan. Search
                the whole field, test your topic, evidence your gap, and keep every step honest.
              </p>
              <div className="actions">
                <a className="btn primary" href="#contact">
                  Join the next cohort
                </a>
                <a className="btn light" href="#modules">
                  See the eight modules
                </a>
              </div>
            </div>
            <figure className="herocard">
              <div className="fieldstage" aria-hidden="true">
                <div className="field" ref={fieldRef}>
                  {FIELD.map(([year, n]) => (
                    <div key={year} className={`col${year === 2026 ? " partial" : ""}`}>
                      {Array.from({ length: n }).map((_, k) => (
                        <span key={k} className={`sheet${k === n - 1 ? " top" : ""}`} style={{ transform: `translateZ(${(k + 1) * 7}px)` }} />
                      ))}
                    </div>
                  ))}
                </div>
              </div>
              <figcaption>
                <strong>58 studies, counted live</strong>
                <span>Linguistic landscape research about Pakistan, 2016–2026, one sheet per paper. From the course case study.</span>
              </figcaption>
            </figure>
          </div>
        </section>

        <section className="strip" aria-label="Who it is for">
          <div className="wrap stripgrid">
            <p>
              <strong>For MPhil, MS and PhD scholars</strong> in English literature, linguistics and ELT
            </p>
            <p>
              <strong>For supervisors</strong> who want AI use they can check
            </p>
            <p>
              <strong>Built around</strong> HEC's GenAI framework and HJRS
            </p>
          </div>
        </section>

        {/* COURSE */}
        <section className="band" id="course">
          <div className="wrap split">
            <div>
              <h2>What being AI-ready means</h2>
              <p className="intro">
                Not using AI to write. Using it to search more of the field than you could alone, to check every
                reference, and to hear an examiner's questions before the examiner asks them. Then reading, deciding and
                writing yourself, with a log that proves it.
              </p>
              <ol className="tiers">
                <li>
                  <h3>Free tools</h3>
                  <p>Semantic Scholar and NotebookLM: find and read your sources.</p>
                </li>
                <li>
                  <h3>Saved methods</h3>
                  <p>Gemini skills and custom GPTs: the same honest checks, every time.</p>
                </li>
                <li>
                  <h3>Agentic research</h3>
                  <p>Claude with the ARS connector and our skills: test your idea against the whole field.</p>
                </li>
              </ol>
            </div>
            <figure className="videobox">
              <video src="/media/trailer.mp4" poster="/media/poster.jpg" autoPlay muted loop playsInline aria-label="Ten-second animation: 58 studies rise by year, then the field narrows from 250 million records to one candidate gap" />
              <figcaption>From 250 million records to one gap you can defend: the course in ten seconds.</figcaption>
            </figure>
          </div>
        </section>

        {/* MODULES */}
        <section className="band alt" id="modules">
          <div className="wrap">
            <h2>Eight modules, one thesis-ready workflow</h2>
            <p className="intro">Each week ends with something you keep: a log, a table, a verdict or a plan. Taught as technical training in the tools; research method stays with your supervisor.</p>
            <ol className="modules">
              {MODULES.map((m, i) => (
                <li key={m.title}>
                  <span className="wk">Week {i + 1}</span>
                  <div>
                    <h3>{m.title}</h3>
                    <p>{m.outcome}</p>
                    <ul className="chips" aria-label="Tools">
                      {m.tools.map((t) => (
                        <li key={t}>{t}</li>
                      ))}
                    </ul>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* TOOLKIT */}
        <section className="band" id="toolkit">
          <div className="wrap split rev">
            <Photo src={IMG.desk} alt="Hands taking notes beside a laptop" className="tall parallax" />
            <div>
              <h2>The toolkit you keep after the course</h2>
              <p className="intro">Latest versions, downloads and free-account setup are always on <a className="textlink" href="/kit">the kit page</a>.</p>
              <div className="toolkit">
                {TOOLKIT.map((t) => (
                  <div key={t.name}>
                    <h3>{t.name}</h3>
                    <p>{t.text}</p>
                    {t.href && (
                      <a className="textlink" href={t.href} download>
                        {t.label}
                      </a>
                    )}
                  </div>
                ))}
              </div>
              <h3 className="connecth">Connect the ARS connector</h3>
              <div className="connect">
                <div>
                  <p>Claude, Gemini and other MCP tools</p>
                  <CopyLine value={`${origin}/api/mcp`} />
                </div>
                <div>
                  <p>ChatGPT custom GPT (Actions, import from URL)</p>
                  <CopyLine value={`${origin}/openapi.json`} />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CASE STUDY: the descent */}
        <section className="caseintro">
          <Photo src={IMG.street} alt="A busy city street in South Asia lined with shop signboards" className="casebg parallax" />
          <div className="wrap caseinner">
            <h2>Case study: the languages on Pakistan's signboards</h2>
            <p>One real topic from our first seminar, followed from a broad idea to a single gap. Scroll through it.</p>
          </div>
        </section>
        <section className="descent" id="method" ref={descentRef} aria-label="The case study, from broad to narrow">
          <div className="descentsticky">
            <div className="descenthead wrap">
              <p className="small light">From everything to one gap</p>
              <ol className="rail" aria-hidden="true">
                {DESCENT.map((_, i) => (
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

        {/* ETHICS */}
        <section className="band" id="ethics">
          <div className="wrap split">
            <div>
              <h2>Three promises the tools keep</h2>
              <div className="promises">
                <div>
                  <h3>Your ideas, your words</h3>
                  <p>The tools find, count and check. Topics, gaps, questions and every sentence of the thesis stay yours.</p>
                </div>
                <div>
                  <h3>Nothing invented</h3>
                  <p>Every paper comes from a live search with its link. References are checked against Crossref.</p>
                </div>
                <div>
                  <h3>Logged and disclosed</h3>
                  <p>Each step leaves a log line, ready for the AI declaration that HEC's framework asks for.</p>
                </div>
              </div>
            </div>
            <Photo src={IMG.reader} alt="A scholar reading a book between library shelves" className="tall parallax" />
          </div>
        </section>

        {/* SEMINAR */}
        <section className="seminar">
          <Photo src={IMG.lecture} alt="A teacher speaking to students in a lecture room" className="seminarbg" />
          <div className="wrap seminarinner">
            <div className="seminarcard">
              <p className="small">First seminar</p>
              <h2>CUST, Islamabad · 12 November 2026</h2>
              <p>
                Department of English, Capital University of Science and Technology. A live demonstration of all three
                tiers on one real linguistics topic. The online cohort follows; dates are announced after the seminar.
              </p>
              <a className="btn primary" href="#contact">
                Invite us to your department
              </a>
            </div>
          </div>
        </section>

        {/* CONTACT */}
        <section className="band alt" id="contact">
          <div className="wrap split">
            <div>
              <h2>Join the next cohort, or ask us anything</h2>
              <p className="intro">
                Tell us who you are and what you need: a place in the online course, a seminar for your department, or
                help connecting the toolkit.
              </p>
              <p className="small">Prefer email? hassan.mgartist@gmail.com</p>
            </div>
            <ContactForm />
          </div>
        </section>
      </main>

      <footer className="foot">
        <div className="wrap footgrid">
          <div className="footbrand">
            <a className="brand light" href="#top">
              <span className="mark" aria-hidden="true" />
              AI-Ready Scholar
            </a>
            <p>Search the whole field. Evidence your gap. Write it yourself.</p>
          </div>
          <nav aria-label="Course">
            <h3>Course</h3>
            <a href="#course">What it means</a>
            <a href="#modules">Modules</a>
            <a href="#method">Case study</a>
            <a href="#ethics">Ethics</a>
          </nav>
          <nav aria-label="Toolkit">
            <h3>Toolkit</h3>
            <a href="/kit">Latest versions and setup</a>
            <a href="#toolkit">ARS connector</a>
            <a href="/downloads/scholar-skills.zip" download>
              Scholar skills
            </a>
            <a href="/downloads/AI-Ready-Scholar-Workspace.zip" download>
              Workspace pack
            </a>
            <a href="/rest/health">Connector status</a>
          </nav>
          <nav aria-label="Contact">
            <h3>Contact</h3>
            <a href="#contact">Send a message</a>
            <a href="mailto:hassan.mgartist@gmail.com">Email</a>
          </nav>
        </div>
        <div className="wrap footbase">
          <p>© 2026 AI-Ready Scholar. Data from OpenAlex, Semantic Scholar and Crossref. Photos from Unsplash.</p>
          <p>Not affiliated with HEC. Check HJRS and your university's rules yourself.</p>
        </div>
      </footer>
    </>
  );
}
