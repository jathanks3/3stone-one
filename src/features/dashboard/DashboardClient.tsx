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

export function DashboardClient() {
  const { profile } = useIndustry();
  const dataset = getIndustryDataset(profile.key);
  const overdueJobs = dataset.jobs.filter((j) => j.overdue);
  const unpaidInvoices = dataset.invoices.filter((i) => i.status !== "paid");
  const inventory = getInventoryDataset(profile.key);
  const lowStock = inventory.products.filter((p) => ["Low Stock", "Out of Stock"].includes(productStatus(p))).length;
  const pendingOrders = inventory.purchaseOrders.filter((po) => !["Received", "Cancelled"].includes(po.status)).length;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-6 sm:px-6 sm:py-8">
      <div>
        <h1 className="text-[22px] font-bold text-ink-1">Good morning, {DEMO_USER.name.split(" ")[0]}</h1>
        <p className="text-[14px] text-ink-2">{dataset.greetingSubtitle}</p>
      </div>

      <BriefingCard />

      <Link href="/inventory" className="group">
        <Card className="grid gap-3 p-4 transition-colors group-hover:border-line-strong sm:grid-cols-3">
          <div className="flex items-center gap-3"><Boxes size={18} className="text-accent"/><div><p className="text-[11.5px] text-ink-3">Inventory value</p><p className="text-[15px] font-bold">{formatCurrency(inventoryValue(inventory.products))}</p></div></div>
          <div className="flex items-center gap-3"><AlertTriangle size={18} className={lowStock ? "text-warning-ink" : "text-good"}/><div><p className="text-[11.5px] text-ink-3">Stock risk</p><p className="text-[15px] font-bold">{lowStock} reorder{lowStock === 1 ? "" : "s"} needed</p></div></div>
          <div className="flex items-center gap-3"><Truck size={18} className="text-accent"/><div><p className="text-[11.5px] text-ink-3">Inbound</p><p className="text-[15px] font-bold">{pendingOrders} purchase order{pendingOrders === 1 ? "" : "s"}</p></div></div>
        </Card>
      </Link>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <AttentionCard
          overdueJobs={overdueJobs}
          unpaidInvoices={unpaidInvoices}
          pendingRequests={getPendingPurchaseRequests()}
        />
        <ChangedTodayCard activity={dataset.notifications.length ? dataset.notifications : DEMO_ACTIVITY} />
      </div>

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
