# CLAUDE.md — 3Stone One Operating Guide

This file is the operating guide for how Claude works on this project. Read
it before making changes. It distills the full architecture in
[`docs/`](docs/00-overview.md) — read those documents for the reasoning
behind any rule below; this file is the condensed, enforceable version.

## 1. Company & product context

3Stone AI sells outcomes (time saved, fewer mistakes, better customer
experience, more revenue), not code or AI for its own sake. 3Stone One is
the flagship product: the single screen a business owner uses to manage
their whole company, sitting on top of (not replacing) tools like
QuickBooks, Toast, HubSpot, and Excel. Full vision: [docs/00-overview.md](docs/00-overview.md).

## 2. Founder context

Same as BetAI: the founder is CEO/product/operator, not a full-time
programmer. Explain technical decisions in plain English — tradeoffs and
business impact, not jargon. Never bury a decision inside a code change
without surfacing it first.

## 3. The one rule everything else follows: canonical names, industry labels

The database and code always use generic names (`Project`, `Person`,
`Organization`, `Task`). Industry-specific labels ("Job," "Case,"
"Location") come **only** from the active Industry Profile's terminology
map, read through the `useIndustryLabel` hook. **Never hardcode an
industry-specific entity name anywhere in code, copy, or comments.** This
is the mechanism that lets one codebase serve every industry — see
[docs/01-architecture.md](docs/01-architecture.md#industry-adaptability).

## 4. Architecture rules

- Route handlers validate, check permission, call a service, shape a
  response — they never contain business logic themselves.
- UI components never call a service or Prisma directly — only through
  `src/features/<module>/hooks` and `/api` client functions.
- Mock data lives behind the service layer (`src/server/services/*`) so
  swapping mock for real Postgres/Prisma later never touches routes or UI.
- Do not connect real third-party APIs or a real database yet — mock data
  only, until [Phase 12](docs/11-roadmap.md#phase-12--backend-reality-pass)
  (Stripe test-mode for Client Portal payments is the one deliberate
  exception, starting Phase 8 — see
  [docs/08-integration-strategy.md](docs/08-integration-strategy.md)).
- Every business-data table/record carries a `workspaceId`; every query is
  scoped to the active workspace.
- **Any AI feature is a new entry in the `AiCapability` registry
  (`src/server/ai/capabilities/*`), never a bespoke integration.** It's
  used via one component, `<AiActionButton capability="..." />`. See
  [docs/01-architecture.md §5](docs/01-architecture.md#5-ai-everywhere-one-capability-many-modules).
- **Any create/update/delete on a user-facing record must also call
  `searchIndexService.upsert`/`.remove` in the same function** — this is
  what keeps Global Search (and "AI Knowledge" results) from silently
  going stale. See
  [docs/01-architecture.md §6](docs/01-architecture.md#6-global-search-one-index-every-entity).
- **Any "someone needs to approve this" flow uses the generic
  `ApprovalRequest` mechanism** — do not build a second bespoke approval
  system for a new module. See
  [docs/01-architecture.md §7](docs/01-architecture.md#7-approvals-one-generic-mechanism-reused-everywhere).
- **Finance never grows accounting-ledger features** (reconciliation,
  multi-currency, journal entries) — that stays QuickBooks' job, synced
  read-only. See
  [docs/01-architecture.md §8](docs/01-architecture.md#8-finance-decision-support-not-a-ledger).
- See [docs/02-folder-structure.md](docs/02-folder-structure.md) for exactly
  where new code belongs.

## 5. Design rules

3Stone One wears the **3Stone AI corporate brand**, not BetAI's theme:
near-black `#050505` base, Inter typeface only, single accent blue
`#6e93d6` used sparingly, generous spacing, calm/no-hype voice. Enterprise
density (this is a dashboard-heavy app), not the marketing site's spacious
one-page layout. Reference: `3stone-website/branding/BRAND_GUIDELINES.md`.

## 6. Engineering rules (same discipline as BetAI)

- Before major changes, explain the decision in plain English first.
- One logical change at a time; keep the app working after every step.
- Fix TypeScript errors before moving on.
- Avoid overengineering; don't add frameworks or abstractions the current
  phase doesn't need (see the roadmap in [docs/11-roadmap.md](docs/11-roadmap.md)
  for what "the current phase" means at any given time).
- Don't move or delete files without a clear, stated reason.

## 7. Working style

When asked to build:
1. Summarize the plan in plain English.
2. Say exactly which files will be created, edited, or deleted.
3. Make the changes.
4. Run checks (typecheck, lint, tests) if possible.
5. Summarize what changed and what to verify in the browser.

## 8. Next.js version note

This app is scaffolded on Next.js 16, which renamed `middleware.ts` to
`proxy.ts` (exported function `proxy`, not `middleware`) and made
`cookies()`/`headers()`/`params`/`searchParams` async-only, among other
breaking changes from what most training data assumes. See `AGENTS.md` at
the repo root, and check `node_modules/next/dist/docs/` for the specific
guide before using an App Router API that seems unfamiliar.

## 9. Before deviating from `docs/`

If implementation reveals a gap in the architecture (a permission check
that doesn't fit the model, an industry that needs more than relabeling,
etc.), stop and update the relevant file in `docs/` first — don't quietly
work around it in code. [docs/13-self-critique.md](docs/13-self-critique.md)
lists the specific gaps we already know to watch for.
