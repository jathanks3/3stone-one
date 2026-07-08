# 3Stone One

**One place to run your business.**

The flagship software platform for 3Stone AI — the operating system a
business owner opens every morning to see what needs attention, what's
making and costing them money, and who's behind on work, then manage their
CRM, projects, team, finances, communications, and knowledge from one
place — without replacing the tools (QuickBooks, Toast, HubSpot, Excel,
etc.) they already use.

## Status

Architecture approved; building the interactive demo now, phase by phase.
Phase 1 (this build): login + demo login, executive dashboard, full
navigation shell, responsive layout, theme system, and realistic mock data
for the "Acme Construction" demo workspace. Everything else in the nav is
a clearly labeled "coming soon" placeholder until its phase — see
[`docs/11-roadmap.md`](docs/11-roadmap.md).

This is a demo, not a production app: no real auth, no real database —
mock data everywhere, per [`docs/01-architecture.md`](docs/01-architecture.md).

## What's here

```
docs/     Full technical design document set (architecture, schema,
          navigation, roles, roadmap, self-critique, first-run experience
          — 15 files, start at docs/00-overview.md)
CLAUDE.md Operating guide for how work happens in this repo
src/      The Next.js app itself
```

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — it redirects to
`/login`. Use the **Try the Live Demo** button to sign in as Acme
Construction without entering credentials.

## Relationship to other 3Stone AI repos

- `bet-ai` — BetAI, 3Stone AI's first portfolio product. Its folder/service
  conventions are reused here; its visual theme (green accent, Space
  Grotesk) is BetAI's own product identity and is not used here.
- `3stone-website` — the public marketing site. 3Stone One follows the same
  corporate brand system (near-black, Inter, single accent blue) documented
  in that repo's `branding/BRAND_GUIDELINES.md`.
