import type { Metadata } from "next";
import {
  DEMO_ACTIVITY,
  MONTHLY_FINANCIALS,
  PROFIT_MTD,
  REVENUE_DELTA_PCT,
  REVENUE_MTD,
  getJobStatusCounts,
  getOverdueJobs,
  getPendingPurchaseRequests,
  getUnpaidInvoices,
  getWhosBehind,
} from "@/server/mock-data";
import { BriefingCard } from "@/components/dashboard/BriefingCard";
import { AttentionCard } from "@/components/dashboard/AttentionCard";
import { ChangedTodayCard } from "@/components/dashboard/ChangedTodayCard";
import { WhosBehindCard } from "@/components/dashboard/WhosBehindCard";
import { RevenueTile, ExpensesTile } from "@/components/dashboard/MoneyTiles";
import { RevenueExpenseChart } from "@/components/dashboard/RevenueExpenseChart";
import { JobStatusChart } from "@/components/dashboard/JobStatusChart";

export const metadata: Metadata = {
  title: "Dashboard — 3Stone One",
};

export default function DashboardPage() {
  const overdueJobs = getOverdueJobs();
  const unpaidInvoices = getUnpaidInvoices();
  const whosBehind = getWhosBehind();
  const jobStatusCounts = getJobStatusCounts();
  const expensesMtd = REVENUE_MTD - PROFIT_MTD;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-6 sm:px-6 sm:py-8">
      <div>
        <h1 className="text-[22px] font-bold text-ink-1">Good morning, Alex</h1>
        <p className="text-[14px] text-ink-2">Here&rsquo;s what matters at Acme Construction today.</p>
      </div>

      <BriefingCard />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <AttentionCard
          overdueJobs={overdueJobs}
          unpaidInvoices={unpaidInvoices}
          pendingRequests={getPendingPurchaseRequests()}
        />
        <ChangedTodayCard activity={DEMO_ACTIVITY} />
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <RevenueTile
          revenue={REVENUE_MTD}
          deltaPct={REVENUE_DELTA_PCT}
          trend={MONTHLY_FINANCIALS.map((m) => m.revenue)}
        />
        <ExpensesTile
          expenses={expensesMtd}
          deltaPct={4}
          trend={MONTHLY_FINANCIALS.map((m) => m.expenses)}
        />
        <WhosBehindCard employees={whosBehind} />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <RevenueExpenseChart data={MONTHLY_FINANCIALS} />
        <JobStatusChart data={jobStatusCounts} />
      </div>
    </div>
  );
}
