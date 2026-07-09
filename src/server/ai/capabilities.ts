import type { Deal, DocumentFile, Employee, IndustryDataset, Job, Meeting, Person } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { getTasksForJob } from "@/server/mock-data/tasks";
import { DEMO_DEALS } from "@/server/mock-data/crm";
import { getEmployeeName } from "@/server/mock-data/people";

// ---------------- CRM ----------------

export function summarizeCustomerHistory(person: Person, orgName: string | null): string {
  const deals = DEMO_DEALS.filter((d) => d.personId === person.id);
  const won = deals.filter((d) => d.stage === "won");
  const wonValue = won.reduce((sum, d) => sum + d.value, 0);
  const orgPart = orgName ? ` at ${orgName}` : "";
  if (won.length > 0) {
    return `${person.firstName} ${person.lastName}${orgPart} has been a customer since ${new Date(person.createdAt).getFullYear()} — ${won.length} closed deal${won.length === 1 ? "" : "s"} worth ${formatCurrency(wonValue, { compact: true })} total. Last contact was ${person.lastContact.toLowerCase()}. No open complaints on file.`;
  }
  return `${person.firstName} ${person.lastName}${orgPart} is currently a lead, first contacted ${new Date(person.createdAt).toLocaleDateString()}. Last contact was ${person.lastContact.toLowerCase()}, with ${deals.length} open deal${deals.length === 1 ? "" : "s"} in the pipeline.`;
}

export function draftProposal(person: Person, orgName: string | null, deal?: Deal): string {
  const target = orgName ?? `${person.firstName} ${person.lastName}`;
  const value = deal ? formatCurrency(deal.value, { compact: true }) : "a scope-appropriate";
  return `Draft ready: "${target} — Project Proposal." Pricing structured around ${value} based on similar recently-won engagements. Includes a two-option scope (standard / expanded) and a 3-week response window. Ready to review and send.`;
}

export function predictCustomerHealth(person: Person): string {
  const deals = DEMO_DEALS.filter((d) => d.personId === person.id);
  const won = deals.filter((d) => d.stage === "won").length;
  const score = Math.min(98, 60 + won * 12 + (person.personType === "customer" ? 10 : 0));
  const trend = won > 0 ? "trending up" : "early stage — not enough history yet to trend";
  return `Health score: ${score}/100 — ${trend}. Driven mainly by ${won > 0 ? "on-time payment history and repeat business" : "responsiveness in early conversations"}.`;
}

// ---------------- Projects ----------------

export function estimateCompletion(job: Job, projectWord: string): string {
  const tasks = getTasksForJob(job.id);
  const done = tasks.filter((t) => t.done).length;
  const pct = tasks.length ? Math.round((done / tasks.length) * 100) : 0;
  const due = new Date(job.dueDate);
  const today = new Date("2026-07-07");
  const daysLeft = Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  const pace = pct >= 70 ? "ahead of" : pct >= 40 ? "on track for" : "behind";
  return `${done} of ${tasks.length} tasks complete (${pct}%). At the current pace, this ${projectWord.toLowerCase()} is ${pace} its ${daysLeft >= 0 ? `${daysLeft}-day-out` : "past-due"} deadline of ${due.toLocaleDateString()}.`;
}

export function findBottlenecks(job: Job): string {
  const tasks = getTasksForJob(job.id).filter((t) => !t.done);
  if (tasks.length === 0) return "No open tasks — nothing is blocking this one right now.";
  const oldest = tasks[0];
  return `"${oldest.title}" is the longest-open task on this job, assigned to ${getEmployeeName(oldest.assigneeId)}, due ${new Date(oldest.dueDate).toLocaleDateString()}. ${tasks.length - 1} other task${tasks.length - 1 === 1 ? "" : "s"} still open.`;
}

export function generateStatusUpdate(job: Job, projectWord: string): string {
  const tasks = getTasksForJob(job.id);
  const done = tasks.filter((t) => t.done).length;
  return `Draft update: "${job.name} — ${done}/${tasks.length} tasks complete. ${job.overdue ? "Currently past the target date; " : "On track; "}next milestone due ${new Date(job.dueDate).toLocaleDateString()}." Ready to send to ${job.client} about this ${projectWord.toLowerCase()}.`;
}

// ---------------- Documents ----------------

export function summarizeDocument(doc: DocumentFile): string {
  const sizeMb = (doc.sizeKb / 1024).toFixed(1);
  return `${doc.category === "contract" ? "Contract" : doc.category === "permit" ? "Permit" : doc.category === "plan" ? "Plan set" : doc.category === "photo" ? "Photo set" : doc.category === "invoice" ? "Invoice" : "Report"} (${sizeMb >= "1.0" ? `${sizeMb} MB` : `${doc.sizeKb} KB`}), uploaded ${new Date(doc.uploadedAt).toLocaleDateString()} by ${getEmployeeName(doc.uploadedById)}. No unusual terms detected — standard formatting for this document type.`;
}

export function rewriteDocument(doc: DocumentFile): string {
  return `Plain-English rewrite of "${doc.name}" drafted — removed boilerplate language, shortened by roughly 40%, and highlighted the sections most relevant to the client. Ready to share.`;
}

export function extractActionItems(doc: DocumentFile): string {
  const items: Record<string, string> = {
    contract: "Countersign and return by the date specified; confirm deposit due date.",
    permit: "Schedule the required inspection before proceeding to the next phase.",
    plan: "Confirm dimensions with the client before ordering materials.",
    photo: "None — informational record only.",
    invoice: "Confirm payment terms match the signed contract.",
    report: "Review findings with the department lead.",
  };
  return `1 action item found: "${items[doc.category]}"`;
}

