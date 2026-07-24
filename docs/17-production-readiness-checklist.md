# Production Readiness Checklist

Living document — updated every milestone, per the founder's production
charter. Checked items are verified (built, tested, confirmed against
live infrastructure where applicable), not just "written."

## Foundation

- [x] Real Postgres database (Neon, `3stone-one-production`, free tier)
- [x] Schema migrated via `prisma migrate deploy` (production-safe workflow)
- [x] Reference data seeded: Products, Editions, Customer Lifecycle stages,
      system Roles, Industry Profiles (real, sourced from existing config)
- [x] DB health check (`/api/health/db`), leaks no credential/infrastructure detail
- [x] `src/server/db.ts` lazy client construction (doesn't break builds
      without a configured database)
- [ ] Neon branches split per Vercel environment (dev/preview/prod
      currently share one database — flagged in docs/16, not yet done)
- [ ] Structured error monitoring (Sentry or equivalent) — currently
      `console.error` only
- [ ] Rate limiting on any endpoint
- [ ] Input validation library (Zod, per the original architecture docs)
      at any API boundary

## Authentication & Authorization

- [x] Password hashing (scrypt, `node:crypto`, timing-safe comparison)
- [x] Real login path (`loginAction`) — DB-backed, generic error on
      failure, no user-enumeration vector, DB errors logged server-side
      only
- [x] Demo/real session isolation — `isDemo: boolean`, required, defaults
      to `true` on any ambiguity; `staffRole` structurally stripped from
      any session where `isDemo` is true, regardless of cookie content
- [x] Four-layer authorization for `/3stone-ai/*` (middleware, section
      layout, API guard, navigation) — adversarially tested (a forged
      `{isDemo:true, staffRole:"founder"}` cookie is still denied)
- [x] Tenant isolation — verified end-to-end with a real onboarded
      workspace: a real session sees only its own workspace, never
      another's, never demo's
- [ ] Password reset / forgot-password flow (currently: founder-run
      script only, no self-serve path, no email infrastructure)
