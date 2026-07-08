# Architecture

## Revision note (v2)

This document was revised after the founder asked for 3Stone One to stop
feeling like "another dashboard" and start feeling like the operating
system of an entire business — the kind of software a company pays
$100,000+ to have built for them. That request added real architecture, not
just new screens: AI embedded in every module instead of one page, one
search index spanning the whole business, a generic approvals mechanism,
a Finance layer, multi-site and multi-business support, white-label, and a
marketplace extension point. Sections 5–11 below are new in this revision;
sections 1–4 are unchanged from v1 because nothing about them stopped being
true — the new capabilities are built *on* this foundation, not instead of
it.

## 1. System shape, in one picture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Next.js application                      │
│                                                                   │
│  ┌───────────────┐   ┌───────────────────┐   ┌─────────────────┐ │
│  │ React UI       │──▶│ Route Handlers     │──▶│ Service layer    │ │
│  │ (App Router,   │   │ /app/api/v1/...   │   │ src/server/      │ │
│  │  Server +      │◀──│ (thin, validates,  │◀──│ services/*       │ │
│  │  Client        │   │  scopes by         │   │ (mock today,     │ │
│  │  Components)   │   │  workspace)        │   │  Prisma later)   │ │
│  └───────────────┘   └───────────────────┘   └─────────┬────────┘ │
└──────────────────────────────────────────────────────────┼────────┘
                                                            │
                              ┌─────────────────────────────┼─────────────────────────────┐
                              ▼                             ▼                             ▼
                        PostgreSQL                   Search index                   External services
                        (via Prisma) ──────────▶  (tsvector today,           (QuickBooks, Stripe, Slack,
                        + object storage             embeddings later)         email, calendar — behind
                                                                                 the Integration layer)
```

Every service write also writes to the search index (see section 6) and,
where relevant, logs an `AiActionLog` entry (section 5) — these aren't
separate pipelines bolted on afterward, they're part of what "saving a
record" means in this system from day one.

## 2. Technology choices and why

| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js 15 (App Router)**, TypeScript, React 19 | Multi-page, authenticated, server-rendered app with its own API, in one framework. |
| Styling | **Tailwind CSS** + internal component kit (Radix primitives) | Same visual discipline as the marketing site, enforced in code. |
| Server state | **TanStack Query** | Caching, refetch, loading/error states for every module without hand-rolled fetch logic. |
| Client-only UI state | **Zustand**, one small store per feature | No global mega-store; see [09-state-management.md](09-state-management.md). |
| Forms & validation | **React Hook Form + Zod** | One approach for every form, including schema-driven custom fields and the Report Builder's filter/column config. |
| Database | **PostgreSQL via Prisma ORM** | Relational data fits a CRM/Projects/Finance/Comms system that constantly cross-references itself. |
| Hosting (DB) | Supabase or Neon | Hosted Postgres, decided at implementation time. |
| Auth | **Auth.js (NextAuth) v5**, Clerk/WorkOS SSO later | Covers login/register/forgot/demo without a per-user bill; SSO is a paid-tier upgrade, not a v1 requirement. |
| File storage | S3-compatible storage behind a `StorageService` | Documents, client uploads, Knowledge Center video/file attachments. |
| Search | **Postgres full-text search** (`tsvector` + GIN index) against a shared `SearchIndexEntry` table; semantic/embedding search layered on later | One search bar spanning eleven entity types needs one index that every module writes to, not eleven separate search implementations. See section 6. |
| Real-time (chat, live notification badges) | Mocked as short-interval polling (TanStack Query refetch) through Phase 11; a websocket provider (Pusher or Supabase Realtime) in Phase 12 | Internal Chat and notification badges *feel* real-time to a demo audience via polling; genuine push delivery is real infrastructure, deferred to the same phase as the rest of the backend-reality pass. |
| Payments | **Stripe** (Payment Intents / Checkout) | Already a connected company account; this is also the first "real" integration scheduled in the roadmap, since Client Portal invoice payment is the highest-value thing to prove works for real. |
| Document/report export | Excel and CSV generation is genuinely real starting in the phase it's built (formatting a file from already-fetched data needs no live backend); PDF rendering refined once real data exists | Export is a formatting problem, not a backend problem — no reason to mock it. |
| Background jobs / automation execution | Queue-based worker (e.g. Inngest), simulated in-memory through Phase 11 | Same mock-now/real-later rule as everything else. |
| Hosting (app) | **Vercel** | Already the company's deploy target. |
| Repo shape | **Single repository** | One app, one team; a monorepo is warranted the day a second surface (public API, mobile app) exists, not before. |

## 3. Multi-tenancy: how one codebase serves many companies

Unchanged from v1: every company is a **Workspace**, every business-data
table carries a `workspaceId`, every query is scoped to the active
workspace, enforced once in the service layer and reinforced later with
Postgres row-level security. What's new in this revision is that a
Workspace can now also have multiple **Sites** underneath it (section 9),
and a single person can own and instantly switch between *multiple*
Workspaces via the **Portfolio** view (also section 9) — multi-tenancy was
already built to support both, it just wasn't exposed as first-class
product surface until this revision asked for it explicitly.

## 4. Industry adaptability

Unchanged from v1 — canonical entity names in code and database, an
Industry Profile that supplies a terminology map, module visibility, custom
fields, and pipeline stages per industry. Full detail in the original
section below.

**The rule: the database and the code never change per industry. Only data
does.**

- **Canonical names, always.** `Project`, `Person`, `Organization`, `Task`
  — code is written once against these names, forever.
- **An Industry Profile is a data record.** Each Workspace picks one at
  signup. It contains a terminology map, module visibility flags, custom
  field schemas, and pipeline-stage lists (see
  [13-self-critique.md](13-self-critique.md) for why stages, not just
  labels, matter).
- **Naming collision, resolved:** a restaurant's Industry Profile relabels
  `Project` as **"Location."** This revision separately introduces a
  **Site** entity for genuine multi-site/multi-location support (section
  9) — a restaurant group's five physical restaurants. These are
  deliberately different things with deliberately different names in the
  code (`Project` vs. `Site`) specifically so a restaurant customer seeing
  "Location" in their nav (meaning: a project/engagement) is never confused
  with "Sites" in Settings (meaning: their five physical buildings). If
  this ever reads as confusing in real usage, the fix is a copy change in
  the terminology map, not a data model change — but it's worth watching
  for during the Restaurant industry profile build in Phase 11.

## 5. AI everywhere: one capability, many modules

The brief asks for AI inside CRM, Projects, Documents, Employees, and
Analytics — not as five separate integrations, but as **one mechanism
instantiated five times.**

```
src/server/ai/
  ├── capabilities/
  │   ├── crm.ts          summarizeHistory, draftProposal, predictHealth
  │   ├── projects.ts     estimateCompletion, findBottlenecks, generateStatusUpdate
  │   ├── documents.ts    summarize, rewrite, extractActionItems
  │   ├── people.ts       identifyBurnoutSignals, recommendStaffing
  │   └── analytics.ts    explainTrend, forecastRevenue, suggestImprovements
  └── registry.ts         AiCapability { key, module, label, inputSchema, run() }
```

Every capability implements the same shape:

```ts
interface AiCapability<Input, Output> {
  key: string;                 // "crm.summarizeHistory"
  module: ModuleKey;
  label: string;               // shown on the button: "Summarize history"
  inputSchema: ZodSchema<Input>;
  run(input: Input, ctx: WorkspaceContext): Promise<Output>;
}
```

One route handler (`POST /api/v1/ai/run`) resolves a capability by key,
validates input, calls `run()` (a realistic mocked response today, a real
model call later), and writes an `AiActionLog` row — which means every AI
action, in every module, is automatically searchable later as "AI
Knowledge" in Global Search (section 6), and automatically auditable in the
Activity Log.

One UI component, `<AiActionButton capability="crm.summarizeHistory"
entityId={lead.id} />`, is what every module actually embeds — a Lead card
gets three buttons, a Project detail page gets three different buttons,
same component, different capability keys. This is the same discipline
already applied to industry adaptability: **build the mechanism once,
instantiate it many times**, rather than writing "AI for CRM" and
separately "AI for Projects" as unrelated features that happen to both call
an LLM.

**What ships mocked vs. real:** every capability's `run()` is a believable,
context-aware canned response in Phases 2–11 (see [11-roadmap.md](11-roadmap.md))
— not a generic Lorem-ipsum placeholder, but a response actually built from
the mock record's real fields, so a demo of "Summarize customer history" on
Acme Corp genuinely reads back Acme Corp's mock deal history. Swapping in a
real model call later touches `capabilities/*.ts` only.

## 6. Global search: one index, every entity

**The requirement:** one search bar, everything — customers, projects,
employees, documents, tasks, invoices, meetings, notes, emails,
conversations, AI knowledge.

**The mechanism:** a single `SearchIndexEntry` table (see
[03-database-schema.md](03-database-schema.md)), written to by every
service, never by a separate sync job:

```ts
// inside every service's create/update/delete
await searchIndexService.upsert({
  workspaceId, entityType: 'lead', entityId: lead.id,
  title: `${lead.firstName} ${lead.lastName}`,
  snippet: lead.organization?.name ?? lead.email,
});
```

This is the same reason the industry-adaptability terminology map works:
one shared place, called from everywhere, instead of trusting eleven
different modules to remember to keep a separate search system in sync.
A record that's created, updated, or deleted is searchable (or stops being
searchable) in the same transaction as the change itself — there is no
"reindex" step to forget.

- **v1 (mock/demo):** in-memory search across mock service data —
  substring + simple relevance scoring, grouped by entity type.
- **Real (Phase 12):** Postgres full-text search — `tsvector` column +
  GIN index on `SearchIndexEntry`, ranked with `ts_rank`.
- **Later (SaaS roadmap):** semantic/embedding search (pgvector or a
  dedicated vector store) layered on top for natural-language "AI
  Knowledge" queries — additive to keyword search, not a replacement.

**UI:** a ⌘K command palette, available from anywhere in the app (same
level as the AI Assistant panel), grouped results capped per group with a
"see all in [module]" — see [10-ui-wireframes.md](10-ui-wireframes.md).

## 7. Approvals: one generic mechanism, reused everywhere

Two new requirements both need the same underlying thing: a client
"approving work," and an employee's "purchase request" needing sign-off.
Rather than building two approval systems, there's one:

```
ApprovalRequest
  workspaceId, entityType ("project_milestone" | "purchase_request" | ...),
  entityId, requestedById, approverId, status (pending|approved|rejected),
  decidedAt, notes
```

A `ProjectMilestone` and a `PurchaseRequest` both just create an
`ApprovalRequest` pointing at themselves and wait for a status change. The
UI component (`<ApprovalCard>`, Tier 1) doesn't know or care whether it's
rendering a client approving a project milestone or a manager approving a
purchase — it renders "what's being approved, who asked, approve/reject" —
same reasoning as the AI capability pattern in section 5: one mechanism,
multiple call sites.

## 8. Finance: decision support, not a ledger

**Explicitly, Finance is not double-entry accounting and does not replace
QuickBooks** — that line from the original brief still holds, and this
module is designed not to cross it. Finance is a decision-support layer:

- **Revenue Overview, Profit Dashboard, Cash Flow Snapshot** — computed
  views over native `Invoice`/`Expense` records plus whatever's synced
  from QuickBooks. No general ledger, no chart of accounts, no journal
  entries — those stay QuickBooks' job.
- **Outstanding Invoices** — invoices 3Stone One itself issues to clients
  (paid through the Client Portal via Stripe) *and* invoices synced in
  read-only from QuickBooks for a unified view — both land in the same
  `Invoice` table with a `source` field (`manual` | `quickbooks_sync`).
- **Vendor Expenses, Purchase Requests, Budget Tracking** — native records
  (`Vendor`, `Expense`, `PurchaseRequest`, `Budget`) for operational
  spend-control *before* it becomes an accounting entry — a Purchase
  Request being approved (via the mechanism in section 7) is a business
  workflow QuickBooks was never designed to own.

This distinction matters enough that it's called out again in the
self-critique — Finance is the module most likely to face pressure to
"just do the accounting too," and the architecture is deliberately drawing
the line now, before that pressure exists.

## 9. Locations, multiple businesses, and the Portfolio view

**Multiple locations within one company** (a restaurant group's five
restaurants, a security company's guarded sites, a medical practice's
clinics) is a new `Site` entity:

```
Site
  workspaceId, name, address, type, customFields
```

`Project`, `Task`, and `WorkspaceMember` each gain an optional `siteId` —
a job can be scoped to a job site, a technician to their home site, without
every industry needing its own multi-location concept bolted on
separately.

**Multiple businesses** (one person owning several companies, each running
its own 3Stone One workspace — the direct product expression of the
3Stone Capital vision) needed no new schema: a `User` could already belong
to many `Workspace`s via `WorkspaceMember` in v1. What this revision adds is
making that a first-class, designed experience rather than an incidental
capability:

- **Portfolio view** (`/portfolio`) — visible only to users who are
  `Owner` on more than one Workspace. A rollup: revenue, profit, overdue
  work, and headcount, side by side across every company they own, with
  one click into any of them — no logout, no re-authentication.
- This is genuinely useful to 3Stone Capital itself first, and to any
  customer who grows into owning multiple locations or companies second —
  the same "build it once, it serves two audiences" pattern as everything
  else in this document.

## 10. White-label

A new `Branding` record, one per Workspace, layered **on top of** the
Industry Profile rather than replacing it — Industry Profile decides what
things are *called*; Branding decides what the product *looks like*:

```
Branding
  workspaceId, logoUrl, faviconUrl, primaryColor, customDomain,
  domainVerifiedAt
```

- **v1:** logo, favicon, and primary accent color are swappable per
  workspace and actually render through the theme-token system already in
  place — this works immediately, with no new infrastructure, because the
  theme was already built as CSS custom properties, not hardcoded values.
- **Custom domain routing** (`clientcompany.com` resolving to their
  Workspace) needs real infrastructure — a Next.js middleware layer
  resolving the `Host` header to a `workspaceId` — and is deferred to
  [12-saas-roadmap.md](12-saas-roadmap.md), built when an actual white-label
  customer needs it, not speculatively.

## 11. Marketplace (extension points now, storefront later)

The long-term ask is "install modules, industry templates, automation
templates, AI agents." Building a storefront now, with one installed
customer, would be solving a distribution problem before there's anything
to distribute. What's worth doing now is making sure v1's own module system
is shaped like something that *could* be installed, so the storefront is a
UI over existing structure later, not a re-architecture:

```
src/config/modules/
  ├── crm.ts
  ├── projects.ts
  ├── finance.ts
  └── ...
  each module self-describes: { key, label, requiredPermission, isCore }
```

```
MarketplaceListing        key, type (module|industry_template|automation_template|ai_agent), label, description
WorkspaceInstallation      workspaceId, listingKey, installedAt, config
```

Every built-in module (CRM, Projects, Finance, ...) is pre-seeded as an
installed `MarketplaceListing` for every workspace. Nothing about this
changes how v1 ships — it means the eventual marketplace storefront
(SaaS roadmap) is additive, not a rewrite of how modules are registered.

## 12. Performance & feel

"Every screen should feel like software built in 2026" is a design
requirement with real architectural consequences:

- **React Server Components + streaming** for first paint on every
  authenticated page — data-heavy screens (Dashboard, Finance, Analytics)
  render on the server and stream in, rather than shipping a loading
  spinner and fetching client-side.
- **Skeleton states everywhere, no bare spinners** — a screen that's
  loading shows the shape of what's coming, not a blank page with a
  spinner in the middle.
- **`next/image`** for every image, automatic route-level code-splitting
  (native to the App Router), and TanStack Query's cache meaning a screen
  visited twice in a session never re-fetches from a cold start.
- **Target feel, not just target metrics:** Largest Contentful Paint under
  1.5s and interaction latency under 100ms on the core screens (Dashboard,
  CRM, Projects) — stated here so Phase 11's polish pass has something
  concrete to measure against rather than "make it feel fast."

## 13. Layering summary

- **UI layer** (`src/features/*`, `src/ui`) — knows nothing about where
  data comes from; talks to the API only through typed hooks.
- **API layer** (`/app/api/v1/*`) — thin. Validates, resolves workspace +
  permissions, calls the service layer, shapes the response.
- **Service layer** (`src/server/services/*`) — all business logic and
  data access; every write also updates the search index (section 6) and,
  where relevant, the AI action log (section 5). Mocked today, Prisma-backed
  in [Phase 12](11-roadmap.md).
- **Data layer** — Postgres (via Prisma), object storage, search, and
  external services, introduced for real in Phase 12, not before.

See [02-folder-structure.md](02-folder-structure.md) for exactly where each
of these lives on disk.
