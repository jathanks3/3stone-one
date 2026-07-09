import type { IndustryDataset } from "@/types";
import { DEMO_ORGANIZATIONS } from "../organizations";
import { DEMO_PEOPLE, DEMO_DEALS } from "../crm";
import { DEMO_JOBS } from "../jobs";
import { DEMO_INVOICES, MONTHLY_FINANCIALS, REVENUE_MTD, PROFIT_MTD, REVENUE_DELTA_PCT } from "../finance";
import { DEMO_EMPLOYEES } from "../people";
import { DEMO_ACTIVITY } from "../activity";

const expensesMtd = REVENUE_MTD - PROFIT_MTD;
const overdueJobs = DEMO_JOBS.filter((j) => j.overdue);

export const CONSTRUCTION_DATASET: IndustryDataset = {
  profileKey: "construction",
  orgName: "Acme Construction",
  greetingSubtitle: "Here's what matters at Acme Construction today.",
  kpis: [
    {
      key: "revenue_mtd",
      label: "Revenue MTD",
      value: `$${REVENUE_MTD.toLocaleString()}`,
      deltaLabel: `+${REVENUE_DELTA_PCT}% vs last month`,
      tone: "positive",
      trend: MONTHLY_FINANCIALS.map((m) => m.revenue),
    },
    {
      key: "expenses_mtd",
      label: "Expenses MTD",
      value: `$${expensesMtd.toLocaleString()}`,
      deltaLabel: "+4% vs last month",
      tone: "neutral",
      trend: MONTHLY_FINANCIALS.map((m) => m.expenses),
    },
    {
      key: "jobs_behind",
      label: "Jobs Behind Schedule",
      value: String(overdueJobs.length),
      deltaLabel: overdueJobs.map((j) => j.client).join(", ") || "None — on track",
      tone: overdueJobs.length > 0 ? "negative" : "positive",
    },
  ],
  monthlyChart: {
    title: "Revenue vs. expenses — 6 months",
    primaryLabel: "Revenue",
    secondaryLabel: "Expenses",
    unit: "currency",
    months: MONTHLY_FINANCIALS.map((m) => ({ month: m.month, primary: m.revenue, secondary: m.expenses })),
  },
  breakdownChart: {
    title: "Job status breakdown",
    segments: [
      { label: "Bid", count: DEMO_JOBS.filter((j) => j.status === "bid").length },
      { label: "Scheduled", count: DEMO_JOBS.filter((j) => j.status === "scheduled").length },
      { label: "In Progress", count: DEMO_JOBS.filter((j) => j.status === "in_progress").length },
      { label: "Done", count: DEMO_JOBS.filter((j) => j.status === "done").length },
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
    "Bayview Construction Partners has gone quiet for 6 days after their first call — a follow-up today keeps the lead warm.",
    "Smith Co. Renovation is 9 days overdue on its invoice — a short client check-in call usually unsticks payment faster than a second reminder email.",
    "Cash runway is a healthy 42 days — this is a good week to say yes to the Cedar Hills Custom Home bid instead of waiting on it.",
    "Downtown Lofts and Smith Co. are both behind schedule with the same crew (Jane Dorsey) — consider pulling a technician from a completed job to help catch up.",
  ],
};
