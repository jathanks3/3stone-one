"use client";

import { useIndustry } from "@/lib/industry";
import { getIndustryDataset } from "@/server/mock-data/industries";
import { getPendingPurchaseRequests, DEMO_ACTIVITY } from "@/server/mock-data";
import { BriefingCard } from "@/components/dashboard/BriefingCard";
import { AttentionCard } from "@/components/dashboard/AttentionCard";
import { ChangedTodayCard } from "@/components/dashboard/ChangedTodayCard";
import { KpiTile } from "@/ui/KpiTile";
import { RevenueExpenseChartLazy } from "@/components/dashboard/RevenueExpenseChart.lazy";
import { JobStatusChartLazy } from "@/components/dashboard/JobStatusChart.lazy";

export function DashboardClient() {
  const { profile } = useIndustry();
  const dataset = getIndustryDataset(profile.key);
  const overdueJobs = dataset.jobs.filter((j) => j.overdue);
  const unpaidInvoices = dataset.invoices.filter((i) => i.status !== "paid");

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-6 sm:px-6 sm:py-8">
      <div>
        <h1 className="text-[22px] font-bold text-ink-1">Good morning, Alex</h1>
        <p className="text-[14px] text-ink-2">{dataset.greetingSubtitle}</p>
      </div>

      <BriefingCard />

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
