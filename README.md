## Hi there 👋
 🔭 I’m currently working on building AI products for e-commerce businesses 
- 🌱 I’m currently learning how to debug issues in cursor
- 👯 I’m looking to collaborate on agentic frameworks 
- 🤔 I’m looking for help with vibecoding for applications in production and "token squeeze" 
- 💬 Ask me about my past projects that I have vibecoded 
- 📫 How to reach me: sanjeedanusrat@gmail.com
- 😄 Pronouns: She/Her
- ⚡ Fun fact: I love traveling and visited over 25 countries. 

---

## Sanjee talks — agentic content system

This repo also hosts the agents behind [@Sanjee talks](https://instagram.com)
on Instagram. See [`docs/PRD.md`](docs/PRD.md) for the full product spec.

**Status:** MVP — Research agent only.

Every Wednesday at 6:00am PST, the Research agent researches reel ideas (X,
LinkedIn, Substack, tech news, Sanjee's Gmail newsletters) and emails a
"weekly Ideas for Sanjee talks" pack of 10–12 ideas, each labeled by content
pillar and cited with a real source. Sanjee replies to that email with her
ranked top 4 — email is the control plane by design.

### Setup

1. **Cursor API key** — from [Cursor Dashboard → API Keys](https://cursor.com/dashboard/api).
   The account must have this GitHub repo connected (Settings → Integrations)
   since the agent runs as a **cloud** agent against a clone of this repo.
2. **Gmail OAuth credentials** — create an OAuth Client (type: *Desktop app*)
   in Google Cloud Console for `sanjeedanusrat@gmail.com`, then run:

   ```bash
   cp .env.example .env
   # fill in GMAIL_CLIENT_ID / GMAIL_CLIENT_SECRET, then:
   npm run gmail:setup
   ```

   This opens a browser consent flow and prints a `GMAIL_REFRESH_TOKEN` to
   paste into `.env`.
3. **GitHub Actions secrets** (Settings → Secrets and variables → Actions):
   `CURSOR_API_KEY`, `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`,
   `GMAIL_REFRESH_TOKEN`. `RESEARCH_MODEL_ID` is optional (auto-discovers the
   newest available Opus >= 4.8 model when unset).

### Running

```bash
npm install
npm run research:run     # runs the full pipeline once, using your local .env
```

In CI, [`.github/workflows/research-agent.yml`](.github/workflows/research-agent.yml)
runs this on a fixed Wed 6am PST cron, or on demand via **Run workflow** in
the Actions tab.

### Editing the agent's taste

Edit [`skills/research-quality.md`](skills/research-quality.md) any time —
no code changes needed. It's read fresh on every run and injected into the
agent's prompt.

### Repo layout

```
src/
  config/pillars.ts            content pillar definitions
  lib/                         env loading, Gmail read/send, PST week helper
  agents/research/
    model.ts                   enforces Opus >= 4.8, discovers via Cursor.models.list()
    prompt.ts                  builds the research agent's prompt
    schema.ts                  zod schema for the agent's structured output
    parse.ts                   extracts + validates JSON from the agent's reply
    email-template.ts          renders the weekly email
    run.ts                     orchestrates the whole run
skills/research-quality.md     editable taste rules, no code changes needed
state/weeks/<date>.json        one file per run, committed back by CI (audit trail)
docs/PRD.md                    full product spec
```
