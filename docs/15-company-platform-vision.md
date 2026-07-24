# 3Stone AI — Company & Platform Architecture (v1.0)

**Status:** Source of truth for all future architectural decisions across
this codebase, per the founder's explicit instruction. Where this document
and any other doc in this set disagree, this one wins — see "Known
conflicts with existing docs" at the bottom, which lists exactly where that
applies today rather than leaving it implicit.

## Vision

3Stone AI is not a single SaaS product. It's a software company that builds
AI-powered products which help people spend less time managing work and
more time doing what they actually enjoy. The long-term goal is a portfolio
of world-class SaaS products under one company. Every architectural
decision should optimize for adding future products without rewriting the
platform.

```
3Stone AI
│
├── 3Stone One (Flagship)
├── Bet AI
├── Future Product
├── Future Product
└── Future Product
```

3Stone One is the flagship product. **It is not the company.** This
codebase (`3stone-one`) is one product's repository, not 3Stone AI's own
identity — a distinction worth holding onto as more products join the
portfolio.

## Product strategy

**3Stone One (current)** — a business operating system powered by AI, for
small businesses, service businesses, creators, agencies, and local
businesses. The purpose is time back, not software for its own sake: *"Carl
doesn't want software. Carl wants less CEO work, more time painting
cleats."* Everything built here should be justifiable against that.

**Bet AI** — a separate SaaS, sports betting intelligence, its own
subscription business, independent under 3Stone AI. Not a 3Stone One
edition; a different product entirely.

**Future editions of 3Stone One** — Business, Student, Employee,
Healthcare, Nonprofit, and others. These are **editions of the same
product**, not separate SaaS products — they reuse as much architecture as
possible rather than each getting rebuilt. See "Product/Edition/Industry
Profile" below for how this composes with the existing Industry Profile
mechanism.

## Architecture principles

- One company. One platform. Many products.
- Each product may have multiple editions.
- The platform should be capable of managing all current and future
  products — not just 3Stone One.

## Single application philosophy

We are **not** building a Customer App, an Admin App, and a Support App as
separate systems. We **are** building one application — **3Stone One** —
containing both the Customer Workspace (the product a subscribing business
runs their company from) and **3Stone AI** (internal operations, visible
only to the founder and approved staff). One deployment, one database, one
authentication system, role-based access — not three deployments
pretending to be one product.

### Internal Operations is named "3Stone AI," not "Platform"

The internal section is literally labeled **3Stone AI** in the product's
own navigation — not "Platform," not "Admin," not "Operator Console."
Customers never see it and never know it exists. This replaces the
"Platform" naming used in earlier planning in this repo's history; see
"Known conflicts" below.

### Internal navigation

```
3Stone AI
├── Dashboard
├── Products
├── Customers
│   └── Customer 360
├── Revenue
├── Billing
├── Subscriptions
├── Support
├── AI Usage
├── Storage Usage
├── System Health
├── Announcements
├── Feature Flags
├── Audit Logs
├── Legal
├── Staff
├── Roles
├── Invitations
├── Settings
└── Global Search (⌘K / Ctrl+K)
```

### Products section

One of the most important additions relative to earlier planning: the
internal admin must understand **products**, not just customers. A
`Products` list — 3Stone One (Business, and later Student/Employee/etc.),
Bet AI, and future products — where every product eventually has: active
users, subscribers, revenue, churn, feature flags, releases, health, error
tracking, support, documentation. **Bet AI's row exists in this list from
day one, even before any real integration** — per the phased roadmap below,
it starts as a placeholder/manual entry, not a live cross-app data feed,
until Phase 3.

### Customer 360 — the single source of truth

