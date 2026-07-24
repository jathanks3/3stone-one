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

- [x] `workspaceOnboardingService.onboardWorkspace()` — the one real path,
      used identically for every workspace (no special-casing)
- [x] Script entry point (`prisma/scripts/onboard-workspace.ts`) — today's
      caller, until a self-serve form exists
- [ ] Self-serve signup form (calls the same service function)
- [ ] Email verification
- [ ] Carl's actual workspace (blocked on his real business details — see
      milestone report)

## Internal "3Stone AI" section

- [x] Named correctly (`3Stone AI`, not `Platform`), route prefix `/3stone-ai/*`
- [x] Customers list — real data (`customerService.listCustomers()`)
- [x] Audit log — real writes, verified by querying rows back after a
      real staff action
- [ ] Customer 360 (single-customer deep view)
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
