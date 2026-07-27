# Sanjee talks agentic system — PRD

## Vision

A set of agents that run Sanjee's content pipeline for the "Sanjee talks"
Instagram account like an internal team:

1. **Research agent** (this MVP) — curates weekly reel ideas.
2. **Copy + social specialist agent** (future) — turns selected ideas into
   scripts and social copy.
3. **Creative execution agent** (future) — turns an approved script into a
   shooting/creative guideline.
4. **Post-shoot agent** (future) — organizes raw footage into Google Drive.

Everything lives in this git repo: agent code, prompts, skills (taste rules),
and per-run state. No third-party workflow tools (e.g. Zapier/n8n) — the repo
owns the logic, a scheduler triggers it, and the Cursor SDK runs the model
work.

## Architecture

```
GitHub Actions cron (Wed 6am PST, fixed UTC-8)
  -> src/agents/research/run.ts
       -> reads skills/research-quality.md (taste rules, editable without code changes)
       -> reads recent Gmail newsletters (googleapis)
       -> calls Cursor SDK Agent.prompt() as a CLOUD agent, Claude Opus >= 4.8
       -> validates structured output (zod)
       -> writes state/weeks/<date>.json (source of truth, versioned in git)
       -> sends the weekly email via Gmail API
  -> workflow commits state/weeks/<date>.json back to the repo
```

## MVP scope: Research agent only

**Definition of done for v1:** every Wednesday at 6am PST, Sanjee receives an
email titled "weekly Ideas for Sanjee talks" with 10–12 reel ideas covering
all content pillars, each with a cited source. Sanjee replies with her ranked
top 4. Nothing downstream (copy agent, shoot guide, Drive) is built yet.

### Content pillars

1. AI tools / demos
2. Industry news / takes
3. Career / builder lessons
4. Explainers for non-experts
5. Entertainment (must be tech- or AI-threaded — pure entertainment does not
   qualify)

Ideas cover all 5 pillars per week; no fixed quota per pillar. Every idea is
labeled with its pillar in the email body.

### Idea requirements

- 10–12 ideas per week.
- Every idea cites a real source (URL, or a Gmail newsletter citation) — no
  invented sources.
- Sanjee ranks her **top 4** by replying to the email (email is the control
  plane, by design — this is meant to feel like managing an employee, not
  using a dashboard).
- Editorial quality/taste rules live in `skills/research-quality.md`, editable
  by Sanjee at any time without touching code.

### Model requirement (non-negotiable)

The research agent must run on **Claude Opus 4.8 or higher**. This is
enforced in code (`src/agents/research/model.ts`) by discovering models via
`Cursor.models.list()` and refusing to run on anything below that Opus
version, rather than silently falling back to a weaker/cheaper model.

### Sources

- X (Twitter), LinkedIn, Substack, other tech/social coverage — via the
  agent's own research during the run.
- Sanjee's Gmail inbox (newsletters) — fetched ahead of the run and injected
  into the prompt as context (`src/lib/gmail-read.ts`), rather than giving the
  cloud agent direct Gmail credentials.

### Scheduling

- Wednesday 6:00am, **always PST (fixed UTC-8)** — not Pacific local time
  with DST. Encoded as a fixed UTC cron (`0 14 * * 3`) rather than a
  timezone-aware scheduler, so "6am" never drifts across the year.

### Email

- Subject: `weekly Ideas for Sanjee talks`
- Sent from and to the same inbox for now: `sanjeedanusrat@gmail.com` (a
  dedicated agent inbox is a likely future change).
- Reply-based control plane: Sanjee replies with her ranked top 4. (Parsing
  that reply and handing it to the copy agent is out of scope for this MVP —
  tracked as future work below.)

### Runtime

- **Cloud** Cursor agents (via `@cursor/sdk`), not local — the weekly job
  must run unattended without a laptop being on.
- **TypeScript** implementation.
- **GitHub Actions cron** as the scheduler — no third-party automation tool.

## Out of scope for this MVP (future work)

- Parsing Sanjee's ranked-reply email and feeding it to the copy agent.
- Copy + social specialist agent (script writing, Wed 5pm).
- Creative execution / shooting guideline agent (Thu evening).
- Post-shoot Google Drive organization agent.
- Dedicated agent-only email inbox (separate from `sanjeedanusrat@gmail.com`).

## Open questions / follow-ups

- Exact Cursor model id for "Opus 4.8+" should be re-verified at each
  deploy via `Cursor.models.list()` — do not hardcode blindly.
- `skills/research-quality.md` is currently a placeholder — Sanjee to fill in
  real taste rules (what makes an idea good/bad, tone notes, examples).
- Gmail newsletter query (`GMAIL_NEWSLETTER_QUERY`) is a broad default; tune
  it once real inbox data is available.
