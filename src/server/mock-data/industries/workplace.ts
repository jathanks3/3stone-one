import type { IndustryDataset } from "@/types";
import { DEMO_ORGANIZATIONS } from "../organizations";
import { DEMO_PEOPLE, DEMO_DEALS } from "../crm";
import { DEMO_JOBS } from "../jobs";
import { DEMO_INVOICES } from "../finance";
import { DEMO_EMPLOYEES } from "../people";
import { WORKPLACE_ACTIVITY } from "../activity";

// Demo-only dataset for the Workspace edition (see
// src/config/industry-profiles/workplace.ts) — used exclusively by
// /demo?edition=workspace (see (app)/layout.tsx). Real Workspace
// customers' dashboards read real data via dashboardService, never this.
// Reuses the same underlying organizations/people/deals/jobs/employees
// as the construction dataset, since Workspace still has CRM/Projects/
// People/Client Portal — but the Dashboard's own KPIs/charts and the
// "Recent activity" feed (WORKPLACE_ACTIVITY) are its own content, re-
// themed away from "revenue and expenses" (Finance isn't in this
// edition) toward project/team-of-workers framing.
const projectsByStatus = (status: (typeof DEMO_JOBS)[number]["status"]) =>
  DEMO_JOBS.filter((j) => j.status === status).length;
const behindScheduleProjects = DEMO_JOBS.filter((j) => j.overdue);

export const WORKPLACE_DATASET: IndustryDataset = {
  profileKey: "workplace",
  orgName: "Harper & Voss Consulting",
  greetingSubtitle: "Here's what your team is working on today.",
  kpis: [
    {
      key: "open_projects",
      label: "Open Projects",
      value: String(DEMO_JOBS.filter((j) => j.status !== "done").length),
      deltaLabel: behindScheduleProjects.length > 0 ? `${behindScheduleProjects.length} behind schedule` : "All on track",
      tone: behindScheduleProjects.length > 0 ? "negative" : "positive",
    },
    {
      key: "team_members",
      label: "Team Members",
      value: String(DEMO_EMPLOYEES.length),
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
  organizations: DEMO_ORGANIZATIONS,
  people: DEMO_PEOPLE,
  deals: DEMO_DEALS,
  jobs: DEMO_JOBS,
  invoices: DEMO_INVOICES,
  employees: DEMO_EMPLOYEES,
  notifications: WORKPLACE_ACTIVITY,
  aiRecommendations: [
    "The Downtown Lofts project hasn't been updated in 4 days — a quick status check keeps it visible to the rest of the team.",
    "Two meetings this week still have no agenda — adding one now saves time once everyone's in the room.",
    "Jane Dorsey is assigned to 3 active projects at once — worth rebalancing before one of them slips.",
  ],
};
