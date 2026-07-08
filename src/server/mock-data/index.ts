import type { JobStatus } from "@/types";
import { DEMO_JOBS } from "./jobs";
import { DEMO_EMPLOYEES } from "./people";
import { DEMO_INVOICES, CASH_RUNWAY_DAYS, REVENUE_DELTA_PCT, PENDING_PURCHASE_REQUESTS } from "./finance";

export { DEMO_WORKSPACE, DEMO_USER } from "./workspace";
export { DEMO_EMPLOYEES, DEMO_DEPARTMENTS, DEMO_ANNOUNCEMENTS, getEmployeeName, getEmployeeInitials } from "./people";
export { DEMO_JOBS } from "./jobs";
export { DEMO_TASKS, getTasksForJob } from "./tasks";
export { DEMO_ORGANIZATIONS } from "./organizations";
export { DEMO_PEOPLE, DEMO_DEALS, PIPELINE_STAGES, getPersonName } from "./crm";
export { DEMO_DOCUMENTS, DOCUMENT_CATEGORY_LABEL } from "./documents";
export {
  DEMO_EMAIL_THREADS,
  DEMO_CHAT_CHANNELS,
  DEMO_CHAT_MESSAGES,
  DEMO_CALL_NOTES,
} from "./communications";
export { DEMO_MEETINGS } from "./meetings";
export { DEMO_ARTICLES, KNOWLEDGE_CATEGORY_LABEL } from "./knowledge";
export { DEMO_WORKFLOWS, DEMO_WORKFLOW_RUNS } from "./automation";
export { DEMO_INTEGRATIONS, INTEGRATION_CATEGORY_ORDER } from "./integrations";
export { DEMO_PORTFOLIO } from "./portfolio";
export { DEMO_API_KEYS, COMPANY_PROFILE, BILLING } from "./settings";
export {
  REVENUE_MTD,
  REVENUE_DELTA_PCT,
  PROFIT_MTD,
  PROFIT_DELTA_PCT,
  CASH_FLOW_MONTHLY,
  CASH_RUNWAY_DAYS,
  MONTHLY_FINANCIALS,
  DEMO_INVOICES,
  DEMO_VENDORS,
  VENDOR_EXPENSES,
  PENDING_PURCHASE_REQUESTS,
  BUDGETS,
  BUDGET_CONSTRUCTION,
} from "./finance";
export { DEMO_ACTIVITY, DEMO_NOTIFICATIONS } from "./activity";
export { MORNING_BRIEFING } from "./briefing";

export const JOB_STATUS_ORDER: JobStatus[] = ["bid", "scheduled", "in_progress", "done"];

export const JOB_STATUS_LABEL: Record<JobStatus, string> = {
  bid: "Bid",
  scheduled: "Scheduled",
  in_progress: "In Progress",
  done: "Done",
};

export function getJobStatusCounts() {
  return JOB_STATUS_ORDER.map((status) => ({
    status,
    label: JOB_STATUS_LABEL[status],
    count: DEMO_JOBS.filter((job) => job.status === status).length,
  }));
}

export function getOverdueJobs() {
  return DEMO_JOBS.filter((job) => job.overdue);
}

export function getPendingPurchaseRequests() {
  return PENDING_PURCHASE_REQUESTS.filter((request) => request.status === "pending");
}

export function getUnpaidInvoices() {
  return DEMO_INVOICES.filter((invoice) => invoice.status !== "paid");
}

export function getWhosBehind() {
  return DEMO_EMPLOYEES.filter((employee) => employee.overdueCount > 0).sort(
    (a, b) => b.overdueCount - a.overdueCount
  );
}

export type HealthTone = "good" | "warning" | "critical";

export interface BusinessHealth {
  score: number;
  tone: HealthTone;
  label: string;
  explanation: string;
}

/**
 * A single derived "how's the business doing" figure — not a separate data
 * source, just the same numbers already on the dashboard (overdue jobs,
 * overdue invoices, revenue trend, cash runway) rolled into one score so the
 * dashboard has one clear number to lead with.
 */
export function getBusinessHealthScore(): BusinessHealth {
  const overdueJobs = getOverdueJobs().length;
  const overdueInvoices = DEMO_INVOICES.filter((invoice) => invoice.status === "overdue").length;
  const revenueBonus = Math.min(REVENUE_DELTA_PCT, 8);
  const runwayBonus = CASH_RUNWAY_DAYS >= 30 ? 3 : 0;

  const score = Math.max(
    0,
    Math.min(100, 100 - overdueJobs * 8 - overdueInvoices * 6 + revenueBonus + runwayBonus)
  );

  const tone: HealthTone = score >= 85 ? "good" : score >= 65 ? "warning" : "critical";
  const label = score >= 85 ? "Strong" : score >= 65 ? "Fair" : "Needs attention";
  const explanation =
    score >= 85
      ? "Revenue growth and healthy cash flow are outweighing a couple of overdue jobs."
      : score >= 65
        ? "Keep an eye on overdue work — it's starting to offset otherwise solid growth."
        : "Overdue work and cash flow need attention before this trend continues.";

  return { score, tone, label, explanation };
}
