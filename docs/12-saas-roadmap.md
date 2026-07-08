# Future SaaS Roadmap

**Revision note (v2):** two things moved out of this document and into v1
scope because they were explicitly requested rather than aspirational —
the Portfolio (multi-business) rollup view and basic white-label
(logo/color swap) now ship in [Phase 10](11-roadmap.md#phase-10--portfolio--white-label-v1-scope--marketplace-data-model).
What remains here is genuinely post-pilot: things worth designing for now
(so v1 doesn't foreclose them) but not worth building before a real paying
customer asks for them.

## Monetization

- **Subscription billing** via Stripe — per-seat and/or per-workspace
  tiers (Free / Pro / Enterprise), gated on `Workspace.plan`
- **Usage-based add-ons** — AI capability calls, workflow automation runs,
  storage, once real costs exist behind those features

## Enterprise readiness

- **Custom roles & permission builder UI** — data model already supports
  it (`Role.workspaceId` nullable)
- **SSO (SAML/OIDC via WorkOS)**
- **Field-level permissions** — if enterprise conversations hit this wall
  (see [13-self-critique.md](13-self-critique.md)), it's next after custom
  roles

## Platform

- **Public API + webhooks** — the `v1`-versioned API and `ApiKey` table
  already exist for this
- **Marketplace storefront UI** — browsing/installing third-party or
  community-built modules, industry templates, automation templates, and
  AI agents. The data model (`MarketplaceListing`/`WorkspaceInstallation`)
  and the module-registry pattern
  ([01-architecture.md §11](01-architecture.md#11-marketplace-extension-points-now-storefront-later))
  ship in v1 specifically so this is a UI layer over existing structure,
  not a re-architecture, when it's built
- **Custom-domain white-label routing** — `clientcompany.com` resolving to
  a workspace via Next.js middleware; the `Branding.customDomain` field
  already exists in v1, this phase is the routing infrastructure and
  domain-verification flow around it
- **Mobile app (React Native)** — reuses `src/types` and the versioned API

## Operations (for 3Stone AI, not the customer)

- **Internal admin/"god mode" panel** — cross-workspace visibility for
  support and product analytics
- **Data export/import tooling** (CSV, direct import from Excel/QuickBooks)
  — lowers switching cost into 3Stone One

## Deliberately not on this list

Anything that would require re-architecting rather than extending — if a
future idea doesn't fit cleanly on top of the Workspace/Industry
Profile/RBAC/service-layer/AI-capability/search-index foundation in this
document set, that's a signal to revisit the foundation itself, not to
bolt the idea on awkwardly.
