# Roles & Permission Model

**Revision note (v2):** the five system roles and the RBAC shape are
unchanged from v1. This revision adds Finance visibility rules (money
matters get tighter defaults than other modules) and expands what the
Client role can *do*, not just see. New modules (Communications, Meetings,
Knowledge Center) slot into the existing matrix rather than needing new
mechanics.

## Why RBAC, not a custom permission builder, for v1

Unchanged — see original reasoning; custom roles remain a
[SaaS roadmap](12-saas-roadmap.md) item.

## System roles

| Role | Who this is | Can do |
|---|---|---|
| **Owner** | The business owner/founder | Everything, including billing, Finance, and workspace deletion |
| **Admin** | Ops/office manager | Everything except billing and workspace deletion; Finance visibility same as Owner unless explicitly restricted per workspace (see below) |
| **Manager** | Department head, project lead | Full access to their department's people/projects/tasks/budget; no company-wide Finance visibility by default |
| **Member** | Regular employee | Their assigned work + company-wide info; no Finance access by default |
| **Client** | External customer/guest | Zero internal access; scoped, now-interactive access via the [Client Portal](04-navigation-map.md#client-portal-expanded) |

## Permission shape (unchanged)

`(module, action, scope)` — module, `view|create|edit|delete|approve|export|
manage_settings`, `all|department|own|shared`.

## Default permission matrix (v2 — additions in bold)

| Module | Owner | Admin | Manager | Member | Client |
|---|---|---|---|---|---|
| CRM | all | all | department | own | — |
| Projects | all | all | department | own | shared (view + **approve milestones**) |
| People/Employee Portal | all | all | view: all, edit: department | view: all | — |
| **Communications** | all | all | department | own channels + all-company | shared client channel only |
| **Meetings** | all | all | department | own (attendee) | — |
| Documents | all | all | department | own + shared-with-me | shared (view + **upload**) |
| **Knowledge Center** | all | all | view: all, edit: assigned | view: all | — |
| **Finance** | all | all (default) — **can be restricted to Owner-only per workspace in Settings** | **own department's budget only** | — | shared **invoices only (view + pay)** |
| Automation | all | all | view only | — | — |
| Analytics / Report Builder | all | all | department | own | — |
| Integrations | all | all | — | — | — |
| Settings (company/branding/industry/sites) | all | all | — | — | — |
| **Marketplace** | all | all | — | — | — |
| Users & Permissions | all | all | — | — | — |
| Billing | all | — | — | — | — |
| API Keys | all | all | — | — | — |

**Why Finance gets an Owner-only toggle that no other module has:** a
prospective enterprise buyer evaluating this product will ask "can I hide
profit margins from my office manager?" before they ask almost anything
else about permissions. Rather than wait for that conversation to force a
redesign, Finance ships in v1 with one extra switch in Settings
("Restrict Finance to Owner only") that narrows the Admin row above to
match the Manager row. Every other module's matrix is fixed; this one
isn't, because money is the one category where "the default should be more
open" is a genuinely wrong assumption to make on a business owner's behalf.

## Record-level scoping (unchanged, extended)

Department, own, and shared scoping work exactly as in v1. New records
scope the same way without new logic: a `PurchaseRequest`'s `own` scope is
"requested by me," an `ApprovalRequest`'s relevant scope is "I'm the
approver," a `ChatChannel`'s scope is "I'm a member of this channel" — all
resolved by the same `can(user, module, action, record)` helper.

## Client role — from read-only to scoped self-serve

The Client role's default posture is unchanged: sees nothing unless
explicitly shared. What's new is which actions become available once
something *is* shared with them:

| Action | Requires |
|---|---|
| View a Project's progress | Project explicitly shared with this Person |
| Approve a Project Milestone | An open `ApprovalRequest` where this Person is the requester of record |
| Upload a Document | Project (or the Person directly) explicitly shared, `visibility: shared_with_client` |
| Pay an Invoice | Invoice's `personId`/`organizationId` matches this Person/their Organization |
| Message the team | Membership in the one `ChatChannel` with `isClientChannel: true` created for them |

None of these are new permission *mechanics* — they're the same
`(module, action, scope: shared)` triple already defined in v1, applied to
five new actions instead of one (`view`).

## Future: custom roles (SaaS roadmap, not v1)

Unchanged from v1.
