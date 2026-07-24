# Architecture Inventory

Every external service the application depends on, or is documented as
intending to depend on, as of this snapshot. Compiled by reading actual
code (`package.json`, `.env.example`, service files) and actual
infrastructure (`vercel env ls`, `prisma migrate status`), not by
recalling what was planned — where a doc and the code disagreed, the code
won and the doc is flagged for correction elsewhere
([17-production-readiness-checklist.md](17-production-readiness-checklist.md)
is the living record of that kind of drift).

Scope: the 3Stone One application on `main` (this working tree). The
marketing site (`3stone-website`) is a separate repository and isn't
covered here.

## Legend

- **Connected** — real credentials configured, real calls made, verified
  working against live infrastructure.
- **Partially connected** — some real piece exists (a schema, a queued
  token, a provisioned project) but the end-to-end path isn't live yet.
- **Blocked** — nothing technical is wrong; the next step requires
  something this session/role can't do alone (a DNS change, a
  third-party account only the founder can create, an explicit approval
  boundary).
- **Not adopted** — deliberately not using an external service for this,
  and why.

## Inventory

| Service | Category | Status | Notes |
|---|---|---|---|
| **Neon** (Postgres) | Database | **Connected** | Real project, migrated via `prisma migrate deploy`, pooled + unpooled connection strings set in Vercel (Production/Preview/Development) and locally. Every real (non-demo) data path in the app reads/writes this database. |
| **Vercel** | Hosting / env management | **Connected**, deploy pending | Project linked (`3-stone-ai/3stone-one`); env vars (including `SESSION_SECRET`, added this session) managed via Vercel CLI across all three environments. **Caveat:** recent local commits (this session's entire SaaS-foundation milestone) have not been pushed — established pattern has been commit-but-don't-push unless asked. Vercel's actual deployed build is behind local `main` until that push happens. |
| Custom auth (scrypt password hashing + HMAC-signed session cookies) | Authentication | **Connected** | Built and hardened this session: signed cookies (fixed a real forgeable-cookie vulnerability), session revocation via `sessionVersion`, password reset, login-attempt rate limiting, login history. No third-party auth provider involved. See "Conflicts" below — this is the one place a real conflict with another branch exists. |
| **Resend** | Email delivery | **Blocked** | Referenced in code as the intended provider (`onboardingService.ts`, `authService.ts` comments). Sending requires a verified sending domain — a DNS change, an explicit approval boundary never crossed without asking. No SDK installed, no API key configured. Every email-triggering flow (verification, password reset, invitations) generates a real, single-use token and a real link; the "send" is `console.log` + shown on-screen, clearly labeled as a stand-in, never faked as delivered. |
| **Stripe** | Payments | **Blocked** | Designated in [08-integration-strategy.md](08-integration-strategy.md) as the first real (test-mode) integration, for Client Portal "Pay Now" and Invoice `paid` status. No `stripe` package installed, no API keys anywhere. Billing Foundation (built this session) reads real `Subscription`/`PlatformInvoice` rows and shows real plan/MRR/trial state, but "Upgrade" is a disabled "Contact us" button — no live Payment Intent or webhook wiring. Needs the founder's own Stripe account + test-mode keys, which can't be generated on their behalf. |
| **QuickBooks** | Accounting | **Blocked / not started** | Designated in 08-integration-strategy.md for Finance's read-only Revenue/Profit/Invoice sync (3Stone One never writes accounting entries back — see [01-architecture.md §8](01-architecture.md#8-finance-decision-support-not-a-ledger)). No OAuth app registered, no SDK. Finance module itself is still mock end-to-end, so this has no consumer yet either. |
| **Gmail / Microsoft 365** | Email provider (Communications module) | **Not started** | Designated in 08-integration-strategy.md to populate real `EmailMessage` rows. No OAuth app, no SDK. Communications module is still mock. |
| **Google Calendar / Microsoft 365** | Calendar (Meetings module) | **Not started** | Designated in 08-integration-strategy.md for `Meeting.calendarEventId` two-way sync. No OAuth app, no SDK. Meetings module is still mock. |
| AI provider for the `AiCapability` registry | AI / LLM | **Not connected** | CLAUDE.md and 01-architecture.md establish "one capability registry, one `<AiActionButton>`" as the architecture, but every capability in `src/server/ai/capabilities.ts` (`summarizeCustomerHistory`, `draftProposal`, `predictCustomerHealth`, etc.) is template/rule-based text generated from mock data — no LLM API call, no SDK (`@anthropic-ai/sdk`, `openai`, Vercel `ai` — none installed), no API key anywhere. Worth stating plainly: nothing in this app calls a real AI model today. |
| File / object storage (avatars, workspace logos, documents) | Storage | **Not connected** | `StorageUsageSnapshot` exists in schema; nothing populates it. `User.avatarUrl` / `Workspace.logoUrl` (built this session) are plain text URL fields specifically *because* no object storage is provisioned — a user pastes an externally-hosted image URL rather than uploading a file. No Vercel Blob / S3 / equivalent SDK installed. |
| Full-text search | Search | **Partially connected — not a third-party service** | `SearchIndexEntry.searchVector` (generated tsvector column + GIN index) already exists and works at the database level, built on Neon Postgres itself — no external search service (Algolia etc.) is or should be involved. What's missing is the write-path (create/update/delete on a record should call `searchIndexService.upsert/.remove`, per [01-architecture.md §6](01-architecture.md#6-global-search-one-index-every-entity)) and the ⌘K UI, not a new service to adopt. |
| Structured error monitoring (Sentry or equivalent) | Observability | **Not connected** | Flagged as a known gap in 17-production-readiness-checklist.md. Currently `console.error` only, visible in Vercel's own log aggregation. |
| Redis / Vercel KV / Upstash | Rate limiting store | **Not adopted (deliberate)** | Considered and rejected this session in favor of a DB-backed limiter (counts recent `SecurityEvent`/`PasswordResetToken` rows) — an in-memory counter would do nothing across separate serverless invocations, and no new infra was needed to solve the actual problem. Not a gap; a decision, documented so it isn't re-litigated as an oversight. |
| The in-app "Integrations" page (QuickBooks, Stripe, Slack, HubSpot, Toast, Shopify, Salesforce, Calendly, Excel, Google Sheets/Workspace, Microsoft 365, Square, Clover, Lightspeed, WooCommerce) | — | **Demo fiction, not real status** | `src/server/mock-data/integrations.ts` hardcodes several of these as `status: "connected"` (QuickBooks, Stripe, Slack) for the demo experience only. This must never be read as real integration state — every one of the entries above is the actual, current status; the Integrations page's badges are unrelated set dressing until the Integrations module itself is converted. |

## Conflicts

### Postgres: Neon vs. Supabase

**Neon is the source of truth for the application on `main`.** It's the
only Postgres this branch has ever been migrated against, seeded, or
tested with — real schema, real data, real Vercel integration, exercised
by every commit in this session.

Supabase Postgres exists, but only in a **separate, unmerged git
worktree/branch** (`.claude/worktrees/client1`, branch
`claude/client1-production`) — a different implementation with its own
divergent commit history, using `@supabase/supabase-js` and
`@supabase/ssr` for Postgres, auth, and storage
(`src/server/db/auth.ts`, `src/server/db/admin.ts`,
`src/server/services/storage.ts` in that worktree). It is not part of
the current application; nothing on `main` reads from or depends on it.
Reconciling the two branches (or deciding one supersedes the other) is a
known open task, tracked separately from this milestone — it is not
something this document resolves, only names accurately.

### Authentication: custom (scrypt + signed cookies) vs. Supabase Auth

**Custom auth is the source of truth for the application on `main`**, for
the same reason: it's what's actually deployed, migrated, hardened
(signed cookies, session revocation, rate limiting — all built and
adversarially tested this session), and load-bearing for every real
session on this branch. The founder's own Production Charter for this
branch was explicit — "one auth system," never a second one bolted on
for a subset of users.

Supabase Auth is used only in the separate `client1-production` branch
noted above. The two have never been integrated with each other; a user
account created under one system has no relationship to the other.
Until/unless that branch is reconciled with `main`, custom auth governs
every session, cookie, and permission check in this application.

## What to finish before adopting anything new

Per instruction: the services above that are already chosen but not yet
finished take priority over evaluating or adding any new external
service. In rough order of customer impact:

1. **Resend** (email delivery) — blocked purely on the founder acquiring
   a sending domain and accepting the DNS change; once unblocked, this is
   the highest-leverage integration to finish (every stubbed email —
   verification, reset, invitations — becomes real delivery in one pass).
2. **Stripe** (payments, test-mode) — blocked on the founder creating a
   Stripe account and providing test API keys; unlocks the Client
   Portal's "Pay Now" and real invoice-paid status.
3. **QuickBooks** (Finance read-only sync) and **Gmail/Microsoft
   365 + Google Calendar** (Communications/Meetings) — all three are
   already-designated, not-yet-started OAuth integrations; none has been
   substituted with anything else.
4. File/object storage — no vendor has been chosen yet in
   `08-integration-strategy.md` or elsewhere; this is the one gap above
   that would need a real decision (not just finishing an already-chosen
   integration) before building real avatar/logo/document uploads.

No replacement for any of the above is proposed here, and none should be
adopted before these are either finished or explicitly deprioritized by
the founder.
