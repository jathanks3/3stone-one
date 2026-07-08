# UI Wireframes (structural layouts)

**Revision note (v2):** the Executive Dashboard is redesigned around six
specific questions instead of generic KPI tiles. New wireframes are added
for Global Search, Finance, Communications, Meetings, Knowledge Center,
Report Builder, Portfolio, and the expanded Client Portal. CRM Pipeline,
Project Kanban, Workflow Builder, AI Assistant panel, and Industry Profile
switcher are unchanged from v1 and not repeated here — see the original
sections still in this file below the new material.

Visual design still follows the 3Stone AI brand system (near-black
`#050505` base, Inter typeface, single accent blue `#6e93d6`, generous
spacing scale). The first-run "wow" experience that ties these screens
together into a single opening moment is designed separately in
[14-first-run-experience.md](14-first-run-experience.md) — read that
alongside this one.

## Executive Dashboard — redesigned around six questions

The brief is explicit: this screen must answer, at a glance, *what needs my
attention, what's making me money, what's costing me money, who's behind on
work, what changed today, and what should I do next* — before the user
scrolls or clicks anything.

```
┌───────────────────────────────────────────────────────────────────────┐
│ TopBar: [Portfolio ▾] [Workspace: Acme Construction ▾] [⌘K] [🔔][AI][👤]│
├───────────┬─────────────────────────────────────────────────────────────┤
│ Sidebar   │  ┌─────────────────────────────────────────────────────┐   │
│           │  │ 🤖 Your morning briefing — generated 7:02 AM         │   │
│ Dashboard │  │                                                       │   │
│ CRM       │  │ Revenue is up 12% this week, driven by the Riverside │   │
│ Jobs      │  │ contract closing. Two jobs are overdue — Smith Co.   │   │
│ Staff     │  │ and the downtown remodel — and Jane hasn't logged    │   │
│ Comms     │  │ time on either in 3 days. Cash flow is healthy       │   │
│ Meetings  │  │ (42 days runway at current burn).                    │   │
│ Docs      │  │                                                       │   │
│ Knowledge │  │ [ Draft a follow-up to Smith Co. ]  [ See overdue ]  │   │
│ Finance   │  └─────────────────────────────────────────────────────┘   │
│ Automation│                                                             │
│ Analytics │  What needs my attention          What changed today       │
│ Integrat. │  ┌─────────────────────┐          ┌─────────────────────┐  │
│ Activity  │  │ 2 jobs overdue      │          │ • Riverside signed  │  │
│ Settings  │  │ 3 invoices unpaid   │          │ • 4 new leads       │  │
│           │  │ 1 purchase pending  │          │ • Task completed x9 │  │
│           │  │   your approval     │          │ • New hire started │  │
│           │  └─────────────────────┘          └─────────────────────┘  │
│           │                                                             │
│           │  Making money          Costing money        Who's behind   │
│           │  ┌───────────┐         ┌───────────┐        ┌───────────┐  │
│           │  │ Revenue    │         │ Expenses   │        │ Jane — 2  │  │
│           │  │ $184K ▲12% │         │ $61K ▲4%   │        │ overdue   │  │
│           │  │ Top: River-│         │ Top: Sub-  │        │ Marcus —  │  │
│           │  │ side $40K  │         │ contractor │        │ 1 overdue │  │
│           │  └───────────┘         └───────────┘        └───────────┘  │
│           │                                                             │
│           │  [ Pipeline snapshot chart ]     [ Job status breakdown ]   │
└───────────┴─────────────────────────────────────────────────────────────┘
```

Two things changed structurally from v1, not just visually:

- **The morning briefing is the top of the page, not the AI Assistant
  panel's job.** The brief asks for the AI to "generate executive
  recommendations every morning" — that's a standing artifact (an
  `AiActionLog` entry produced by a scheduled `dashboard.generateBriefing`
  capability, mocked as a realistic pre-written briefing per demo workspace
  in early phases), not something the user has to open a chat panel and
  ask for. The AI Assistant panel still exists for follow-up questions,
  but the first answer is already on the page before anyone asks.
- **Every tile answers exactly one of the six questions, and only one** —
  there's no "misc stats" row. If a future metric doesn't map to one of the
  six questions, it belongs on a module's own page (Finance, Analytics),
  not squeezed onto the dashboard.

## Global Search (⌘K palette)

```
┌───────────────────────────────────────────────────────────┐
│  🔍  acme                                                  │
├─────────────────────────────────────────────────────────────┤
│  CUSTOMERS                                                  │
│  ● Acme Construction — customer since 2024        →         │
│  PROJECTS                                                    │
│  ● Acme — Riverside Remodel — In Progress         →         │
│  INVOICES                                                    │
│  ● INV-1042 — Acme Construction — $12,400 — Paid  →         │
│  MEETINGS                                                    │
│  ● Acme kickoff call — Jul 3                       →         │
│  AI KNOWLEDGE                                                │
│  ● "Summarize history" run on Acme, 2 days ago     →         │
│                                          See all results →   │
└─────────────────────────────────────────────────────────────┘
```

