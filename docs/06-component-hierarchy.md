# Component Hierarchy

**Revision note (v2):** the three-tier structure is unchanged. This
revision adds four new Tier-1 building blocks that make "AI everywhere,"
"one search," "approvals everywhere," and the Report Builder possible
without one-off code per module — and adds the new Tier-2 modules
(Finance, Communications, Meetings, Knowledge, Client Portal, Portfolio,
Report Builder).

## Three tiers (unchanged)

```
src/ui/                 Tier 1 — generic design system
src/features/<module>/components/    Tier 2 — module-specific, composed from Tier 1
src/app/(app)/**/page.tsx            Tier 3 — pages, compose Tier 2 into a screen
```

**Rule (unchanged):** Tier 1 never imports from `features/`; Tier 2 never
reaches into another module's Tier 2 directly.

## New Tier 1 components this revision requires

```
<AiActionButton capability="crm.summarizeHistory" entityId={lead.id} />
  — one component, used inside every module (CRM, Projects, Documents,
    People, Analytics). Renders the capability's label, calls
    POST /api/v1/ai/run, shows a streaming/loading state, renders the
    structured output in a popover or inline panel. See
    01-architecture.md §5.

<SearchPalette />
  — the ⌘K command palette. Mounted once at the app-shell level (like the
    AI Assistant panel). Groups results by entity type, each group capped
    with "see all in [module]." See 01-architecture.md §6.

<ApprovalCard entityType="project_milestone" entityId={milestone.id} />
  — renders "what's being approved / who asked / approve or reject" from
    an ApprovalRequest, regardless of whether the underlying thing is a
    Project Milestone or a Purchase Request. See 01-architecture.md §7.

<ReportBuilderGrid />
  — entity picker → column picker → filter builder → group-by/chart
    picker → live preview, all driven by one Zod-validated config object
    (the same one saved as ReportDefinition.config and read back to
    re-render a saved report). One component serves every entity type
    a report can be built from — it doesn't get rebuilt per module either.
```

## New Tier 2 modules

```
src/features/
  ├── finance/components/         RevenueOverviewCard, ProfitChart,
  │                                InvoiceTable, PurchaseRequestForm,
  │                                BudgetProgressBar
  ├── communications/components/  UnifiedInbox, ChatChannelView,
  │                                CallNoteForm
  ├── meetings/components/        MeetingAgendaEditor, ActionItemList,
  │                                DecisionLog
  ├── knowledge/components/       ArticleEditor, CategoryBrowser,
  │                                KnowledgeSearchResults
  ├── client-portal/components/   ClientProjectView, ClientInvoiceCard
  │                                (with a "Pay now" Stripe element),
  │                                ClientDocumentUploader
  ├── portfolio/components/       PortfolioCompanyCard, PortfolioRollupChart
  └── report-builder/components/  (wraps <ReportBuilderGrid/> with
                                    entity-specific column/filter definitions)
```

## The app shell (extended)

```
<AppShell>
  <TopBar>          portfolio switcher (if applicable), workspace switcher,
                     <SearchPalette/> trigger, AI panel toggle,
                     notifications, account
  <PrimarySidebar>   nav tree from 04-navigation-map.md, labels resolved via
                     useIndustryLabel()
  <main>             {page content}
  <AiAssistantPanel> unchanged from v1 — persists across navigation
</AppShell>
```

## Label-resolution and schema-driven forms (unchanged from v1)

`useIndustryLabel()` and `<SchemaDrivenForm>` work exactly as before — new
modules (Finance, Communications, Meetings, Knowledge) follow the same
rules: no hardcoded entity names, custom fields render from merged Zod
schemas. Nothing about those two mechanisms needed to change to support
the new modules, which is itself a small piece of evidence the v1
architecture was sound — the additions slotted into existing patterns
rather than requiring new ones (with the four Tier 1 exceptions above,
which are genuinely new mechanisms, not new instances of old ones).
