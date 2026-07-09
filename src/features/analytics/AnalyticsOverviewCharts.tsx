"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card } from "@/ui/Card";

interface OverviewChartDatum {
  label: string;
  count: number;
}

export function AnalyticsOverviewCharts({
  pipelineData,
  jobStatusData,
  completionRate,
}: {
  pipelineData: OverviewChartDatum[];
  jobStatusData: OverviewChartDatum[];
  completionRate: number;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card className="p-5">
        <p className="mb-4 text-[13px] font-semibold text-ink-2">Open pipeline by stage</p>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={pipelineData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="var(--line)" />
              <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "var(--ink-3)", fontSize: 11.5 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: "var(--ink-3)", fontSize: 12 }} width={28} allowDecimals={false} />
              <Tooltip
                cursor={{ fill: "var(--surface-raised)" }}
                contentStyle={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 10, fontSize: 12.5, color: "var(--ink-1)" }}
              />
              <Bar dataKey="count" fill="var(--accent)" radius={[4, 4, 0, 0]} maxBarSize={36} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
      <Card className="p-5">
        <p className="mb-4 text-[13px] font-semibold text-ink-2">Job status breakdown</p>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={jobStatusData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="var(--line)" />
              <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "var(--ink-3)", fontSize: 11.5 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: "var(--ink-3)", fontSize: 12 }} width={28} allowDecimals={false} />
              <Tooltip
                cursor={{ fill: "var(--surface-raised)" }}
                contentStyle={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 10, fontSize: 12.5, color: "var(--ink-1)" }}
              />
              <Bar dataKey="count" fill="var(--chart-ordinal-3)" radius={[4, 4, 0, 0]} maxBarSize={36} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="mt-2 text-[12.5px] text-ink-3">{completionRate}% of jobs completed on record.</p>
      </Card>
    </div>
  );
}
