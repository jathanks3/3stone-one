"use client";

import { Bar, BarChart, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatCurrency } from "@/lib/utils";

const ORDINAL_COLORS = [
  "var(--chart-ordinal-3)",
  "var(--chart-ordinal-2)",
  "var(--chart-ordinal-1)",
  "var(--chart-context)",
];

export function VendorExpenseChart({ data }: { data: { vendor: string; amount: number }[] }) {
  return (
    <div className="h-[220px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 40, left: 0, bottom: 0 }} barCategoryGap={16}>
          <XAxis type="number" hide />
          <YAxis type="category" dataKey="vendor" axisLine={false} tickLine={false} width={110} tick={{ fill: "var(--ink-2)", fontSize: 12.5 }} />
          <Tooltip
            cursor={{ fill: "var(--surface-raised)" }}
            formatter={(value) => formatCurrency(Number(value))}
            contentStyle={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 10, fontSize: 12.5, color: "var(--ink-1)" }}
          />
          <Bar dataKey="amount" radius={[0, 4, 4, 0]} maxBarSize={22}>
            {data.map((entry, index) => (
              <Cell key={entry.vendor} fill={ORDINAL_COLORS[index % ORDINAL_COLORS.length]} />
            ))}
            <LabelList
              dataKey="amount"
              position="right"
              formatter={(v) => formatCurrency(Number(v), { compact: true })}
              style={{ fill: "var(--ink-1)", fontSize: 12.5, fontWeight: 600 }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
