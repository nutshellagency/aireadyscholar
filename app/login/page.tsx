import { passwordSet } from "../../lib/auth";

export const metadata = { title: "Owner login · AI-Ready Scholar", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function Login({ searchParams }: { searchParams: Promise<{ e?: string }> }) {
  const { e } = await searchParams;
  const ready = passwordSet();
  return (
    <main className="band">
      <div className="wrap" style={{ maxWidth: 520 }}>
        <a className="brand" href="/" aria-label="AI-Ready Scholar, home">
          <span className="mark" aria-hidden="true" />
          AI-Ready Scholar
        </a>
        <h1 className="kith1" style={{ marginTop: 32 }}>Owner login</h1>
        <p className="intro">For the trainer only: the latest deck, rehearsal, stage prompts and downloads.</p>
        {!ready && <p className="formerror" style={{ marginTop: 20 }}>Login is not set up yet: add SITE_PASSWORD in Vercel (Settings, Environment Variables), then redeploy.</p>}
        {e === "1" && <p className="formerror" style={{ marginTop: 20 }}>That username or password is not right.</p>}
        {e === "wait" && <p className="formerror" style={{ marginTop: 20 }}>Too many tries. Please wait 15 minutes.</p>}
        <form className="contactform" method="post" action="/api/login" style={{ marginTop: 24 }}>
          <label>
            Username
            <input name="username" autoComplete="username" required />
          </label>
          <label>
            Password
            <input name="password" type="password" autoComplete="current-password" required />
          </label>
          <button className="btn primary" type="submit" disabled={!ready}>Log in</button>
        </form>
      </div>
    </main>
  );
}