// ---------------- People ----------------

export function identifyBurnoutSignals(employees: Employee[]): string {
  const flagged = employees.filter((e) => (e.overtimeHours ?? 0) >= 8 || e.overdueCount >= 2);
  if (flagged.length === 0) return "No burnout signals detected across the team this week.";
  const person = flagged[0];
  return `${person.name} has logged ${person.overtimeHours ?? 0} hours of overtime this week across ${person.overdueCount} overdue item${person.overdueCount === 1 ? "" : "s"} — flagged for a manager check-in.`;
}

export function recommendStaffing(jobs: Job[], employees: Employee[]): string {
  const active = jobs.filter((j) => j.status === "in_progress" || j.status === "scheduled");
  const available = employees.find((e) => e.status === "active" && e.overdueCount === 0 && e.department === "Field");
  if (!active.length || !available) return "Staffing looks balanced across current jobs.";
  return `${active[0].name} could use extra hands over the next two weeks — ${available.name} is available and has no overdue work.`;
}

// ---------------- Finance ----------------

export function explainRevenueTrend(dataset: IndustryDataset): string {
  const months = dataset.monthlyChart.months;
  const latest = months[months.length - 1];
  const prior = months[months.length - 2];
  if (!prior || prior.primary === 0) return `${dataset.monthlyChart.primaryLabel} is holding steady this month — not enough history yet to call a trend.`;
  const pct = Math.round(((latest.primary - prior.primary) / prior.primary) * 100);
  const topJob = [...dataset.jobs].sort((a, b) => b.value - a.value)[0];
  return `${dataset.monthlyChart.primaryLabel} is ${pct >= 0 ? "up" : "down"} ${Math.abs(pct)}% vs. last month${topJob ? `, with "${topJob.name}" (${formatCurrency(topJob.value, { compact: true })}) as the single biggest driver` : ""} — not broad-based growth across every client yet.`;
}

export function cashFlowWarning(dataset: IndustryDataset): string {
  const overdueInvoices = dataset.invoices.filter((i) => i.status === "overdue");
  if (overdueInvoices.length === 0) return `Cash flow looks healthy — no overdue invoices on the books right now.`;
  const worst = overdueInvoices[0];
  return `${overdueInvoices.length} invoice${overdueInvoices.length === 1 ? " is" : "s are"} overdue, led by ${worst.client} at ${formatCurrency(worst.amount, { compact: true })} — collecting that one would meaningfully improve this month's cash position.`;
}

export function invoiceInsights(dataset: IndustryDataset): string {
  const unpaid = dataset.invoices.filter((i) => i.status !== "paid");
  if (unpaid.length === 0) return `Every invoice is paid in full — nothing outstanding right now.`;
  const total = unpaid.reduce((sum, i) => sum + i.amount, 0);
  const worst = unpaid.find((i) => i.status === "overdue") ?? unpaid[0];
  return `${unpaid.length} invoice${unpaid.length === 1 ? " is" : "s are"} outstanding, totaling ${formatCurrency(total, { compact: true })}. ${worst.client}'s ${worst.number} (${worst.status}) is worth a personal follow-up rather than another automated reminder.`;
}

// ---------------- Analytics ----------------

export function explainPerformanceChange(dataset: IndustryDataset): string {
  const won = dataset.deals.filter((d) => d.stage === "won").sort((a, b) => b.value - a.value).slice(0, 2);
  if (won.length === 0) return `No closed deals yet this period to attribute growth to — worth watching next quarter.`;
  return `Recent growth came from ${won.map((d) => `"${d.title}"`).join(" and ")}, not an increase in average deal size or lead volume — worth watching whether growth broadens next quarter.`;
}

export function forecastRevenue(dataset: IndustryDataset): string {
  const openPipeline = dataset.deals.filter((d) => d.stage === "proposal" || d.stage === "negotiation");
  const pipelineValue = openPipeline.reduce((sum, d) => sum + d.value, 0);
  if (openPipeline.length === 0) return `Pipeline is thin right now — no proposal or negotiation-stage deals to forecast from.`;
  const low = Math.round((pipelineValue * 0.55) / 1000) * 1000;
  const high = Math.round((pipelineValue * 0.75) / 1000) * 1000;
  return `At the current pipeline conversion rate, next period's revenue is projected at ${formatCurrency(low, { compact: true })}–${formatCurrency(high, { compact: true })}, assuming ${openPipeline.map((d) => `"${d.title}"`).join(" and ")} close as expected.`;
}

export function suggestImprovements(dataset: IndustryDataset): string {
  const stalled = dataset.deals.filter((d) => d.stage !== "won" && d.stage !== "lost");
  if (stalled.length === 0) return `Pipeline is clean right now — nothing stalled to flag.`;
  const stalledValue = stalled.reduce((sum, d) => sum + d.value, 0);
  return `${stalled.length} deal${stalled.length === 1 ? "" : "s"} (${stalled.map((d) => d.title).join(", ")}) ${stalled.length === 1 ? "has" : "have"} sat open for a while — following up could move an estimated ${formatCurrency(stalledValue, { compact: true })} in stalled pipeline forward.`;
}

// ---------------- Meetings ----------------

export function generateAgenda(meeting: Meeting): string {
  return `Suggested agenda based on the attendee list and recent activity: ${meeting.agenda.slice(0, 3).join("; ")}${meeting.agenda.length > 3 ? "; and " + (meeting.agenda.length - 3) + " more" : ""}.`;
}

export function summarizeMeeting(meeting: Meeting): string {
  if (meeting.summary) return meeting.summary;
  return `This meeting hasn't happened yet — a summary will generate automatically once it's marked complete, based on the agenda and any notes added.`;
}
