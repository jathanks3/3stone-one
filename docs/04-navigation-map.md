# Navigation Map

**Revision note (v2):** adds Finance, Communications, Meetings, Knowledge
Center, Report Builder, Marketplace, Sites, and a Portfolio switcher above
the workspace switcher; expands the Client Portal from a stripped read-only
view into a full self-serve experience. Everything else is unchanged from
v1.

Labels below are canonical/default; an Industry Profile can rename, hide,
or reorder any of these (see [01-architecture.md §4](01-architecture.md#4-industry-adaptability)).

```
Top bar (always visible)
├── Portfolio switcher              (NEW — only shown if the user is Owner
│                                     on more than one Workspace; one click
│                                     rolls up to /portfolio or into any
│                                     owned company, no logout)
├── Workspace switcher
├── Global search (⌘K)              spans every entity type — see below
├── AI Assistant (slide-out panel)
├── Notifications (bell)
└── Account menu

Primary sidebar
├── Dashboard                       (Executive Dashboard — redesigned, see 10-ui-wireframes.md)
├── CRM
│   ├── Leads / Customers / Companies / Pipeline
├── Projects                        → "Jobs" / "Cases" / "Locations" per industry
│   ├── Kanban / Calendar / List / My Tasks
├── People                          (Employee Portal) → "Staff" per industry
│   ├── Directory / Departments / Roles / Announcements
├── Communications                  (NEW — Communications Center)
│   ├── Inbox (email)
│   ├── Chat (internal, channel + direct)
│   └── Call Notes
├── Meetings                        (NEW)
│   ├── Upcoming / Past / Action Items / Decisions
├── Documents
├── Knowledge Center                (NEW — internal wiki)
│   ├── Policies / Training / Processes / SOPs / Videos
├── Finance                         (NEW)
│   ├── Overview (Revenue, Profit, Cash Flow)
│   ├── Invoices
│   ├── Expenses
│   ├── Purchase Requests
│   └── Budgets
├── Automation                      (Workflow Builder)
├── Analytics & Reports
│   └── Report Builder              (NEW)
├── Integrations
├── Activity Log                    (Admin/Owner only)
└── Settings
    ├── Company Profile / Branding / Users & Permissions
    ├── Industry Profile
    ├── Sites                       (NEW — multi-location management)
    ├── Marketplace                 (NEW — installed modules/templates, browse coming soon)
    ├── Billing
    └── API Keys
```

## Screen-level routes (additions only — v1 routes unchanged)

| Route | Purpose | Who sees it |
|---|---|---|
| `/portfolio` | Cross-workspace rollup: revenue, profit, overdue work, headcount, side by side | Users who are Owner on 2+ workspaces |
| `/communications/inbox`, `/chat`, `/calls` | Unified email, internal chat, call notes | All members (scoped by channel membership) |
| `/meetings` | Agenda, action items, AI summaries, decisions | All members (their meetings); Manager+ sees department-wide |
| `/knowledge` | Company wiki — policies, training, SOPs, video | All members (view); Admin/Owner (edit) |
| `/finance/*` | Revenue, profit, invoices, expenses, purchase requests, budgets | Owner/Admin full; Manager sees their department's budget only — see [05-roles-and-permissions.md](05-roles-and-permissions.md) |
| `/analytics/reports` | Report Builder — build, save, export | Admin/Owner/Manager |
| `/settings/sites` | Manage physical locations | Admin/Owner |
| `/settings/marketplace` | Installed modules/templates (storefront browsing is [SaaS roadmap](12-saas-roadmap.md)) | Admin/Owner |

## Client Portal (expanded)

The v1 Client Portal was read-only. This revision makes it a real
self-serve surface, still fully separate from the internal app (a `Person`
with `personType: "client"` authenticates here, never a `User`):

```
Client portal (scoped to what's explicitly shared with this Person)
├── Projects           view progress + approve milestones
│                       (via ApprovalRequest — see 01-architecture.md §7)
├── Documents           view shared files + upload their own
├── Invoices             view + pay (Stripe) — see 08-integration-strategy.md
└── Messages             a dedicated ChatChannel (isClientChannel: true)
                          with their internal point of contact
```

Nothing here breaks the original scoping rule: a client sees only records
explicitly shared with them, by default sees nothing. What's new is that
"seeing" now includes "acting" — approving, uploading, and paying — each
of which is its own explicit permission (see
[05-roles-and-permissions.md](05-roles-and-permissions.md)), not an
implicit side effect of being able to view.