Should answer almost every support question without opening another page.
Everything on it is **read-only**; anything requiring action opens
**Workspace** (a controlled entry into that customer's actual workspace) or
uses **Global Search**. Contents:

- Business profile, owner, industry
- Users, employees
- Subscription: plan, MRR, lifetime revenue, invoices, payment status
- AI usage, storage
- Projects, CRM stats, documents, meetings, automation usage, integrations
- Support history, announcements viewed, feature flags, legal agreements
- Activity timeline, internal notes, health score, recent errors

### Global Search

Every founder tool needs this. ⌘K / Ctrl+K, searching: customers, products,
users, invoices, support, projects, documents, meetings, announcements,
feature flags, audit logs, staff, subscriptions — everything.

### Authorization

**Customer roles:** Owner, Manager, Employee, Client.
**Internal roles:** Founder, Operations, Support.

Customers never see internal navigation. Internal users may enter customer
workspaces through controlled admin tools — **every entry is audited.**
This explicitly authorizes a real "Open Workspace" capability from Customer
360 (previously deferred as a later/optional feature in this repo's
planning) — it's in scope now, with the audit requirement non-negotiable.

## Design philosophy

Every page should answer: does this help us acquire customers, keep
customers, support customers, improve products, or generate recurring
revenue? If a page does none of those, question why it exists.

## Website philosophy

3Stone AI is the company. 3Stone One is the flagship product. Bet AI is
another product. Future products should naturally fit the same ecosystem.
**Remove 3Stone Care** from the website — it isn't a separate business and
doesn't currently solve a distinct customer problem; don't replace it with
another product, keep the website focused on: 3Stone AI — building AI
software that helps people work smarter — Products: 3Stone One, Bet AI —
Coming soon: future products.

## Development principles

Before implementing any feature, ask: does this fit the company vision?
Can it scale to multiple products? Can it support future editions? Can it
be reused? Is it simple enough for one founder to operate? Would removing
it make the product clearer? Prefer simplicity over cleverness.

## Phased roadmap (current priority, strictly sequential)

1. **Launch 3Stone One Business** with real paying customers.
2. **Improve onboarding, support, billing, and customer success.**
3. **Launch Bet AI** using the same operational foundation.
4. **Expand 3Stone One into additional editions** (Student, Employee, ...)
   only after Business has demonstrated product-market fit.
5. **Continue adding SaaS products** under 3Stone AI, leveraging the same
   internal operating platform.

The immediate objective is making 3Stone One Business a successful,
production-ready SaaS with paying customers — while today's architecture
naturally supports tomorrow's products without requiring a rewrite. Choose
the implementation option that best supports a multi-product company while
keeping the day-to-day experience simple for a solo founder; never sacrifice
shipping speed for unnecessary complexity in service of products that don't
exist yet.

## Decisions made (previously flagged conflicts, now resolved)

- **Naming: "Platform" → "3Stone AI."** Earlier planning in this repo (chat
  history, not a committed doc) used "Platform" for the internal section
  and role names `founder | staff_ops | staff_support`. This document
  supersedes that naming: the section is **3Stone AI**, roles are
  **Founder, Operations, Support**.
- **Customer roles: kept at five, not collapsed to four.** Resolved by the
  founder: `05-roles-and-permissions.md`'s five system roles — **Owner,
  Admin, Manager, Member, Client** — stand as-is. Owner and Admin are *not*
  merged, despite this document's illustrative "Owner, Manager, Employee,
  Client" list above. No change made to `05-roles-and-permissions.md`.
- **Product/Edition: built now, as foundational schema, not deferred.**
  Resolved by the founder: `Product` and `Edition` are real tables in
  `prisma/schema.prisma` and documented in
  [03-database-schema.md](03-database-schema.md) as of this revision. Every
  `Workspace` defaults to `productKey: "3stone_one"`, `editionKey:
  "business"` — chosen specifically so this never requires a future
  migration, per the founder's explicit instruction.
- **Customer Lifecycle** (new, added after this document's first draft):
  `CustomerLifecycleStage` is a data-driven lookup table, not a hardcoded
  enum — lead, demo_scheduled, trial, active, power_user, at_risk,
  cancelled, former_customer — `Workspace.lifecycleStageKey` feeds Customer
  360 and internal reporting. See
  [03-database-schema.md](03-database-schema.md).
