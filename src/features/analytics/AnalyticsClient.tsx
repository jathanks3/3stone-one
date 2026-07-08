"use client";

import { useMemo, useState } from "react";
import { Download, FileBarChart } from "lucide-react";
import { Tabs } from "@/ui/Tabs";
import { Card } from "@/ui/Card";
import { DataTable, type Column } from "@/ui/DataTable";
import { SearchInput } from "@/ui/SearchInput";
import { AiAction, AiActionRow } from "@/ui/AiAction";
import { Button } from "@/ui/Button";
import { useToast } from "@/lib/toast";
import { formatCurrency } from "@/lib/utils";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  DEMO_DEALS,
  DEMO_EMPLOYEES,
  DEMO_INVOICES,
  DEMO_JOBS,
  JOB_STATUS_LABEL,
  PIPELINE_STAGES,
} from "@/server/mock-data";
import { explainPerformanceChange, forecastRevenue, suggestImprovements } from "@/server/ai/capabilities";

interface EntityConfig {
  data: Record<string, unknown>[];
  columns: string[];
}

const ENTITIES: Record<string, EntityConfig> = {
  Jobs: { data: DEMO_JOBS as unknown as Record<string, unknown>[], columns: ["name", "client", "status", "value", "dueDate"] },
  Deals: { data: DEMO_DEALS as unknown as Record<string, unknown>[], columns: ["title", "stage", "value", "expectedCloseDate"] },
  Invoices: { data: DEMO_INVOICES as unknown as Record<string, unknown>[], columns: ["number", "client", "amount", "status", "dueDate"] },
  Employees: { data: DEMO_EMPLOYEES as unknown as Record<string, unknown>[], columns: ["name", "title", "department", "status"] },
};

type EntityKey = keyof typeof ENTITIES;

function toCsv(rows: Record<string, unknown>[], columns: string[]) {
  const header = columns.join(",");
  const body = rows
    .map((row) => columns.map((c) => JSON.stringify(row[c as keyof typeof row] ?? "")).join(","))
    .join("\n");
  return `${header}\n${body}`;
}

export function AnalyticsClient() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <h1 className="text-[22px] font-bold text-ink-1">Analytics &amp; Reports</h1>
      <p className="mt-1 text-[14px] text-ink-2">Cross-module reporting and a custom report builder.</p>

      <div className="mt-6">
        <Tabs
          tabs={[
            { key: "overview", label: "Overview", content: <OverviewTab /> },
            { key: "builder", label: "Report Builder", content: <ReportBuilderTab /> },
          ]}
        />
      </div>
    </div>
  );
}

function OverviewTab() {
  const pipelineData = PIPELINE_STAGES.filter((s) => s.key !== "won" && s.key !== "lost").map((s) => ({
    label: s.label,
    count: DEMO_DEALS.filter((d) => d.stage === s.key).length,
  }));
  const jobStatusData = (["bid", "scheduled", "in_progress", "done"] as const).map((s) => ({
    label: JOB_STATUS_LABEL[s],
    count: DEMO_JOBS.filter((j) => j.status === s).length,
  }));
  const doneCount = DEMO_JOBS.filter((j) => j.status === "done").length;
  const completionRate = Math.round((doneCount / DEMO_JOBS.length) * 100);

  return (
    <div className="flex flex-col gap-5">
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

      <Card className="p-5">
        <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-ink-3">AI actions</p>
        <AiActionRow>
          <AiAction label="Explain performance change" run={explainPerformanceChange} />
          <AiAction label="Forecast revenue" run={forecastRevenue} />
          <AiAction label="Suggest improvements" run={suggestImprovements} />
        </AiActionRow>
      </Card>
    </div>
  );
}

function ReportBuilderTab() {
  const [entity, setEntity] = useState<EntityKey>("Jobs");
  const [query, setQuery] = useState("");
  const { showToast } = useToast();
  const config = ENTITIES[entity];

  const rows = useMemo(() => {
    const q = query.toLowerCase();
    return config.data.filter((row) =>
      config.columns.some((c) => String(row[c] ?? "").toLowerCase().includes(q))
    );
  }, [query, config]);

  const columns: Column<Record<string, unknown>>[] = config.columns.map((c) => ({
    key: c,
    header: c.charAt(0).toUpperCase() + c.slice(1).replace(/([A-Z])/g, " $1"),
    render: (row) => {
      const val = row[c];
      if (c === "value" || c === "amount") return formatCurrency(Number(val));
      return String(val ?? "—");
    },
  }));

  function exportCsv() {
    const csv = toCsv(rows, config.columns);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${entity.toLowerCase()}-report.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast({ title: "CSV downloaded", description: `${entity.toLowerCase()}-report.csv` });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {(Object.keys(ENTITIES) as EntityKey[]).map((e) => (
            <button
              key={e}
              onClick={() => setEntity(e)}
              className={
                "rounded-full border px-3 py-1.5 text-[12.5px] font-medium transition-colors " +
                (entity === e ? "border-accent bg-accent text-on-accent" : "border-line bg-surface text-ink-2 hover:bg-surface-raised")
              }
            >
              {e}
            </button>
          ))}
        </div>
        <SearchInput value={query} onChange={setQuery} placeholder="Filter rows…" />
      </div>

      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(r) => String(r.id ?? r.number ?? r.title ?? r.name ?? "")}
      />

      <div className="flex flex-wrap gap-2">
        <Button variant="primary" onClick={exportCsv}>
          <Download size={14} /> Export CSV
        </Button>
        <Button
          variant="secondary"
          onClick={() =>
            showToast({
              title: "PDF export isn't wired up yet",
              description: "Formatted PDF export ships alongside real accounts — CSV works today.",
            })
          }
        >
          <FileBarChart size={14} /> Export PDF
        </Button>
      </div>
    </div>
  );
}
