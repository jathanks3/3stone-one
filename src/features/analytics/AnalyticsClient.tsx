"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { Download, FileBarChart } from "lucide-react";
import { Tabs } from "@/ui/Tabs";
import { Card } from "@/ui/Card";
import { DataTable, type Column } from "@/ui/DataTable";
import { SearchInput } from "@/ui/SearchInput";
import { AiAction, AiActionRow } from "@/ui/AiAction";
import { Button } from "@/ui/Button";
import { ChartSkeleton } from "@/ui/ChartSkeleton";
import { useToast } from "@/lib/toast";
import { formatCurrency } from "@/lib/utils";
import { JOB_STATUS_LABEL, PIPELINE_STAGES } from "@/server/mock-data";
import { explainPerformanceChange, forecastRevenue, suggestImprovements } from "@/server/ai/capabilities";
import { useIndustry } from "@/lib/industry";
import { getIndustryDataset } from "@/server/mock-data/industries";
import type { IndustryDataset } from "@/types";

const AnalyticsOverviewCharts = dynamic(
  () => import("./AnalyticsOverviewCharts").then((m) => m.AnalyticsOverviewCharts),
  { ssr: false, loading: () => <div className="grid grid-cols-1 gap-4 lg:grid-cols-2"><ChartSkeleton height={200} /><ChartSkeleton height={200} /></div> }
);

interface EntityConfig {
  data: Record<string, unknown>[];
  columns: string[];
}

function getEntities(dataset: IndustryDataset): Record<string, EntityConfig> {
  return {
    Jobs: { data: dataset.jobs as unknown as Record<string, unknown>[], columns: ["name", "client", "status", "value", "dueDate"] },
    Deals: { data: dataset.deals as unknown as Record<string, unknown>[], columns: ["title", "stage", "value", "expectedCloseDate"] },
    Invoices: { data: dataset.invoices as unknown as Record<string, unknown>[], columns: ["number", "client", "amount", "status", "dueDate"] },
    Employees: { data: dataset.employees as unknown as Record<string, unknown>[], columns: ["name", "title", "department", "status"] },
  };
}

type EntityKey = "Jobs" | "Deals" | "Invoices" | "Employees";

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
  const { profile } = useIndustry();
  const dataset = getIndustryDataset(profile.key);
  const stageLabels = dataset.pipelineStageLabels;
  const pipelineData = PIPELINE_STAGES.filter((s) => s.key !== "won" && s.key !== "lost").map((s) => ({
    label: stageLabels?.[s.key] ?? s.label,
    count: dataset.deals.filter((d) => d.stage === s.key).length,
  }));
  const jobStatusData = (["bid", "scheduled", "in_progress", "done"] as const).map((s) => ({
    label: JOB_STATUS_LABEL[s],
    count: dataset.jobs.filter((j) => j.status === s).length,
  }));
  const doneCount = dataset.jobs.filter((j) => j.status === "done").length;
  const completionRate = Math.round((doneCount / dataset.jobs.length) * 100);

  return (
    <div className="flex flex-col gap-5">
      <AnalyticsOverviewCharts
        pipelineData={pipelineData}
        jobStatusData={jobStatusData}
        completionRate={completionRate}
      />

      <Card className="p-5">
        <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-ink-3">AI actions</p>
        <AiActionRow>
          <AiAction label="Explain performance change" run={() => explainPerformanceChange(dataset)} />
          <AiAction label="Forecast revenue" run={() => forecastRevenue(dataset)} />
          <AiAction label="Suggest improvements" run={() => suggestImprovements(dataset)} />
        </AiActionRow>
      </Card>
    </div>
  );
}

function ReportBuilderTab() {
  const { profile } = useIndustry();
  const dataset = getIndustryDataset(profile.key);
  const entities = useMemo(() => getEntities(dataset), [dataset]);
  const [entity, setEntity] = useState<EntityKey>("Jobs");
  const [query, setQuery] = useState("");
  const { showToast } = useToast();
  const config = entities[entity];

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
          {(Object.keys(entities) as EntityKey[]).map((e) => (
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
