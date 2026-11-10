# Scholar Research Connector

Our own literature connector for the AI-Ready Scholar programme. It searches OpenAlex, Semantic Scholar and Crossref, adds an optional Pakistan lane (papers with Pakistan-affiliated authors) and an HEC/HJRS layer, and returns every paper with a link. One deployment serves:

- **Claude** (workflow 3): MCP endpoint at `/api/mcp`
- **Custom GPTs** (workflow 2): REST endpoints at `/rest/...`, schema at `/openapi.json`

It never writes thesis text. Results are leads for the scholar to open and read.

## Tools

| Tool | What it does | Sources |
|---|---|---|
| `search_papers` | Ranked search with filters: years, type, open access, Pakistan authors | OpenAlex + Semantic Scholar |
| `papers_per_year` | Yearly counts, plus a warning when the vocabulary is probably wrong | OpenAlex |
| `closest_studies` | Rival check for a research question, with an optional Pakistan lane | Semantic Scholar + OpenAlex |
| `verify_reference` | One reference checked field by field, plus retraction flag | Crossref + OpenAlex |
| `get_paper` | One paper by DOI, merged record, HJRS note | OpenAlex + Semantic Scholar |
| `journal_check` | Journal profile, DOAJ, APC, our HJRS category, checks to do by hand | OpenAlex + `data/hjrs-journals.json` |
| `pakistan_requirements` | Dated summary of HEC, HJRS and international AI rules | Static, from HEC documents |

Not included on purpose: Google Scholar. It has no official API, and scraping it breaks its terms of service.

## Deploy (about 20 minutes)

1. **Keys (do these first):**
   - OpenAlex: create a free account at openalex.org, copy the key from openalex.org/settings/api. Required since February 2026; the free key gives $1 of usage per day.
   - Semantic Scholar: request a key at semanticscholar.org/product/api. It arrives by email; until then the connector works at the shared, slower limit.
2. **GitHub:** create a private repo, add these files, push.
3. **Vercel:** New Project → import the repo → Framework: Next.js → add environment variables from `.env.example` (`OPENALEX_API_KEY`, `SEMANTIC_SCHOLAR_API_KEY`, `CONTACT_EMAIL`, optionally `CONNECTOR_KEY`) → Deploy.
4. **Test:** `node scripts/smoke.mjs https://aireadyscholar.vercel.app YOUR_CONNECTOR_KEY` (the key only if you set one). Every line should say OK with results above 0.
5. **Connect Claude:** claude.ai → Settings → Connectors → Add custom connector → URL `https://aireadyscholar.vercel.app/api/mcp` (add `?key=YOUR_CONNECTOR_KEY` if set). Start a new chat and ask: "Use the scholar research connector to find papers on code-switching in Pakistani TV talk shows since 2018."
6. **Custom GPT (optional, needs ChatGPT Plus to build):** Configure → Actions → Import from URL `https://aireadyscholar.vercel.app/openapi.json`, then replace `YOUR-APP` in the servers line. Free users can use the shared GPT.

## Before the seminar: pass/fail

Use our connector on stage only if all of these pass on Wednesday:

- [ ] Smoke test: all 7 lines OK
- [ ] In Claude, the topic-check and gap-finder skills each run end to end twice on the demo topic
- [ ] `closest_studies` on the demo topic returns the Bashir and Khan (2026) chyrons paper or a comparably close study
- [ ] Average response under 20 seconds
- [ ] Nothing in the results is invented: every paper opens from its link

If any fails, use the FastTrack connector on stage (credited) and present ours as "in testing".

## Limits to know

- **Budget:** one OpenAlex key = $1/day of free usage for everyone using this deployment. Fine for a seminar and a pilot class; for a full course, ask each scholar's university or buy a small OpenAlex plan.
- **Semantic Scholar:** 1 request per second with a key. A class searching at once may see slow answers; the cache helps with repeated queries.
- **HJRS:** `data/hjrs-journals.json` ships empty. Fill it only from hjrs.hec.gov.pk, set `last_checked`, and redeploy. Until then the connector says "not in our list, check the HJRS site".
- **Pakistani theses:** most unpublished MPhil/PhD theses are not in these databases. The tools remind scholars to search prr.hec.gov.pk.
- **Untested build:** this code was written without network access to the APIs. Expect to fix small issues on the first deploy; Vercel's build log names the file and line.