Every group above is a different entity type, one query, one request — see
[01-architecture.md §6](01-architecture.md#6-global-search-one-index-every-entity).
Typing narrows every group simultaneously; arrow keys move between
results across groups, not just within one.

## Finance — Overview

```
┌───────────────────────────────────────────────────────────────────┐
│ Finance                                    [Restrict to Owner ⚙]  │
├───────────────────────────────────────────────────────────────────┤
│ Revenue (MTD)      Profit (MTD)      Cash Flow        Outstanding  │
│ $184,000 ▲12%      $61,200 ▲8%       +$14,300/mo      $22,400      │
│                                        42 days runway   3 invoices  │
├───────────────────────────────────────────────────────────────────┤
│ [ Revenue vs Expense chart, 6mo ]      Vendor Expenses (top 5)     │
│                                          Subcontractors    $18,200 │
│                                          Materials         $9,400  │
├───────────────────────────────────────────────────────────────────┤
│ Purchase Requests awaiting approval                                │
│  • Marcus — $2,400 tools — [Approve] [Reject]                     │
├───────────────────────────────────────────────────────────────────┤
│ Budgets                                                             │
│  Construction dept:  $40,000 budget — $31,200 spent  [████████░░] │
└───────────────────────────────────────────────────────────────────┘
```

The "Restrict to Owner" switch (top right) is the permission toggle from
[05-roles-and-permissions.md](05-roles-and-permissions.md) — visible on
the Finance page itself, not buried in a separate settings screen, because
it's a decision an Owner is likely to make the first time they land here
and notice their Admin can see everything they can.

## Communications Center

```
┌───────────────────────────────────────────────────────────────────┐
│ Communications        [Inbox] [Chat] [Call Notes]                  │
├───────────┬───────────────────────────────────────────────────────┤
│ #general  │  Jane: Riverside client confirmed the walkthrough       │
│ #sales    │  Marcus: sending the updated estimate today             │
│ #ops      │                                                          │
│ Acme      │  ┌──────────────────────────────────────────┐           │
│ (client)  │  │ Ask anything...                       ➤  │           │
│           │  └──────────────────────────────────────────┘           │
└───────────┴───────────────────────────────────────────────────────────┘
```

The client channel ("Acme") in the sidebar above is the same
`ChatChannel` a client sees on their side of the Client Portal — one
thread, two views, not two separate messaging systems.

## Meetings

```
┌───────────────────────────────────────────────────────────────────┐
│ Meetings          [Upcoming] [Past] [Action Items] [Decisions]     │
├───────────────────────────────────────────────────────────────────┤
│ Acme Kickoff Call — Jul 3, 2:00 PM — Jane, Marcus, Acme (client)   │
│  Agenda: scope walkthrough, timeline, budget sign-off              │
│                                                                      │
│  🤖 AI summary: Client approved the timeline; budget sign-off       │
│     pending their CFO. Action items below.                         │
│                                                                      │
│  Action items:  ☐ Send revised estimate — Marcus — due Jul 5       │
│  Decisions:     Timeline approved as proposed                      │
└───────────────────────────────────────────────────────────────────┘
```

## Knowledge Center

```
┌───────────────────────────────────────────────────────────────────┐
│ Knowledge Center                    [🔍 Search all company knowledge]│
├───────────┬───────────────────────────────────────────────────────┤
│ Policies  │  SOPs                                                   │
│ Training  │  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐ │
│ Processes │  │ Job site      │ │ Client         │ │ Invoice       │ │
│ SOPs      │  │ safety check  │ │ onboarding      │ │ collection    │ │
│ Videos    │  └───────────────┘ └───────────────┘ └───────────────┘ │
└───────────┴───────────────────────────────────────────────────────────┘
```

## Report Builder

```
┌───────────────────────────────────────────────────────────────────┐
│ New Report                                                          │
├───────────────────────────────────────────────────────────────────┤
│ 1. Entity: [Projects ▾]                                            │
│ 2. Columns: ☑ Name ☑ Status ☑ Owner ☑ Value  ☐ Site ☐ Due Date     │
│ 3. Filter: Status = "In Progress"  AND  Owner = "Me"               │
│ 4. Group by: [Status ▾]     Chart: [Bar ▾]                         │
├───────────────────────────────────────────────────────────────────┤
│ [ live preview table/chart ]                                        │
├───────────────────────────────────────────────────────────────────┤
│ [ Save Report ]     Export: [ Excel ] [ PDF ] [ CSV ]               │
└───────────────────────────────────────────────────────────────────┘
```

## Portfolio (multi-business rollup)

```
┌───────────────────────────────────────────────────────────────────┐
│ Portfolio — companies you own                                      │
├───────────────────────────────────────────────────────────────────┤
│  Acme Construction        Downtown Cafe Group      Smith Security  │
│  Revenue: $184K ▲12%      Revenue: $92K ▲3%         Revenue: $61K   │
│  2 jobs overdue           All caught up             1 job overdue   │
│  [ Switch to → ]          [ Switch to → ]           [ Switch to → ] │
└───────────────────────────────────────────────────────────────────┘
```

## Client Portal (expanded)

```
┌───────────────────────────────────────────────────────────────────┐
│ Acme Construction — Client Portal              [Message team] [👤] │
├───────────────────────────────────────────────────────────────────┤
│ Projects                                                            │
│  Riverside Remodel — In Progress                                   │
│  Milestone: "Foundation complete" — awaiting your approval         │
│  [ Approve ]  [ Request changes ]                                   │
├───────────────────────────────────────────────────────────────────┤
│ Documents                       [ Upload a file ]                   │
│  Permit-approval.pdf · Site-plan-v2.pdf                            │
├───────────────────────────────────────────────────────────────────┤
│ Invoices                                                             │
│  INV-1042 — $12,400 — Due Jul 15          [ Pay now ]               │
└───────────────────────────────────────────────────────────────────┘
```

## CRM Pipeline, Project Kanban, Workflow Automation Builder, AI Assistant panel, Industry Profile switcher

Unchanged from v1 — see the original wireframes; every principle there
(pipeline stages as data, one generic Kanban component reused across CRM
and Projects, fixed node-catalog automation builder, persistent AI panel,
live-relabeling Industry Profile switcher) still holds and now also
applies to the new modules above (Finance's Purchase Request approval
reuses the same generic approach as everything else in this document).
