"use client";

import { Area, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatCurrency } from "@/lib/utils";
import type { MonthlyFinancial } from "@/types";

export function RevenueExpenseChart({
  data,
  title = "Revenue vs. expenses — 6 months",
  primaryLabel = "Revenue",
  secondaryLabel = "Expenses",
}: {
  data: MonthlyFinancial[];
  title?: string;
  primaryLabel?: string;
  secondaryLabel?: string;
}) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-[13px] font-semibold text-ink-2">{title}</h2>
        <div className="flex items-center gap-3 text-[11.5px] text-ink-3">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-accent" />
            {primaryLabel}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-chart-context" />
            {secondaryLabel}
          </span>
        </div>
      </div>
      <div className="mt-4 h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <defs>
              <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.18} />
                <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="var(--line)" />
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "var(--ink-3)", fontSize: 12 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "var(--ink-3)", fontSize: 12 }}
              tickFormatter={(v: number) => formatCurrency(v, { compact: true })}
              width={54}
            />
            <Tooltip
              cursor={{ stroke: "var(--line-strong)" }}
              contentStyle={{
                background: "var(--surface)",
                border: "1px solid var(--line)",
                borderRadius: 10,
                fontSize: 12.5,
                color: "var(--ink-1)",
              }}
              formatter={(value, name) => [formatCurrency(Number(value)), String(name)]}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              name={primaryLabel}
              stroke="var(--accent)"
              strokeWidth={2}
              fill="url(#revenueFill)"
            />
            <Line
              type="monotone"
              dataKey="expenses"
              name={secondaryLabel}
              stroke="var(--chart-context)"
              strokeWidth={2}
              dot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
