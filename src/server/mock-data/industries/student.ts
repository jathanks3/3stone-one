import type { IndustryDataset } from "@/types";
import { DEMO_ORGANIZATIONS } from "../organizations";
import { DEMO_PEOPLE, DEMO_DEALS } from "../crm";
import { DEMO_JOBS } from "../jobs";
import { DEMO_INVOICES } from "../finance";
import { DEMO_EMPLOYEES } from "../people";
import { DEMO_ACTIVITY } from "../activity";

// Demo-only dataset for the Student edition (see
// src/config/industry-profiles/student.ts) — used exclusively by
// /demo?edition=student (see (app)/layout.tsx). Real Student customers'
// dashboards read real data via dashboardService, never this.
// organizations/people/deals/jobs/invoices/employees are never actually
// rendered for this edition (CRM, People, Client Portal, and Finance
// aren't in EDITION_MODULES.student - see src/lib/editionModules.ts),
// but IndustryDataset has no optional fields, so they're populated from
// the same underlying demo entities purely for type completeness.
const assignmentsByStatus = (status: (typeof DEMO_JOBS)[number]["status"]) =>
  DEMO_JOBS.filter((j) => j.status === status).length;
const dueSoonAssignments = DEMO_JOBS.filter((j) => j.overdue);

export const STUDENT_DATASET: IndustryDataset = {
  profileKey: "student",
  orgName: "Jordan Blake — Junior Year",
  greetingSubtitle: "Here's what's due across your assignments and group work today.",
  kpis: [
    {
      key: "assignments_due",
      label: "Assignments Due This Week",
      value: String(DEMO_JOBS.filter((j) => j.status !== "done").length),
      deltaLabel: dueSoonAssignments.length > 0 ? `${dueSoonAssignments.length} due soon` : "Nothing urgent",
      tone: dueSoonAssignments.length > 0 ? "negative" : "positive",
    },
    {
      key: "group_projects",
      label: "Group Projects In Progress",
      value: String(assignmentsByStatus("in_progress")),
      deltaLabel: "Across your classes",
      tone: "neutral",
    },
    {
      key: "study_sessions",
      label: "Study Sessions Scheduled",
      value: "4",
      deltaLabel: "This week",
      tone: "neutral",
    },
  ],
  monthlyChart: {
    title: "Assignments completed vs. assigned — 6 months",
    primaryLabel: "Completed",
    secondaryLabel: "Assigned",
    unit: "count",
    months: [
      { month: "Feb", primary: 5, secondary: 6 },
      { month: "Mar", primary: 7, secondary: 8 },
      { month: "Apr", primary: 6, secondary: 6 },
      { month: "May", primary: 8, secondary: 9 },
      { month: "Jun", primary: 3, secondary: 3 },
      { month: "Jul", primary: 5, secondary: 5 },
    ],
  },
  breakdownChart: {
    title: "Assignment status",
    segments: [
      { label: "Not Started", count: assignmentsByStatus("bid") },
      { label: "Scheduled", count: assignmentsByStatus("scheduled") },
      { label: "In Progress", count: assignmentsByStatus("in_progress") },
      { label: "Submitted", count: assignmentsByStatus("done") },
    ],
  },
  organizations: DEMO_ORGANIZATIONS,
  people: DEMO_PEOPLE,
  deals: DEMO_DEALS,
  jobs: DEMO_JOBS,
  invoices: DEMO_INVOICES,
  employees: DEMO_EMPLOYEES,
  notifications: DEMO_ACTIVITY,
  aiRecommendations: [
    "Your Capstone Proposal draft hasn't been touched in 4 days and is due soon — a short session today keeps it from becoming a scramble.",
    "Two group members haven't checked in on the Marketing 401 project this week — a quick message keeps everyone aligned before the next meeting.",
    "You have 4 study sessions this week — blocking focus time between them tends to make each one more productive.",
  ],
};
