import type { IndustryDataset, JobStatus } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { DEMO_JOBS } from "./jobs";
import { DEMO_EMPLOYEES } from "./people";
import { DEMO_INVOICES, PENDING_PURCHASE_REQUESTS } from "./finance";

export { DEMO_WORKSPACE, DEMO_USER } from "./workspace";
export {
  DEMO_EMPLOYEES,
  DEMO_DEPARTMENTS,
  DEMO_ANNOUNCEMENTS,
  WORKSPACE_EMPLOYEES,
  WORKSPACE_DEPARTMENTS,
  WORKSPACE_ANNOUNCEMENTS,
  getEmployeeName,
  getEmployeeInitials,
} from "./people";
export { DEMO_JOBS, WORKSPACE_JOBS, STUDENT_JOBS } from "./jobs";
export { DEMO_TASKS, getTasksForJob } from "./tasks";
export { DEMO_ORGANIZATIONS, WORKSPACE_ORGANIZATIONS } from "./organizations";
export { DEMO_PEOPLE, DEMO_DEALS, WORKSPACE_PEOPLE, WORKSPACE_DEALS, PIPELINE_STAGES, getPersonName } from "./crm";
export { DEMO_DOCUMENTS, WORKSPACE_DOCUMENTS, STUDENT_DOCUMENTS, DOCUMENT_CATEGORY_LABEL } from "./documents";
export {
  DEMO_EMAIL_THREADS,
  DEMO_CALL_NOTES,
  STUDENT_EMAIL_THREADS,
  WORKSPACE_EMAIL_THREADS,
  WORKSPACE_CALL_NOTES,
} from "./communications";
export { DEMO_MEETINGS, WORKSPACE_MEETINGS } from "./meetings";
export { DEMO_ARTICLES, WORKSPACE_ARTICLES, STUDENT_ARTICLES, KNOWLEDGE_CATEGORY_LABEL } from "./knowledge";
export { DEMO_WORKFLOWS, DEMO_WORKFLOW_RUNS } from "./automation";
export { DEMO_INTEGRATIONS, INTEGRATION_CATEGORY_ORDER } from "./integrations";
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
export { DEMO_ACTIVITY, WORKPLACE_ACTIVITY, STUDENT_ACTIVITY, DEMO_NOTIFICATIONS } from "./activity";
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
 * overdue invoices, revenue trend) rolled into one score so the dashboard
 * has one clear number to lead with. Works for any industry's dataset.
 */
export function getBusinessHealthScoreForDataset(dataset: IndustryDataset): BusinessHealth {
  const overdueJobs = dataset.jobs.filter((j) => j.overdue).length;
  const overdueInvoices = dataset.invoices.filter((invoice) => invoice.status === "overdue").length;
  const months = dataset.monthlyChart.months;
  const latest = months[months.length - 1];
  const prior = months[months.length - 2];
  const revenuePct = prior && prior.primary > 0 ? ((latest.primary - prior.primary) / prior.primary) * 100 : 0;
  const revenueBonus = Math.min(Math.max(revenuePct, 0), 8);

  const score = Math.round(Math.max(0, Math.min(100, 100 - overdueJobs * 8 - overdueInvoices * 6 + revenueBonus)));

  const tone: HealthTone = score >= 85 ? "good" : score >= 65 ? "warning" : "critical";
  const label = score >= 85 ? "Strong" : score >= 65 ? "Fair" : "Needs attention";
  // Deliberately edition-neutral - this scores overdue jobs/invoices where
  // those concepts apply (business), but reads exactly the same widget for
  // Workspace (no invoices) and Student (no invoices, "jobs" = assignments
  // via that edition's terminology map) - "clean books"/"revenue" wording
  // would be nonsense on a student account.
  const explanation =
    score >= 85
      ? "Steady progress, with nothing urgent slipping through the cracks."
      : score >= 65
        ? "A few things need attention before they become bigger problems."
        : "Overdue items are piling up and need attention soon.";

  return { score, tone, label, explanation };
}

/**
 * A morning-briefing paragraph generated from the active industry's own
 * data — real overdue jobs, real invoice amounts, real notifications —
 * instead of a single hardcoded sentence.
 *
 * includeOverdueJobs/includeInvoices let the Workspace/Student editions
 * (see src/lib/editionModules.ts) drop sentences that don't fit them -
 * Student has no Finance module at all, and its shared demo job records
 * ("Downtown Lofts" etc.) read as business clients, not assignments.
 */
export function generateMorningBriefing(
  dataset: IndustryDataset,
  options: { includeOverdueJobs?: boolean; includeInvoices?: boolean } = {}
): string {
  const { includeOverdueJobs = true, includeInvoices = true } = options;
  const months = dataset.monthlyChart.months;
  const latest = months[months.length - 1];
  const prior = months[months.length - 2];
  const revenuePct = prior && prior.primary > 0 ? Math.round(((latest.primary - prior.primary) / prior.primary) * 100) : 0;
  const overdueJobs = dataset.jobs.filter((j) => j.overdue);
  const overdueInvoices = dataset.invoices.filter((i) => i.status === "overdue");

  const revenueSentence = `${dataset.monthlyChart.primaryLabel} is ${revenuePct >= 0 ? "up" : "down"} ${Math.abs(revenuePct)}% this month.`;
  const jobsSentence = !includeOverdueJobs
    ? ""
    : overdueJobs.length > 0
      ? ` ${overdueJobs.length} ${overdueJobs.length === 1 ? "item is" : "items are"} behind schedule — ${overdueJobs.map((j) => j.client).join(", ")}.`
      : ` Nothing is behind schedule right now.`;
  const invoiceSentence = !includeInvoices
    ? ""
    : overdueInvoices.length > 0
      ? ` ${overdueInvoices[0].client}'s invoice is overdue at ${formatCurrency(overdueInvoices[0].amount, { compact: true })}.`
      : ` All invoices are current.`;

  return `${revenueSentence}${jobsSentence}${invoiceSentence}`;
}
