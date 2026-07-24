# Production Readiness Checklist

Living document — updated every milestone, per the founder's production
charter. Checked items are verified (built, tested, confirmed against
live infrastructure where applicable), not just "written."

See [18-architecture-inventory.md](18-architecture-inventory.md) for the
full external-service-by-service status (also live and testable at
`/3stone-ai/integrations`, the Founder Integration Center).

## Deployment

- [x] `origin/main` and the live production deployment
      (`https://3stone-one.vercel.app`) are both current as of the
      stack-reconciliation milestone — verified via production smoke
      tests (signup wizard, Settings, Profile, adversarial forged-cookie
      rejection, all passing with zero console errors)
- [x] No test/demo data left in the production database after any
      milestone's verification (checked directly after each one)

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
- [x] Rate limiting on login attempts and password reset requests
      (DB-backed, no new infra — see Authentication section)
- [ ] Input validation library (Zod, per the original architecture docs)
      at any API boundary — validation today is real but hand-written
      per service function, not centralized

## Authentication & Authorization

- [x] Password hashing (scrypt, `node:crypto`, timing-safe comparison)
- [x] Real login path (`loginAction`) — DB-backed, generic error on
      failure, no user-enumeration vector, DB errors logged server-side
      only
- [x] **Session cookies are HMAC-SHA256 signed** (Web Crypto, so the same
      code path runs in proxy.ts's Edge middleware and everywhere else).
      Fixed a real authentication-bypass vulnerability found during this
      milestone's own adversarial testing: the cookie used to be a plain
      JSON blob — httpOnly blocks browser-side JS from reading/writing it,
      but nothing stopped a client from sending an arbitrary raw HTTP
      request with a hand-crafted Cookie header. A forged
      `{isDemo:false,staffRole:"founder"}` cookie granted real founder
      access with no password. Verified fixed: the same forged cookie, and
      a correctly-shaped-but-wrongly-signed one, are both now rejected.
- [x] Session revocation — `User.sessionVersion`, bumped on password
      change/reset, embedded in every session cookie; (app)/layout.tsx,
      3stone-ai/layout.tsx, and requireStaff() all reject a cookie whose
      embedded version no longer matches the database. Verified: a direct
      DB bump of sessionVersion correctly logs out an existing browser
      session (via /logout, not /login — a stale-but-correctly-signed
      cookie still parses as "logged in" to proxy.ts's DB-free Edge check,
      so /login alone would loop).
- [x] Password reset — `/reset-password` (request) and
      `/reset-password/confirm` (real, single-use, 1-hour token), same
      anti-enumeration principle as login. Verified end-to-end including
      old-password-rejected / new-password-works / reused-token-rejected.
- [x] Login history / account security events — `SecurityEvent` rows for
      login, login_failed, password_reset_requested, password_changed.
- [x] Rate limiting — 5 failed logins per 15 minutes blocks further
      attempts (including the correct password) for that account; 3
      password reset requests per hour, then silent no-op. Both keyed on
      a confirmed account, never a submitted email string, so the limiter
      itself never becomes an enumeration vector.
- [x] Demo/real session isolation — `isDemo: boolean`, required, defaults
      to `true` on any ambiguity; `staffRole` structurally stripped from
      any session where `isDemo` is true, regardless of cookie content
- [x] Four-layer authorization for `/3stone-ai/*` (middleware, section
      layout, API guard, navigation) — adversarially tested (a forged
      `{isDemo:true, staffRole:"founder"}` cookie is still denied; so is
      a stale-but-correctly-signed one)
- [x] Tenant isolation — verified end-to-end with real onboarded
      workspaces (team management, settings, customer 360): a real
      session sees only its own workspace's data, never another's, never
      demo's
- [ ] CSRF: mitigated via SameSite=Lax + httpOnly + signed cookies (a
      cross-site POST never carries the session cookie under Lax); no
      separate CSRF token mechanism built, and none has been verified
      necessary for this app's request patterns — worth a second look if
      any route starts accepting cross-site form posts
- [ ] Session expiration/refresh policy beyond the fixed 7-day cookie maxAge

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
| Settings | **Converted** — real Company profile, Team (invitations/roles/removal/ownership transfer), Billing (real Subscription data, no live Stripe); Branding and API Keys tabs from the mock version were dropped rather than half-converted — not yet real, called out below, not silently missing |
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

## Team Management

- [x] Real `Invitation` model — token/expiry/status lifecycle, distinct
      from just creating a `WorkspaceMember` row directly. Invite, resend
      (extends expiry, same token/link), revoke, view pending
      invitations, view active members.
- [x] Role change, remove member (soft — sets `status: "suspended"`,
      preserves history, correctly disappears from the active list),
      ownership transfer (Owner → Admin, target member → Owner).
- [x] Accept flow (`/invite/accept`) — invitee sets a password and is
      added as an active member in one step, then logged straight into
      the workspace. An invitee whose email already has a password
      (already has an account elsewhere) is told to log in and reopen the
      link, rather than half-building a second UI branch for that case.
- [x] Every mutation re-derives workspaceId from the caller's own session
      (never a client-supplied field) and re-checks Owner/Admin
      permission server-side — verified: a second, unrelated workspace's
      owner sees neither another workspace's owner nor its members in
      their own Team tab.
- [ ] Converting a won `SalesProspect` into the inviter isn't wired to
      team invitations either (see Onboarding section) — sales pipeline
      and team invitations are two separate real mechanisms today, never
      fabricated to look connected.

## User Profile

- [x] Edit display name and avatar URL (persisted to `User`).
- [x] Change password from within an authenticated session — re-creates
      the current browser's session with the bumped sessionVersion so the
      acting user stays signed in, while every other session (a different
      browser/device) is invalidated. Verified: old password/other
      sessions rejected, new password works, current browser stays logged
      in.
- [x] Notification preference toggles (workspace events, security
      events) — enforced at write time
      (`notificationService.createNotification` checks preferences before
      creating a row), not a decorative UI toggle with no effect.
- [ ] Email address change — not built (would need its own
      re-verification flow); called out in the UI itself, not silently
      broken.

## Notifications

- [x] Real, in-app, DB-backed (`Notification` model existed in schema;
      nothing read or wrote it before this milestone).
- [x] Wired to real triggers: invitation accepted (notifies the inviter),
      role changed (notifies the affected member), password changed
      (notifies the account owner). Truthful empty state ("No
      notifications yet.") when none exist.
- [x] **Fixed a real demo-data-leak bug** found while building this:
      `NotificationsMenu` rendered `DEMO_NOTIFICATIONS` unconditionally
      for every session — the same class of bug `WorkspaceSwitcher` had
      earlier. Now reads `isDemo` from `IndustryProvider` and fetches real
      data via `/api/notifications` for real sessions.
- [ ] Onboarding-event and workspace-event notification types beyond the
      three wired above (e.g. a notification when a new teammate's first
      login happens) — the framework supports adding these without a
      migration; none exist yet because nothing calls `createNotification`
      for them.

## Billing (Stripe) — fully built, one credential away from live

- [x] Plan tiers reconciled with the marketing site's actual published
      pricing (Hub $99 / Growth $179 / Business OS $279 —
      `src/config/pricing.ts`), replacing the old placeholder
      free/pro/enterprise plan set
- [x] Checkout (subscription mode), Billing Portal, self-provisioning
      Products/Prices (no founder dashboard work needed once a key
      exists), webhook handler (checkout completed, subscription
      created/updated/deleted, invoice paid/payment failed), founder
      pricing override (ad-hoc price, never touches the shared Price
      other customers see)
- [x] Never fabricates a payment or invoice — "Contact us to upgrade"
      shown whenever `STRIPE_SECRET_KEY` isn't configured; empty invoice
      history reads "No invoices yet." rather than sample rows
- [ ] Live Stripe — needs the founder's own Stripe account + test-mode
      secret key + webhook secret (the app self-registers the webhook
      endpoint once the secret key exists)

## Storage (Supabase) — fully built, one credential away from live

- [x] Signed, direct-to-storage uploads for avatars and workspace logos
      (public bucket, permanent URLs) and documents (private bucket,
      signed/expiring URLs, tenant-checked on every access)
- [x] Real Neon metadata for every upload (`UploadedFile`) and audit
      logging (`ActivityLogEntry` — first real writer to that table)
- [x] Tenant isolation enforced entirely in this app's own code, never
      Supabase RLS (Supabase Auth/Postgres are explicitly not adopted)
- [ ] No real Supabase project/credentials exist anywhere in this
      environment — the founder needs to create one (or provide
      existing credentials if one already exists elsewhere) and supply
      `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY`

## Email (Google Workspace) — fully built, one credential away from live

- [x] DNS already real and verified at the domain level (confirmed by
      direct lookup): MX to Google, two google-site-verification TXT
      records, a published DKIM key for `3stoneai.com`
- [x] Every email-triggering flow (verification, password reset, team
      invitations) routes through one abstraction
      (`src/server/services/emailService.ts`) that sends via Google
      Workspace SMTP when configured, or logs + shows the link on-screen
      when not — never fabricates delivery
- [ ] Needs a Google Workspace App Password for the sending mailbox —
      only the founder can generate it (requires 2FA + access to that
      mailbox's Google Account security settings)

## AI — audited, one real bug fixed, abstraction only

- [x] Every AI feature classified: all of `src/server/ai/capabilities.ts`
      and `src/server/ai/assistant.ts` is deterministic automation
      (template/regex logic), not real AI — no LLM call anywhere
- [x] **Fixed a real bug**: the AI Assistant chat widget had no
      demo/real session check and served fabricated answers (from demo
      data) to real customer sessions — now demo-only
- [x] Abstraction created (`src/server/ai/aiProvider.ts`) since no
      approved AI provider key exists in any environment — no
      speculative model wiring done ahead of that

## Founder Integration Center

- [x] `/3stone-ai/integrations` — real, live-computed status for every
      external service (never hardcoded), required env var names
      (never values), last success/error, a "Test connection" button per
      service. Founder manages integrations from the app itself instead
      of checking Vercel or reading docs.

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

- [x] Real Terms of Service / Privacy Policy acceptance flow tied to
      onboarding (`/signup/terms`) — `LegalAcceptance` rows are written
      with a real IP address, verified by querying the row back
- [ ] Marketing site's Terms/Privacy "Last updated" date fixed (still
      computed as `new Date()` on every load — flagged in the earlier
      production-readiness audit, not yet fixed)

## Demo isolation (all currently holding, verified)

- [x] Demo sessions never touch the database
- [x] Demo sessions cannot receive `staffRole` (stripped structurally)
- [x] Demo sessions cannot reach `/3stone-ai/*` (page or API)
- [x] Real sessions never fall back to demo data on any of the 17 modules
