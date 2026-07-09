"use client";

import { Bar, BarChart, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const ORDINAL_COLORS = [
  "var(--chart-ordinal-1)",
  "var(--chart-ordinal-2)",
  "var(--chart-ordinal-3)",
  "var(--chart-ordinal-4)",
];

export function JobStatusChart({
  data,
  title = "Job status breakdown",
}: {
  data: { label: string; count: number }[];
  title?: string;
}) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-5">
      <h2 className="text-[13px] font-semibold text-ink-2">{title}</h2>
      <div className="mt-4 h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 0, right: 28, left: 0, bottom: 0 }}
            barCategoryGap={16}
          >
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="label"
              axisLine={false}
              tickLine={false}
              width={92}
              tick={{ fill: "var(--ink-2)", fontSize: 12.5 }}
            />
            <Tooltip
              cursor={{ fill: "var(--surface-raised)" }}
              contentStyle={{
                background: "var(--surface)",
                border: "1px solid var(--line)",
                borderRadius: 10,
                fontSize: 12.5,
                color: "var(--ink-1)",
              }}
            />
            <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={22}>
              {data.map((entry, index) => (
                <Cell key={entry.label} fill={ORDINAL_COLORS[index % ORDINAL_COLORS.length]} />
              ))}
              <LabelList
                dataKey="count"
                position="right"
                style={{ fill: "var(--ink-1)", fontSize: 12.5, fontWeight: 600 }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
