# Development Roadmap

**Revision note (v2):** the phase count grew from 10 to 15 to fit Finance,
Communications, Meetings, Knowledge Center, the expanded Client Portal,
Portfolio, and white-label — that growth is itself flagged as a risk in
[13-self-critique.md](13-self-critique.md), not glossed over. The
sequencing principle is unchanged: every phase leaves the app in a
working, demo-able state, and phases run in order.

One sequencing change carries real weight: **Global Search and the AI
capability registry move up to Phase 2**, ahead of every module that
depends on them (v1 had put "AI" late, as its own phase). Building the
shared mechanism before the six modules that plug into it means each of
those modules "gets AI and search for free" as they're built, instead of
six modules each needing a retrofit later.

## Phase 0 — Foundation (this document set)

Architecture, schema, navigation, roles, roadmap, and self-critique — this
revision included. Done as of this writing.

## Phase 1 — Shell, Auth, Sites, Dashboard v1

- Next.js scaffolded, 3Stone AI theme tokens ported in
- `AppShell`, Login/Register/Forgot Password/Demo Login
- `Site` entity built from the start (Projects/People reference it from
  day one rather than being retrofitted)
- Demo login seeds a fully populated demo workspace
- Executive Dashboard targeting the six-question layout from
  [10-ui-wireframes.md](10-ui-wireframes.md) — with placeholder/static
  "morning briefing" copy (the real AI-generated version lands in Phase 2)
- **Demoable at the end of this phase:** log in (or hit demo), land on a
  populated dashboard, switch industry profile labels live.

## Phase 2 — Global Search + AI capability registry (moved up, see note above)

- `SearchIndexEntry` (in-memory mock), `<SearchPalette/>`, `/api/v1/search`
- `AiCapability` registry, `<AiActionButton/>`, `POST /api/v1/ai/run`,
  `AiActionLog`
- The Dashboard's morning briefing becomes a real (mocked) AI capability
  output, not placeholder copy
- No end-user-visible module content yet beyond Dashboard — this phase is
  entirely shared infrastructure, which is exactly why it's worth doing
  before the modules that need it

## Phase 3 — CRM

- Leads, Customers, Companies, Pipeline
- AI capabilities: summarize history, draft proposal, predict health
- Every CRM record indexed in Global Search from the moment it's created

## Phase 4 — Projects/Tasks + Employee Portal

- Kanban, Calendar, List, My Tasks; Departments, Roles, Directory,
  Announcements; `Site`-scoping wired into Projects
- AI capabilities: estimate completion, find bottlenecks, generate status
  update, identify burnout signals, recommend staffing

## Phase 5 — Communications Center + Meetings

- Email inbox (mock), Internal Chat (`ChatChannel`/`ChatMessage`, polling
  "real-time"), Call Notes
- Meetings: agenda, action items, decisions, AI-generated summaries
- Paired deliberately — a Meeting's notes are the kind of content that
  should already be showing up in Communications and Global Search the
  same day this phase ships, not months apart

## Phase 6 — Documents + Knowledge Center

- Document upload/sharing (mock storage)
- Knowledge Center: Policies, Training, Processes, SOPs, Videos
- AI capabilities: summarize, rewrite, extract action items — usable on
  both Documents and Knowledge Articles, same capability registered once

## Phase 7 — Finance

- Revenue Overview, Profit Dashboard, Cash Flow Snapshot, Outstanding
  Invoices, Vendor Expenses, Budget Tracking
- Purchase Requests — this is where the **generic `ApprovalRequest`
  mechanism is actually built**, ahead of Client Portal needing the same
  mechanism in Phase 8, on purpose
- The "Restrict Finance to Owner only" permission toggle ships in this
  phase, not deferred

## Phase 8 — Client Portal (expanded) + Report Builder

- Client Portal: view + approve project milestones (reusing Phase 7's
  `ApprovalRequest`), upload documents, view invoices, message the team
- Invoice payment UI is built here against **Stripe test mode** — a real
  integration, earlier than the rest of backend reality, per
  [08-integration-strategy.md](08-integration-strategy.md)
- Report Builder: entity/column/filter/group-by picker, live preview,
  Excel/CSV export genuinely real (PDF refined later)

## Phase 9 — Automation Builder + Integrations + Analytics

- Visual workflow canvas (fixed node catalog), simulated execution engine
- Integrations page: every remaining provider as a realistic mock adapter
  (QuickBooks read-only sync feeding Finance, Slack, Shopify, HubSpot,
  Salesforce, Microsoft 365, Google Workspace, Calendly, Toast POS, Excel,
  Google Sheets, Calendar)
- Analytics: AI capabilities — explain trend, forecast revenue, suggest
  improvements

## Phase 10 — Portfolio + White-label (v1 scope) + Marketplace data model

- `/portfolio` rollup view for multi-workspace owners
- `Branding` entity: logo/favicon/accent-color swap per workspace, actually
  rendering through the existing theme-token system (custom domain routing
  is [SaaS roadmap](12-saas-roadmap.md), not this phase)
- `MarketplaceListing`/`WorkspaceInstallation` seeded with every built-in
  module marked pre-installed — no storefront UI yet

## Phase 11 — Polish + First-Run "Wow" pass

- Full execution of [14-first-run-experience.md](14-first-run-experience.md)
- Animation, empty-state, responsive/mobile, accessibility passes
- Three industry profiles fully realized (Professional Services default,
  Restaurant, Construction); the rest labeled "coming soon"
- Performance pass against the targets in
  [01-architecture.md §12](01-architecture.md#12-performance--feel)
- **This is the new "portfolio-ready" milestone** — the point at which the
  product is demo-ready end to end, replacing v1's Phase 7 as the line
  between "building the product" and "polishing the product"

## Phase 12 — Backend reality pass

- Real Postgres + Prisma (schema from
  [03-database-schema.md](03-database-schema.md)), real Auth.js, real
  object storage, real Postgres full-text search (`tsvector`/GIN)
  replacing the in-memory search mock, real websocket transport (Pusher or
  Supabase Realtime) replacing Chat/notification polling
- Every mock service swapped module by module behind existing service-layer
  interfaces — routes and UI unchanged during this phase, by design

## Phase 13 — Remaining real integrations

- QuickBooks (Finance) implemented for real, as the second proof (after
  Stripe in Phase 8) that the `IntegrationProvider` abstraction holds up
- Email/Calendar providers wired to real OAuth for Communications/Meetings

## Phase 14 — First paying pilot

- Onboard one real customer workspace, in one real industry, feed what's
  learned back into this document set

## What's explicitly out of scope until the SaaS roadmap

Custom roles, SSO, public partner API, billing/subscription tiers,
marketplace storefront UI, custom-domain white-label routing, mobile app —
see [12-saas-roadmap.md](12-saas-roadmap.md).
