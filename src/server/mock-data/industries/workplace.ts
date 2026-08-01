import type { IndustryDataset } from "@/types";
import { WORKSPACE_ORGANIZATIONS } from "../organizations";
import { WORKSPACE_PEOPLE, WORKSPACE_DEALS } from "../crm";
import { WORKSPACE_JOBS } from "../jobs";
import { DEMO_INVOICES } from "../finance";
import { WORKSPACE_EMPLOYEES } from "../people";
import { WORKPLACE_ACTIVITY } from "../activity";

// Demo-only dataset for the Workspace edition (see
// src/config/industry-profiles/workplace.ts) — used exclusively by
// /demo?edition=workspace (see (app)/layout.tsx). Real Workspace
// customers' dashboards read real data via dashboardService, never this.
// Its own organizations/people/deals/jobs/employees (Harper & Voss
// Consulting) — not reused flagship construction data — since Workspace
// still has CRM/Projects/People/Client Portal and those pages render
// this content directly. DEMO_INVOICES stays a harmless type-completeness
// filler: Finance isn't in this edition (see editionModules.ts) and
// DashboardClient only ever reads dataset.invoices when showFinance is
// true, which is business-edition-only.
const projectsByStatus = (status: (typeof WORKSPACE_JOBS)[number]["status"]) =>
  WORKSPACE_JOBS.filter((j) => j.status === status).length;
const behindScheduleProjects = WORKSPACE_JOBS.filter((j) => j.overdue);

export const WORKPLACE_DATASET: IndustryDataset = {
  profileKey: "workplace",
  orgName: "Harper & Voss Consulting",
  greetingSubtitle: "Here's what your team is working on today.",
  kpis: [
    {
      key: "open_projects",
      label: "Open Projects",
      value: String(WORKSPACE_JOBS.filter((j) => j.status !== "done").length),
      deltaLabel: behindScheduleProjects.length > 0 ? `${behindScheduleProjects.length} behind schedule` : "All on track",
      tone: behindScheduleProjects.length > 0 ? "negative" : "positive",
    },
    {
      key: "team_members",
      label: "Team Members",
      value: String(WORKSPACE_EMPLOYEES.length),
      deltaLabel: "Across every project",
      tone: "neutral",
    },
    {
      key: "meetings_this_week",
      label: "Meetings This Week",
      value: "6",
      deltaLabel: "2 need an agenda",
      tone: "neutral",
    },
  ],
  monthlyChart: {
    title: "Projects completed vs. started — 6 months",
    primaryLabel: "Completed",
    secondaryLabel: "Started",
    unit: "count",
    months: [
      { month: "Feb", primary: 4, secondary: 5 },
      { month: "Mar", primary: 6, secondary: 6 },
      { month: "Apr", primary: 5, secondary: 7 },
      { month: "May", primary: 7, secondary: 6 },
      { month: "Jun", primary: 8, secondary: 8 },
      { month: "Jul", primary: 6, secondary: 5 },
    ],
  },
  breakdownChart: {
    title: "Project status",
    segments: [
      { label: "Planned", count: projectsByStatus("bid") },
      { label: "Scheduled", count: projectsByStatus("scheduled") },
      { label: "In Progress", count: projectsByStatus("in_progress") },
      { label: "Done", count: projectsByStatus("done") },
    ],
  },
  organizations: WORKSPACE_ORGANIZATIONS,
  people: WORKSPACE_PEOPLE,
  deals: WORKSPACE_DEALS,
  jobs: WORKSPACE_JOBS,
  invoices: DEMO_INVOICES,
  employees: WORKSPACE_EMPLOYEES,
  notifications: WORKPLACE_ACTIVITY,
  aiRecommendations: [
    "The Atlas Website Redesign hasn't been updated in 4 days — a quick status check keeps it visible to the rest of the team.",
    "Two meetings this week still have no agenda — adding one now saves time once everyone's in the room.",
    "Jordan Ellis is assigned to 3 active engagements at once — worth rebalancing before one of them slips.",
  ],
};
