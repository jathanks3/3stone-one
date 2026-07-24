# 3Stone One — Technical Design Document

**Tagline:** One place to run your business.
**Status:** Pre-implementation architecture. No product code has been written yet — this document set is Phase 0.
**Owner:** 3Stone AI
**Last updated:** 2026-07-07 (v2 — see revision note below)

## What this document set is

Before writing any code, we designed the full system: data model,
navigation, roles, APIs, integrations, state management, wireframes, and a
phased build plan. Each is its own file in this `docs/` folder so it can be
updated independently as the product evolves.

Read [15-company-platform-vision.md](15-company-platform-vision.md) first
— it's the company-level source of truth this product and its internal
operations section sit inside, and it takes precedence over anything below
that it conflicts with.

Read the rest in this order:

1. [01-architecture.md](01-architecture.md) — the system as a whole, and *why* each major technology and structural choice was made
2. [02-folder-structure.md](02-folder-structure.md) — how the codebase will be organized
3. [03-database-schema.md](03-database-schema.md) — every entity and how they relate
4. [04-navigation-map.md](04-navigation-map.md) — every screen and how a user gets to it
5. [05-roles-and-permissions.md](05-roles-and-permissions.md) — who can do what
6. [06-component-hierarchy.md](06-component-hierarchy.md) — how the UI is assembled from reusable pieces
7. [07-api-architecture.md](07-api-architecture.md) — how the frontend and backend talk to each other
8. [08-integration-strategy.md](08-integration-strategy.md) — how QuickBooks, Stripe, Slack, etc. plug in
9. [09-state-management.md](09-state-management.md) — how data flows and stays in sync on screen
10. [10-ui-wireframes.md](10-ui-wireframes.md) — layout descriptions of the core screens
11. [11-roadmap.md](11-roadmap.md) — the build order, phase by phase
12. [12-saas-roadmap.md](12-saas-roadmap.md) — what comes after v1, once this is a sellable product
13. [13-self-critique.md](13-self-critique.md) — where this design is weakest, and what we're doing about it
14. [14-first-run-experience.md](14-first-run-experience.md) — the deliberately designed first 90 seconds, and why it's the highest-leverage screen in the product
15. [16-database-operations.md](16-database-operations.md) — the real database, once it exists: setup, migrations, rollback, backup, credential rotation
16. [17-production-readiness-checklist.md](17-production-readiness-checklist.md) — living checklist of what's real vs. mock, updated every milestone

## Revision note (v2)

This document set was revised after an initial review: the founder asked
for 3Stone One to stop feeling like "another dashboard" and start feeling
like the operating system of an entire business — the kind of software a
company pays $100,000+ to have custom-built. That request added real
architecture, not just screens: AI embedded in every module instead of one
page, one search index spanning the whole business, a generic approvals
mechanism reused by Finance and the Client Portal, a Finance layer that
deliberately does not become an accounting system, multi-location and
multi-business support, white-label, a marketplace extension point, and a
deliberately choreographed first-run experience. Every document above now
reflects that revision; each one's own revision note explains exactly what
changed and why.

## The one-paragraph pitch

3Stone One is not a replacement for QuickBooks, Toast, HubSpot, or Excel —
it's the single screen a business owner opens every morning that already
answers what needs their attention, what's making and costing them money,
who's behind, what changed, and what to do next — generated fresh every
morning, not assembled by the owner from six other tools. The same
codebase serves a restaurant, a law firm, a construction company, or a
security company by relabeling and lightly reconfiguring itself per
industry — not by being rebuilt per industry. AI isn't a chat page bolted
onto the side; it's a capability embedded in every module, backed by one
mechanism. And the moment someone opens the demo for the first time is
designed as deliberately as any other screen in the product — see
[14-first-run-experience.md](14-first-run-experience.md).

## Ground rules carried over from how we already build

- **BetAI's folder/service pattern** (`src/ui`, `src/features`,
  `src/types`, `src/services`, mock data behind a swappable service layer)
  is extended here, not replaced.
- **The 3Stone AI corporate brand** (near-black `#050505`, Inter typeface,
  single accent blue `#6e93d6`, calm/no-hype voice) is what 3Stone One
  wears — not BetAI's own theme.
- **New in v2:** every cross-cutting capability (AI, search, approvals) is
  built as one shared mechanism instantiated many times, never as N
  separate features that happen to look similar — the same discipline v1
  already applied to industry adaptability.

## Where this lives

This document set and the eventual codebase live in their own repository
(`3stone-one`), separate from `bet-ai` and `3stone-website`.
