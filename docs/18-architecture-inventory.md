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

Live, testable status for every row below is also visible from inside
the app itself at `/3stone-ai/integrations` (the Founder Integration
Center, founder-only) — this document is the narrative record; that
page is the always-current, no-hardcoded-status source, with a "Test
connection" button per service and required env var names (never
values) shown.

## Inventory

| Service | Category | Status | Notes |
|---|---|---|---|
| **Neon** (Postgres) | Database | **Connected** | Real project, migrated via `prisma migrate deploy` (9 migrations, all applied), pooled + unpooled connection strings set in Vercel (Production/Preview/Development) and locally. Every real (non-demo) data path in the app reads/writes this database. Live-tested via the Founder Integration Center's "Test connection" (`SELECT 1`). |
| **Vercel** | Hosting / env management | **Connected, deployed** | Project linked (`3-stone-ai/3stone-one`); no Git integration (deploys are triggered by `vercel deploy --prod`, not push-to-deploy). `origin/main` and the live production deployment are both current as of this milestone — verified via production smoke tests against `https://3stone-one.vercel.app`. |
| Custom auth (scrypt password hashing + HMAC-signed session cookies) | Authentication | **Connected** | Signed cookies (fixed a real forgeable-cookie vulnerability), session revocation via `sessionVersion`, password reset, login-attempt rate limiting, login history. No third-party auth provider involved. See "Conflicts" below. |
| **Stripe** | Payments | **Built, missing credentials** | Full integration complete: Checkout, Billing Portal, self-provisioning Products/Prices, webhook handler (subscription sync, invoice sync, payment status, failed-payment handling), founder-pricing override. Plan tiers reconciled with the marketing site's actual published pricing (Hub $99 / Growth $179 / Business OS $279 — see `src/config/pricing.ts`). No `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` in any environment — the one remaining founder action. |
| **Supabase (Storage only)** | Storage | **Built, missing credentials** | Full integration complete: signed direct-to-storage uploads, public bucket for avatars/logos (permanent URLs), private bucket for documents (signed, expiring, tenant-checked downloads), real Neon metadata (`UploadedFile`), audit logging (`ActivityLogEntry`). No real Supabase project/credentials exist anywhere in this environment (verified: no `.env` values, no CLI session; the `client1-production` worktree's `supabase/` directory is unconfigured setup instructions, not a live project) — never migrates auth or the database. |
| **Google Workspace** | Business email | **Built, missing credentials** | Corrects an earlier, wrong assumption (Resend) — Google Workspace is the actual company mailbox. DNS is already real and verified at the domain level (confirmed by direct lookup): `3stoneai.com` has an MX record to Google, two `google-site-verification` TXT records, and a published DKIM key. `emailService.ts` sends via Google Workspace SMTP (nodemailer, App Password auth) when configured; every email-triggering flow (verification, reset, invitations) already routes through it. Missing only `GOOGLE_WORKSPACE_SMTP_USER` / `GOOGLE_WORKSPACE_SMTP_APP_PASSWORD` — an App Password only the founder can generate. |
| **QuickBooks** | Accounting | **Not started** | Designated in [08-integration-strategy.md](08-integration-strategy.md) for Finance's read-only Revenue/Profit/Invoice sync (3Stone One never writes accounting entries back — see [01-architecture.md §8](01-architecture.md#8-finance-decision-support-not-a-ledger)). No OAuth app, no SDK. Finance module itself is still mock end-to-end. |
| **Gmail / Microsoft 365** | Email provider (Communications module) | **Not started** | Designated in 08-integration-strategy.md to populate real `EmailMessage` rows — distinct from Google Workspace-as-company-mailbox above (this is reading a *customer's* email, not sending 3Stone One's own). No OAuth app, no SDK. Communications module is still mock. |
| **Google Calendar / Microsoft 365** | Calendar (Meetings module) | **Not started** | Designated in 08-integration-strategy.md for `Meeting.calendarEventId` two-way sync. No OAuth app, no SDK. Meetings module is still mock. |
| AI provider (Anthropic) | AI / LLM | **Abstraction only, no key** | Every function in `src/server/ai/capabilities.ts` and `src/server/ai/assistant.ts` is deterministic automation (template strings, regex/keyword matching), not real AI — audited and confirmed this milestone. No `ANTHROPIC_API_KEY`/`OPENAI_API_KEY` in any environment, so per the founder's charter only the abstraction was built (`src/server/ai/aiProvider.ts`) — no speculative model wiring. A real bug was found and fixed in the same audit: the AI Assistant chat widget had no demo/real gate at all and served fabricated answers to real customer sessions; it's now demo-only. |
| Full-text search | Search | **Partially connected — not a third-party service** | `SearchIndexEntry.searchVector` (generated tsvector column + GIN index) already exists and works at the database level, built on Neon Postgres itself — no external search service (Algolia etc.) is or should be involved. What's missing is the write-path and the ⌘K UI, not a new service to adopt. |
| Structured error monitoring (Sentry or equivalent) | Observability | **Not connected** | Flagged as a known gap. Currently `console.error` only, visible in Vercel's own log aggregation. |
| Redis / Vercel KV / Upstash | Rate limiting store | **Not adopted (deliberate)** | A DB-backed limiter (counts recent `SecurityEvent`/`PasswordResetToken` rows) solved the actual problem without new infra — an in-memory counter would do nothing across separate serverless invocations. Not a gap; a decision. |
| The in-app "Integrations" page (customer-facing, `/integrations`) | — | **Demo fiction, not real status** | `src/server/mock-data/integrations.ts` hardcodes several as `status: "connected"` (QuickBooks, Stripe, Slack) for the demo experience only — a hypothetical future customer's own third-party connections, not a claim about 3Stone AI's own infrastructure. Never reachable by a real session (still `NotYetConnected`, Priority 2 work). Not to be confused with the Founder Integration Center below, which is the real, live-checked status page. |
| Founder Integration Center (`/3stone-ai/integrations`) | Internal tooling | **Connected** | New this milestone — founder-only page showing every row above with live-computed status (never hardcoded), required env var names (never values), last success/error, and a "Test connection" button per service. |

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

## What's left to finish before adopting anything new

Stripe, Supabase Storage, and Google Workspace email are now fully
built in code — every one of them is blocked on exactly one thing: a
credential only the founder can generate. None require further
engineering to "finish integrating"; see the Founder Actions in the
latest milestone report for the exact steps. Still genuinely
not-started (real, scoped engineering work, not a credential):

1. **QuickBooks** (Finance read-only sync) and **Gmail/Microsoft
   365 + Google Calendar** (Communications/Meetings) — already-designated
   OAuth integrations with no code written yet, because the modules that
   would consume them (Finance, Communications, Meetings) are still mock.
2. Structured error monitoring (Sentry or equivalent).

No replacement for any of the above is proposed here, and none should be
adopted before these are either finished or explicitly deprioritized by
the founder.
