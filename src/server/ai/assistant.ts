import type { AttendanceRecord, IndustryDataset, IndustryTerms, Vendor } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { ATTENDANCE_TODAY, getTodayRecord, getWeeklyHours } from "@/server/mock-data/attendance";

export interface AssistantContext {
  dataset: IndustryDataset;
  attendance: AttendanceRecord[];
  vendors: Vendor[];
  terms: IndustryTerms;
}

const OVERTIME_THRESHOLD_HOURS = 40;

function matchEmployee(query: string, ctx: AssistantContext) {
  const q = query.toLowerCase();
  return ctx.dataset.employees.find(
    (e) =>
      q.includes(e.name.toLowerCase()) ||
      e.name
        .toLowerCase()
        .split(" ")
        .some((part) => part.length > 2 && q.includes(part))
  );
}

function answerAttendance(query: string, ctx: AssistantContext): string {
  const employee = matchEmployee(query, ctx);
  if (employee) {
    const record = getTodayRecord(employee.id, ctx.attendance);
    if (!record || !record.clockIn) {
      return `No — ${employee.name} hasn't clocked in today. ${employee.status === "away" ? `They're marked away, so this is expected.` : `Worth a quick check-in if that's unexpected.`}`;
    }
    if (!record.clockOut) {
      return `Yes — ${employee.name} clocked in at ${record.clockIn} and is still on the clock.`;
    }
    return `Yes — ${employee.name} clocked in at ${record.clockIn} and out at ${record.clockOut} (${record.hoursWorked} hours today).`;
  }
  const missed = ctx.dataset.employees.filter((e) => {
    const record = getTodayRecord(e.id, ctx.attendance);
    return !record || !record.clockIn;
  });
  if (missed.length === 0) return `Everyone on the team has clocked in today.`;
  return `${missed.map((e) => e.name).join(", ")} ${missed.length === 1 ? "hasn't" : "haven't"} clocked in today.`;
}

function answerOvertime(ctx: AssistantContext): string {
  const flagged = ctx.dataset.employees
    .map((e) => ({ e, hours: getWeeklyHours(e.id, ctx.attendance) }))
    .filter(({ hours }) => hours >= OVERTIME_THRESHOLD_HOURS)
    .sort((a, b) => b.hours - a.hours);
  if (flagged.length === 0) return `No one is approaching overtime this week — everyone is under ${OVERTIME_THRESHOLD_HOURS} hours.`;
  return `${flagged.map(({ e, hours }) => `${e.name} (${hours} hrs)`).join(", ")} ${flagged.length === 1 ? "is" : "are"} approaching or over ${OVERTIME_THRESHOLD_HOURS} hours this week.`;
}

function answerDeposits(ctx: AssistantContext): string {
  const withDepositField = ctx.dataset.invoices.filter((i) => i.depositAmount !== undefined);
  if (withDepositField.length > 0) {
    const owed = withDepositField.filter((i) => !i.depositPaid);
    if (owed.length === 0) return `All deposits are collected — nothing outstanding right now.`;
    return `${owed.map((i) => `${i.client} (${formatCurrency(i.depositAmount ?? 0, { compact: true })})`).join(", ")} still ${owed.length === 1 ? "owes" : "owe"} a deposit.`;
  }
  const unpaid = ctx.dataset.invoices.filter((i) => i.status !== "paid");
  if (unpaid.length === 0) return `Every invoice is paid in full — nothing outstanding.`;
  return `No deposit tracking on these invoices yet, but ${unpaid.map((i) => `${i.client} (${formatCurrency(i.amount, { compact: true })})`).join(", ")} ${unpaid.length === 1 ? "has" : "have"} an unpaid balance.`;
}

function answerProfit(ctx: AssistantContext): string {
  const months = ctx.dataset.monthlyChart.months;
  const latest = months[months.length - 1];
  const { primaryLabel, secondaryLabel, unit } = ctx.dataset.monthlyChart;
  if (unit !== "currency") {
    return `${primaryLabel} this month is ${latest.primary} vs. ${secondaryLabel.toLowerCase()} at ${latest.secondary} — this dataset doesn't track a currency profit figure directly.`;
  }
  const net = latest.primary - latest.secondary;
  return `${net >= 0 ? "Profit" : "Loss"} this month is ${formatCurrency(Math.abs(net), { compact: true })} — ${formatCurrency(latest.primary, { compact: true })} in ${primaryLabel.toLowerCase()} against ${formatCurrency(latest.secondary, { compact: true })} in ${secondaryLabel.toLowerCase()}.`;
}

function answerCompareMonths(ctx: AssistantContext): string {
  const months = ctx.dataset.monthlyChart.months;
  if (months.length < 2) return `Not enough monthly history yet to compare.`;
  const [prev, curr] = months.slice(-2);
  const { primaryLabel, unit } = ctx.dataset.monthlyChart;
  const pctChange = prev.primary === 0 ? 0 : Math.round(((curr.primary - prev.primary) / prev.primary) * 100);
  const direction = pctChange >= 0 ? "up" : "down";
  const fmt = (n: number) => (unit === "currency" ? formatCurrency(n, { compact: true }) : `${n}${unit === "percent" ? "%" : ""}`);
  return `${primaryLabel} is ${direction} ${Math.abs(pctChange)}% vs. last month — ${fmt(curr.primary)} in ${curr.month} compared to ${fmt(prev.primary)} in ${prev.month}.`;
}

