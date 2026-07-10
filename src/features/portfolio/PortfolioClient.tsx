"use client";

import { ArrowRight, Building2 } from "lucide-react";
import { Card } from "@/ui/Card";
import { Badge } from "@/ui/Badge";
import { useIndustry } from "@/lib/industry";
import { useToast } from "@/lib/toast";
import { formatCurrency, cn } from "@/lib/utils";
import { getPortfolioCompanies } from "@/server/mock-data/businesses";

export function PortfolioClient() {
  const { currentBusinessId, setBusinessId } = useIndustry();
  const { showToast } = useToast();
  const companies = getPortfolioCompanies(currentBusinessId);
  const totalRevenue = companies.reduce((sum, c) => sum + c.revenue, 0);
  const totalOverdue = companies.reduce((sum, c) => sum + c.overdueCount, 0);

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
      <h1 className="text-[22px] font-bold text-ink-1">Your Businesses</h1>
      <p className="mt-1 max-w-[640px] text-[14px] text-ink-2">
        One login, every business you own. Switching changes the dashboard, CRM, finance, team, and AI —
        not just the labels.
      </p>

      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="p-4">
          <p className="text-[12.5px] font-medium text-ink-3">Businesses</p>
          <p className="mt-1 text-[22px] font-bold text-ink-1">{companies.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-[12.5px] font-medium text-ink-3">Combined revenue (MTD)</p>
          <p className="mt-1 text-[22px] font-bold text-ink-1">{formatCurrency(totalRevenue, { compact: true })}</p>
        </Card>
        <Card className="p-4">
          <p className="text-[12.5px] font-medium text-ink-3">Needs attention across all</p>
          <p className={cn("mt-1 text-[22px] font-bold", totalOverdue > 0 ? "text-critical" : "text-ink-1")}>
            {totalOverdue}
          </p>
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {companies.map((co) => {
          const isCurrent = co.id === currentBusinessId;
          return (
            <Card key={co.id} className={cn("flex flex-col gap-3 p-5", isCurrent && "border-accent")}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-[9px] bg-accent-wash text-[12px] font-bold text-accent">
                    {co.name.slice(0, 2).toUpperCase()}
                  </span>
                  <div>
                    <p className="text-[14px] font-semibold text-ink-1">{co.name}</p>
                    <p className="text-[11.5px] text-ink-3">{co.industryLabel}</p>
                  </div>
                </div>
                {isCurrent ? <Badge tone="accent">Current</Badge> : null}
              </div>

              <div className="flex items-baseline gap-2">
                <p className="text-[22px] font-bold text-ink-1">{formatCurrency(co.revenue, { compact: true })}</p>
                <span className={cn("text-[12.5px] font-semibold", co.revenueDeltaPct >= 0 ? "text-good" : "text-critical")}>
                  {co.revenueDeltaPct >= 0 ? "▲" : "▼"} {Math.abs(co.revenueDeltaPct)}%
                </span>
              </div>
              <p className="text-[12.5px] text-ink-3">
                {co.overdueCount > 0 ? `${co.overdueCount} item${co.overdueCount === 1 ? "" : "s"} overdue` : "All caught up"}
              </p>

              {!isCurrent ? (
                <button
                  onClick={() => {
                    setBusinessId(co.id);
                    showToast({
                      title: `Switched to ${co.name}`,
                      description: "Dashboard, CRM, finance, team, and AI all switched with it — no logout.",
                    });
                  }}
                  className="mt-1 flex items-center justify-center gap-1.5 rounded-[9px] border border-accent bg-accent px-3 py-2 text-[12.5px] font-semibold text-on-accent hover:opacity-90"
                >
                  Switch to <ArrowRight size={13} />
                </button>
              ) : null}
            </Card>
          );
        })}

        <button
          onClick={() =>
            showToast({
              title: "Add another business",
              description: "Full self-service onboarding for new businesses ships in a later phase.",
            })
          }
          className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-line p-5 text-center text-ink-3 hover:border-line-strong hover:text-ink-2"
        >
          <Building2 size={22} />
          <span className="text-[13px] font-medium">Add another business</span>
        </button>
      </div>
    </div>
  );
}