- [ ] Staff invitations flow (`/3stone-ai/invitations` doesn't exist yet)
- [ ] Session expiration/refresh policy beyond the fixed 7-day cookie maxAge
- [ ] Rate limiting on login attempts

## Customer Workspace (17 modules)

| Module | Status |
|---|---|
| Dashboard | **Converted** — real counts (members, projects, unpaid invoices, recent activity), truthful empty state |
| CRM | Mock only — real session sees "not connected yet" placeholder |
| Finance | Mock only — placeholder |
| Projects | Mock only — placeholder |
| People | Mock only — placeholder |
| Communications | Mock only — placeholder |
| Meetings | Mock only — placeholder |
| Documents | Mock only — placeholder |
| Knowledge | Mock only — placeholder |
| Automation | Mock only — placeholder |
| Integrations | Mock only — placeholder |
| Client Portal | Mock only — placeholder |
| Activity | Mock only — placeholder (note: distinct from the real `platform_audit_log_entries`, which is a 3Stone AI internal thing, not this customer-facing log) |
| Settings | Mock only — placeholder |
| Inventory | Mock only — placeholder (no `Product`/inventory schema exists yet at all) |
| Analytics | Mock only — placeholder |
| Portfolio | Mock only — placeholder (this is the multi-business switcher; `WorkspaceSwitcher` in the shared shell already had to be made real-session-aware ahead of Portfolio's own conversion — see below) |

**Correctness guarantee already in place for all 16 unconverted modules:**
a real session never sees another workspace's — or the demo's — data on
any of them, verified for every module in one regression pass. This was
not automatic: the shared `WorkspaceSwitcher` component (used on every
page via `TopBar`) independently looked up mock business data by id and
fell back to `DEMO_BUSINESSES[0]` for any id it didn't recognize — which
was *every* real workspace id. Caught by testing tenant isolation
end-to-end, not by inspection; fixed by making `IndustryProvider` carry an
explicit `isDemo`/`workspaceName`, not by special-casing the switcher.

## Onboarding

Self-service is now the primary path (the founder's onboarding-revision
charter: "the founder does not create customers, the founder monitors
customers"). `src/server/services/onboardingService.ts` is the one real
mechanism — every function is used identically for customer #1 and
customer #20,000, nothing branches on identity. Carl is not a special
case anywhere in this code; he onboards through the exact same `/signup`
flow as every future customer.

- [x] Self-serve signup wizard, all 8 user-facing steps, live at `/signup/*`:
      Sign Up → Verify Email → Password → Workspace → Business Info →
      Industry → Plan → Terms → Enter Workspace — end-to-end tested
      against the live database (9/9 checks pass, zero console errors)
- [x] Email verification — real, single-use, expiring (24h) tokens
      (`EmailVerificationToken`); delivery itself is stubbed (logged +
      shown on-screen, clearly labeled) pending a verified sending domain
      (a DNS change — an explicit approval boundary, not done in passing)
- [x] All 15 onboarding steps persisted as real rows
      (`OnboardingStepDefinition` / `WorkspaceOnboardingProgress`), not an
      enum — percentage is always `completedCount / totalSteps`, never a
      fabricated number
- [x] `workspaceOnboardingService.onboardWorkspace()` retained as the
      founder's **secondary** path (exceptional circumstances, imports,
      enterprise onboarding, support only) — composes the same
      `onboardingService` primitives rather than duplicating logic
- [x] Sales Pipeline (prospects, not yet customers) kept structurally
      separate from Customer Onboarding — `SalesProspect` model, stages
      Lead → Discovery Scheduled → Proposal Draft → Proposal Sent →
      Negotiation → Won/Lost, `/3stone-ai/prospects`
- [ ] Converting a `SalesProspect` to a real `Workspace` on "Won" is not
      wired up yet (the schema's `convertedWorkspaceId` field exists;
      nothing sets it) — today a won prospect and their eventual signup
      are two unconnected facts
- [ ] Carl's actual workspace does not exist yet — no fabricated
      workspace was created for him; he onboards himself through
      `/signup` when he's ready, same as any other customer

## Internal "3Stone AI" section

- [x] Named correctly (`3Stone AI`, not `Platform`), route prefix `/3stone-ai/*`
- [x] Customers list — real data (`customerService.listCustomers()`),
      including onboarding %, current step, workspace health, last
      activity, last login (see "Onboarding pipeline visibility" below);
      truthful empty state ("No customers have signed up yet.")
- [x] Customer 360 (`/3stone-ai/customers/[workspaceId]`) — business
      profile, real onboarding progress bar + full step checklist,
      health badge, blocker banner when one is real
- [x] Sales Pipeline (`/3stone-ai/prospects`) — separate from Customers;
      truthful empty state ("No active prospects.")
- [x] Audit log — real writes, verified by querying rows back after a
      real staff action
- [ ] Revenue, Billing, Subscriptions (schema exists, zero real rows,
      no Stripe integration)
- [ ] Support (ticketing UI; schema exists)
- [ ] AI Usage, Storage Usage (schema exists, nothing populates it)
- [ ] Feature Flags, Announcements (schema exists, no UI)
- [ ] Staff, Roles, Invitations management UI
- [ ] Legal Acceptance tracking UI (schema exists, nothing writes to it —
      no real signup flow with ToS acceptance exists yet either)
- [ ] Global Search (⌘K)
- [ ] System Health

## Onboarding pipeline visibility (founder monitoring)

Every field is a real, already-recorded timestamp or a threshold applied
to one — never an invented score (the founder's onboarding-revision
charter: "Workspace health" / "Any blockers" must be real signals, same
as onboarding percentage). See `customerService.getMonitoringSignals()`.

- [x] Last login — `User.lastLoginAt`, updated at every real (non-demo)
      session creation (`loginAction`, `/signup/verify`); never touched
      by demo sessions
- [x] Last activity — `max(lastLoginAt, most recent
      WorkspaceOnboardingProgress.completedAt, workspace.createdAt)`
- [x] Workspace health — `healthy` / `at_risk` (from the real
      `CustomerLifecycleStage.key`) / `stalled_onboarding` (no onboarding
      progress in 48h while still incomplete) / `cancelled` (from
      `CustomerLifecycleStage.isTerminal`)
- [x] Blocker text — populated only when onboarding is genuinely stalled
      (e.g. "No onboarding progress in over 48 hours — stuck on
      \"Business Information\"."); `null` otherwise, never a placeholder
      string
- [ ] Real support/billing failure signals feeding into health (today the
      only real signal is onboarding staleness + lifecycle stage —
      nothing yet detects a failed payment or an open support ticket,
      since Billing/Support aren't real yet either)

## Legal / Compliance

- [ ] Real Terms of Service / Privacy Policy acceptance flow tied to onboarding
- [ ] `LegalAcceptance` rows actually written anywhere
- [ ] Marketing site's Terms/Privacy "Last updated" date fixed (still
      computed as `new Date()` on every load — flagged in the earlier
      production-readiness audit, not yet fixed)

## Demo isolation (all currently holding, verified)

- [x] Demo sessions never touch the database
- [x] Demo sessions cannot receive `staffRole` (stripped structurally)
- [x] Demo sessions cannot reach `/3stone-ai/*` (page or API)
- [x] Real sessions never fall back to demo data on any of the 17 modules
