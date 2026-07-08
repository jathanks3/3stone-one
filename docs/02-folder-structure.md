# Folder Structure

Extends BetAI's proven layout (`src/ui`, `src/features`, `src/types`,
`src/services`) rather than inventing a new convention.

**Revision note (v2):** adds Finance, Communications, Meetings, Knowledge
Center, Sites, Portfolio, Client Portal, Report Builder, Marketplace,
Search, and the AI capability registry. Everything from v1 is unchanged.

```
3stone-one/
├── docs/
├── prisma/
│   └── schema.prisma
├── public/
│   └── branding/
├── src/
│   ├── app/
│   │   ├── (marketing)/
│   │   │   ├── login/  register/  forgot-password/
│   │   ├── (app)/                 # internal, behind auth
│   │   │   ├── dashboard/
│   │   │   ├── portfolio/         # NEW — cross-workspace rollup, owners only
│   │   │   ├── crm/
│   │   │   │   ├── leads/ customers/ companies/ pipeline/
│   │   │   ├── projects/
│   │   │   │   ├── kanban/ calendar/ [projectId]/
│   │   │   ├── people/
│   │   │   │   ├── directory/ departments/ roles/ announcements/
│   │   │   ├── communications/    # NEW — email, chat, announcements, call notes
│   │   │   │   ├── inbox/ chat/ calls/
│   │   │   ├── meetings/          # NEW
│   │   │   ├── documents/
│   │   │   ├── knowledge/         # NEW — internal wiki
│   │   │   ├── finance/           # NEW
│   │   │   │   ├── overview/ invoices/ expenses/ purchase-requests/ budgets/
│   │   │   ├── assistant/
│   │   │   ├── automation/
│   │   │   ├── analytics/
│   │   │   │   └── reports/       # NEW — Report Builder
│   │   │   ├── integrations/
│   │   │   ├── activity/
│   │   │   └── settings/
│   │   │       ├── company/ branding/ users/ billing/ api-keys/
│   │   │       ├── industry-profile/
│   │   │       ├── sites/         # NEW
│   │   │       └── marketplace/   # NEW
│   │   ├── (client-portal)/       # NEW — separate layout, Person-authenticated
│   │   │   ├── projects/  documents/  invoices/  messages/
│   │   └── api/
│   │       └── v1/
│   │           ├── crm/ projects/ people/ documents/ automation/
│   │           ├── analytics/ integrations/ workspaces/
│   │           ├── finance/           # NEW
│   │           ├── communications/    # NEW
│   │           ├── meetings/          # NEW
│   │           ├── knowledge/         # NEW
│   │           ├── search/            # NEW — the one endpoint behind ⌘K
│   │           ├── ai/                # NEW — POST /ai/run, one route for every capability
│   │           ├── approvals/         # NEW
│   │           ├── client-portal/     # NEW — Person-scoped, not User-scoped
│   │           └── portfolio/         # NEW
│   │
│   ├── ui/                        # generic design system, incl. new shared pieces:
│   │                               # AiActionButton, ApprovalCard, SearchPalette,
│   │                               # ReportBuilderGrid
│   │
│   ├── features/
│   │   ├── crm/ projects/ people/ documents/ ai-assistant/ automation/
│   │   ├── analytics/ integrations/ settings/
│   │   ├── finance/                # NEW
│   │   ├── communications/         # NEW
│   │   ├── meetings/                # NEW
│   │   ├── knowledge/                # NEW
│   │   ├── client-portal/            # NEW
│   │   ├── portfolio/                # NEW
│   │   └── report-builder/           # NEW
│   │
│   ├── server/
│   │   ├── services/
│   │   │   ├── crmService.ts projectService.ts peopleService.ts
│   │   │   ├── documentService.ts assistantService.ts automationService.ts
│   │   │   ├── integrationService.ts workspaceService.ts
│   │   │   ├── financeService.ts            # NEW
│   │   │   ├── communicationsService.ts     # NEW
│   │   │   ├── meetingService.ts            # NEW
│   │   │   ├── knowledgeService.ts          # NEW
│   │   │   ├── approvalService.ts           # NEW — shared by Finance + Client Portal
│   │   │   ├── searchIndexService.ts        # NEW — called by every service above
│   │   │   ├── clientPortalService.ts       # NEW
│   │   │   └── portfolioService.ts          # NEW
│   │   ├── ai/
│   │   │   ├── capabilities/                # NEW — crm.ts projects.ts documents.ts people.ts analytics.ts
│   │   │   └── registry.ts
│   │   ├── auth/
│   │   └── mock-data/
│   │
│   ├── config/
│   │   ├── industry-profiles/     # default.ts restaurant.ts construction.ts law-firm.ts security.ts
│   │   └── modules/                # NEW — module registry, see 01-architecture.md §11
│   │
│   ├── types/  lib/  stores/
│   └── styles/theme.css
│
├── CLAUDE.md
└── README.md
```

## Rules this layout enforces (unchanged, plus one addition)

- A route handler never contains business logic; a component never calls a
  service or Prisma directly (v1 rules, unchanged).
- Only `src/config/industry-profiles/*` knows industry names exist (v1
  rule, unchanged).
- **New:** only `src/server/services/*` writes to `SearchIndexEntry` and
  `AiActionLog` — and every service that creates/updates/deletes a
  user-facing record is required to do so in the same function, not as an
  afterthought. A service that forgets this doesn't error, it just quietly
  makes its module unsearchable — worth a lint rule or a shared base-service
  helper once more than a couple of services exist, flagged in
  [13-self-critique.md](13-self-critique.md).