function answerPrepareUpcoming(ctx: AssistantContext): string {
  const today = new Date(ATTENDANCE_TODAY);
  const upcoming = [...ctx.dataset.jobs]
    .filter((j) => j.status !== "done")
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())[0];
  if (!upcoming) return `Nothing upcoming on the calendar right now.`;
  const daysOut = Math.max(0, Math.round((new Date(upcoming.startDate).getTime() - today.getTime()) / 86400000));
  return `Next up is "${upcoming.name}" for ${upcoming.client}${daysOut <= 1 ? " — coming up very soon" : ` in about ${daysOut} days`}. ${upcoming.description}`;
}

function answerSummarizeToday(ctx: AssistantContext, terms: IndustryTerms): string {
  const overdueJobs = ctx.dataset.jobs.filter((j) => j.overdue);
  const unpaidInvoices = ctx.dataset.invoices.filter((i) => i.status !== "paid");
  const todayNotifications = ctx.dataset.notifications.filter((n) =>
    ["today", "this morning"].includes(n.timestamp.toLowerCase())
  );
  const away = ctx.dataset.employees.filter((e) => e.status === "away");
  const parts = [
    `${todayNotifications.length} update${todayNotifications.length === 1 ? "" : "s"} logged today`,
    `${overdueJobs.length} ${(overdueJobs.length === 1 ? terms.project : terms.projects).toLowerCase()} behind schedule`,
    `${unpaidInvoices.length} unpaid invoice${unpaidInvoices.length === 1 ? "" : "s"}`,
  ];
  if (away.length > 0) parts.push(`${away.map((e) => e.name).join(", ")} out today`);
  return `Today at a glance: ${parts.join(", ")}.`;
}

function answerDraftVendorEmail(ctx: AssistantContext): string {
  if (ctx.vendors.length === 0) return `No vendor list on file to draft to yet.`;
  const names = ctx.vendors.map((v) => v.name).join(", ");
  return `Draft ready: "Subject: Quick update from ${ctx.dataset.orgName}" — addressed to ${names}. Covers upcoming schedule changes and a request to confirm current pricing. Ready to review and send.`;
}

function answerCostReduction(ctx: AssistantContext): string {
  const months = ctx.dataset.monthlyChart.months;
  const first = months[0];
  const last = months[months.length - 1];
  const { secondaryLabel, unit } = ctx.dataset.monthlyChart;
  const seed = ctx.dataset.aiRecommendations[0] ? ` One angle already flagged: ${ctx.dataset.aiRecommendations[0]}` : "";
  if (unit === "currency" && first && last && last.secondary > first.secondary) {
    const pct = Math.round(((last.secondary - first.secondary) / first.secondary) * 100);
    return `${secondaryLabel} is up ${pct}% over the last ${months.length} months — that's the biggest lever right now.${seed}`;
  }
  return `Costs have been stable over the last ${months.length} months — no single line item stands out.${seed}`;
}

function answerAtRisk(ctx: AssistantContext): string {
  const overdue = ctx.dataset.jobs.filter((j) => j.overdue);
  if (overdue.length > 0) {
    return `${overdue.map((j) => `"${j.name}" (${j.client})`).join(", ")} ${overdue.length === 1 ? "is" : "are"} behind schedule and at risk.`;
  }
  const soonest = [...ctx.dataset.jobs]
    .filter((j) => j.status === "bid" || j.status === "scheduled")
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 2);
  if (soonest.length === 0) return `Nothing looks at risk right now — everything is on track.`;
  return `Nothing overdue yet, but keep an eye on ${soonest.map((j) => `"${j.name}"`).join(" and ")} — still unconfirmed with dates coming up.`;
}

function fallbackHelp(ctx: AssistantContext, terms: IndustryTerms): string {
  return [
    `I can help with questions about ${ctx.dataset.orgName} — try things like:`,
    `"Who still owes deposits?" · "How much profit did we make this month?" · "Summarize today's operations" · "Show ${terms.employees.toLowerCase()} approaching overtime" · "Compare this month to last month" · "Which ${terms.projects.toLowerCase()} are at risk?" · "Recommend ways to reduce costs" · "Draft an email to all vendors"`,
  ].join(" ");
}

export function answerQuestion(query: string, ctx: AssistantContext): string {
  const q = query.trim().toLowerCase();
  if (!q) return fallbackHelp(ctx, ctx.terms);

  if (/clock(ed)?\s*in|clocked out|attendance/.test(q)) return answerAttendance(q, ctx);
  if (/overtime/.test(q)) return answerOvertime(ctx);
  if (/deposit/.test(q)) return answerDeposits(ctx);
  if (/profit|how much.*(make|earn)/.test(q)) return answerProfit(ctx);
  if (/compare.*month|month.*(over|vs\.?|versus).*month/.test(q)) return answerCompareMonths(ctx);
  if (/tomorrow|prepare/.test(q)) return answerPrepareUpcoming(ctx);
  if (/summar.*(today|operation)|today.*summar/.test(q)) return answerSummarizeToday(ctx, ctx.terms);
  if (/draft.*(email|message).*vendor|vendor.*(email|message)/.test(q)) return answerDraftVendorEmail(ctx);
  if (/reduce cost|cut cost|save money|lower cost/.test(q)) return answerCostReduction(ctx);
  if (/at risk|which.*risk|risky/.test(q)) return answerAtRisk(ctx);

  return fallbackHelp(ctx, ctx.terms);
}
