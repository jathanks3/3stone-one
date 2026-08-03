"use client";

import Link from "next/link";
import { AlertTriangle, Boxes, Truck } from "lucide-react";
import { useIndustry } from "@/lib/industry";
import { getIndustryDataset } from "@/server/mock-data/industries";
import { getPendingPurchaseRequests, DEMO_ACTIVITY, DEMO_USER } from "@/server/mock-data";
import { BriefingCard } from "@/components/dashboard/BriefingCard";
import { AttentionCard } from "@/components/dashboard/AttentionCard";
import { ChangedTodayCard } from "@/components/dashboard/ChangedTodayCard";
import { KpiTile } from "@/ui/KpiTile";
import { RevenueExpenseChartLazy } from "@/components/dashboard/RevenueExpenseChart.lazy";
import { JobStatusChartLazy } from "@/components/dashboard/JobStatusChart.lazy";
import { Card } from "@/ui/Card";
import { getInventoryDataset, inventoryValue, productStatus } from "@/server/mock-data/inventory";
import { formatCurrency } from "@/lib/utils";
import { DailyDebriefCard } from "@/features/dashboard/DailyDebriefCard";
import type { DailyDebrief, DebriefStatus } from "@/server/services/debriefService";
import type { Job } from "@/types";

function fmtShort(dateIso: string): string {
  const d = new Date(dateIso);
  return Number.isNaN(d.getTime()) ? dateIso : d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// Same score formula as the real Dashboard's debriefService.ts, computed
// from this edition's own mock dataset instead of a live Prisma query -
// this is what keeps the demo's Daily Debrief card looking and behaving
// identically to what a real workspace sees, rather than a different,
// unrelated widget just because the data source differs.
function buildMockDebrief(overdueJobs: Job[], unpaidInvoiceCount: number, allJobs: Job[]): DailyDebrief {
  const score = Math.max(0, 100 - Math.min(60, overdueJobs.length * 12) - Math.min(30, unpaidInvoiceCount * 15));
  const status: DebriefStatus = score >= 85 ? "on_track" : score >= 60 ? "needs_attention" : "behind";
  const attentionItems = overdueJobs.slice(0, 5).map((j) => `${j.name} was due ${fmtShort(j.dueDate)}`);
  const suggestions =
    attentionItems.length === 0
      ? allJobs
          .filter((j) => !j.overdue)
          .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
          .slice(0, 3)
          .map((j) => `Start prepping for "${j.name}" — due ${fmtShort(j.dueDate)}`)
      : [];
  return { score, status, attentionItems, suggestions };
}

export function DashboardClient() {
  const { profile, editionKey } = useIndustry();
  const dataset = getIndustryDataset(profile.key);
  const overdueJobs = dataset.jobs.filter((j) => j.overdue);
  const unpaidInvoices = dataset.invoices.filter((i) => i.status !== "paid");
  const debrief = buildMockDebrief(overdueJobs, unpaidInvoices.length, dataset.jobs);
  const inventory = getInventoryDataset(profile.key);
  const lowStock = inventory.products.filter((p) => ["Low Stock", "Out of Stock"].includes(productStatus(p))).length;
  const pendingOrders = inventory.purchaseOrders.filter((po) => !["Received", "Cancelled"].includes(po.status)).length;

  // Inventory and Finance aren't in every edition (see
  // src/lib/editionModules.ts) - this dashboard used to show both
  // unconditionally for every demo, which was the actual reason the
  // Workspace/Student demos looked like unchanged copies of the
  // flagship: the most visible, top-of-page content ignored edition
  // gating entirely, even though the KPIs/charts/activity feed below it
  // were already correctly themed. Overdue is shown for every edition -
  // Student's own STUDENT_JOBS (see mock-data/jobs.ts) are real
  // assignments now, not reused construction jobs, so "1 Assignment
  // overdue - Senior Capstone" reads correctly.
  const showInventory = editionKey === "business";
  const showFinance = editionKey === "business";
  const showOverdue = true;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-6 sm:px-6 sm:py-8">
      <div>
        <h1 className="text-[22px] font-bold text-ink-1">Good morning, {DEMO_USER.name.split(" ")[0]}</h1>
        <p className="text-[14px] text-ink-2">{dataset.greetingSubtitle}</p>
      </div>

      <BriefingCard />

      {showInventory ? (
        <Link href="/inventory" className="group">
          <Card className="grid gap-3 p-4 transition-colors group-hover:border-line-strong sm:grid-cols-3">
            <div className="flex items-center gap-3"><Boxes size={18} className="text-accent"/><div><p className="text-[11.5px] text-ink-3">Inventory value</p><p className="text-[15px] font-bold">{formatCurrency(inventoryValue(inventory.products))}</p></div></div>
            <div className="flex items-center gap-3"><AlertTriangle size={18} className={lowStock ? "text-warning-ink" : "text-good"}/><div><p className="text-[11.5px] text-ink-3">Stock risk</p><p className="text-[15px] font-bold">{lowStock} reorder{lowStock === 1 ? "" : "s"} needed</p></div></div>
            <div className="flex items-center gap-3"><Truck size={18} className="text-accent"/><div><p className="text-[11.5px] text-ink-3">Inbound</p><p className="text-[15px] font-bold">{pendingOrders} purchase order{pendingOrders === 1 ? "" : "s"}</p></div></div>
          </Card>
        </Link>
      ) : null}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {showOverdue || showFinance ? (
          <AttentionCard
            overdueJobs={overdueJobs}
            unpaidInvoices={unpaidInvoices}
            pendingRequests={getPendingPurchaseRequests()}
            showOverdue={showOverdue}
            showInvoices={showFinance}
            showPurchaseRequests={showFinance}
          />
        ) : null}
        <ChangedTodayCard activity={dataset.notifications.length ? dataset.notifications : DEMO_ACTIVITY} />
      </div>

      <DailyDebriefCard debrief={debrief} isStudent={editionKey === "student"} />

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        {dataset.kpis.map((kpi) => (
          <KpiTile
            key={kpi.key}
            label={kpi.label}
            value={kpi.value}
            deltaLabel={kpi.deltaLabel}
            tone={kpi.tone}
            trend={kpi.trend}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <RevenueExpenseChartLazy
          data={dataset.monthlyChart.months.map((m) => ({ month: m.month, revenue: m.primary, expenses: m.secondary }))}
          title={dataset.monthlyChart.title}
          primaryLabel={dataset.monthlyChart.primaryLabel}
          secondaryLabel={dataset.monthlyChart.secondaryLabel}
        />
        <JobStatusChartLazy data={dataset.breakdownChart.segments} title={dataset.breakdownChart.title} />
      </div>
    </div>
  );
}
