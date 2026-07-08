"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, KanbanSquare } from "lucide-react";
import { useIndustry } from "@/lib/industry";
import { Tabs } from "@/ui/Tabs";
import { SearchInput } from "@/ui/SearchInput";
import { DataTable, type Column } from "@/ui/DataTable";
import { KanbanBoard, type KanbanColumn } from "@/ui/KanbanBoard";
import { DetailPanel } from "@/ui/DetailPanel";
import { EmptyState } from "@/ui/EmptyState";
import { Badge } from "@/ui/Badge";
import { AiAction, AiActionRow } from "@/ui/AiAction";
import { cn, formatCurrency } from "@/lib/utils";
import { DEMO_JOBS, JOB_STATUS_LABEL, JOB_STATUS_ORDER, getEmployeeName, getTasksForJob } from "@/server/mock-data";
import { estimateCompletion, findBottlenecks, generateStatusUpdate } from "@/server/ai/capabilities";
import type { Job, JobStatus } from "@/types";

const STATUS_TONE: Record<JobStatus, "neutral" | "accent" | "good"> = {
  bid: "neutral",
  scheduled: "accent",
  in_progress: "accent",
  done: "good",
};

export function ProjectsClient() {
  const { profile } = useIndustry();
  const [jobs, setJobs] = useState<Job[]>(DEMO_JOBS);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <h1 className="text-[22px] font-bold text-ink-1">{profile.terms.projects}</h1>
      <p className="mt-1 text-[14px] text-ink-2">
        Kanban, calendar, and list views for every {profile.terms.project.toLowerCase()}.
      </p>

      <div className="mt-6">
        <Tabs
          tabs={[
            {
              key: "kanban",
              label: "Kanban",
              content: <KanbanTab jobs={jobs} setJobs={setJobs} onSelect={setSelectedJob} />,
            },
            {
              key: "list",
              label: "List",
              content: <ListTab jobs={jobs} onSelect={setSelectedJob} />,
            },
            {
              key: "calendar",
              label: "Calendar",
              content: <CalendarTab jobs={jobs} onSelect={setSelectedJob} />,
            },
          ]}
        />
      </div>

      <DetailPanel
        open={!!selectedJob}
        onClose={() => setSelectedJob(null)}
        title={selectedJob?.name ?? ""}
        subtitle={selectedJob?.client}
      >
        {selectedJob ? (
          <JobDetail job={selectedJob} projectWord={profile.terms.project} />
        ) : null}
      </DetailPanel>
    </div>
  );
}

function KanbanTab({
  jobs,
  setJobs,
  onSelect,
}: {
  jobs: Job[];
  setJobs: (j: Job[]) => void;
  onSelect: (j: Job) => void;
}) {
  const columns: KanbanColumn<Job>[] = JOB_STATUS_ORDER.map((status) => ({
    key: status,
    label: JOB_STATUS_LABEL[status],
    items: jobs.filter((j) => j.status === status),
  }));

  return (
    <KanbanBoard
      columns={columns}
      cardKey={(j) => j.id}
      onMove={(job, toStatus) => {
        setJobs(jobs.map((j) => (j.id === job.id ? { ...j, status: toStatus as JobStatus, overdue: toStatus === "done" ? false : j.overdue } : j)));
      }}
      renderCard={(job) => (
        <button className="w-full text-left" onClick={() => onSelect(job)}>
          <p className="text-[13px] font-semibold leading-snug text-ink-1">{job.name}</p>
          <p className="mt-1 text-[12px] text-ink-3">{job.client}</p>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-[12px] font-medium text-accent">{formatCurrency(job.value, { compact: true })}</span>
            {job.overdue ? <Badge tone="critical">Overdue</Badge> : null}
          </div>
        </button>
      )}
    />
  );
}

function ListTab({ jobs, onSelect }: { jobs: Job[]; onSelect: (j: Job) => void }) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(
    () => jobs.filter((j) => `${j.name} ${j.client}`.toLowerCase().includes(query.toLowerCase())),
    [jobs, query]
  );

  const columns: Column<Job>[] = [
    { key: "name", header: "Name", render: (j) => <span className="font-medium text-ink-1">{j.name}</span> },
    { key: "client", header: "Client", render: (j) => j.client },
    {
      key: "status",
      header: "Status",
      render: (j) => (
        <Badge tone={j.overdue ? "critical" : STATUS_TONE[j.status] === "good" ? "good" : STATUS_TONE[j.status] === "accent" ? "accent" : "neutral"}>
          {j.overdue ? "Overdue" : JOB_STATUS_LABEL[j.status]}
        </Badge>
      ),
    },
    { key: "value", header: "Value", render: (j) => formatCurrency(j.value, { compact: true }) },
    { key: "due", header: "Due", render: (j) => new Date(j.dueDate).toLocaleDateString() },
    { key: "owner", header: "Owner", render: (j) => getEmployeeName(j.ownerId) },
  ];

  return (
    <div className="flex flex-col gap-4">
      <SearchInput value={query} onChange={setQuery} placeholder="Search jobs…" />
      {filtered.length === 0 ? (
        <EmptyState icon={KanbanSquare} title="No matches" description="Try a different search term." />
      ) : (
        <DataTable columns={columns} rows={filtered} rowKey={(j) => j.id} onRowClick={onSelect} />
      )}
    </div>
  );
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function CalendarTab({ jobs, onSelect }: { jobs: Job[]; onSelect: (j: Job) => void }) {
  const [cursor, setCursor] = useState(new Date(2026, 6, 1));
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const jobsByDay = new Map<number, Job[]>();
  jobs.forEach((j) => {
    const d = new Date(j.dueDate);
    if (d.getFullYear() === year && d.getMonth() === month) {
      const list = jobsByDay.get(d.getDate()) ?? [];
      list.push(j);
      jobsByDay.set(d.getDate(), list);
    }
  });

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-[15px] font-semibold text-ink-1">
          {MONTH_NAMES[month]} {year}
        </p>
        <div className="flex gap-1">
          <button
            onClick={() => setCursor(new Date(year, month - 1, 1))}
            className="flex h-8 w-8 items-center justify-center rounded-[8px] border border-line hover:bg-surface-raised"
            aria-label="Previous month"
          >
            <ChevronLeft size={15} />
          </button>
          <button
            onClick={() => setCursor(new Date(year, month + 1, 1))}
            className="flex h-8 w-8 items-center justify-center rounded-[8px] border border-line hover:bg-surface-raised"
            aria-label="Next month"
          >
            <ChevronRight size={15} />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-2xl border border-line bg-line">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="bg-surface-raised py-2 text-center text-[11px] font-semibold text-ink-3">
            {d}
          </div>
        ))}
        {cells.map((day, i) => (
          <div key={i} className={cn("min-h-[92px] bg-surface p-1.5", !day && "bg-bg")}>
            {day ? (
              <>
                <p className="mb-1 text-[11.5px] text-ink-3">{day}</p>
                <div className="flex flex-col gap-1">
                  {(jobsByDay.get(day) ?? []).map((j) => (
                    <button
                      key={j.id}
                      onClick={() => onSelect(j)}
                      className={cn(
                        "truncate rounded-[6px] px-1.5 py-1 text-left text-[11px] font-medium",
                        j.overdue ? "bg-critical-wash text-critical" : "bg-accent-wash text-accent"
                      )}
                    >
                      {j.name}
                    </button>
                  ))}
                </div>
              </>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

function JobDetail({ job, projectWord }: { job: Job; projectWord: string }) {
  const [taskList, setTaskList] = useState(() => getTasksForJob(job.id));

  function toggle(taskId: string) {
    setTaskList((prev) => prev.map((t) => (t.id === taskId ? { ...t, done: !t.done } : t)));
  }

  return (
    <div className="flex flex-col gap-5">
      <p className="text-[13.5px] leading-relaxed text-ink-2">{job.description}</p>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-[10px] border border-line bg-bg p-3">
          <p className="text-[11px] font-medium text-ink-3">Value</p>
          <p className="mt-1 text-[16px] font-bold text-ink-1">{formatCurrency(job.value)}</p>
        </div>
        <div className="rounded-[10px] border border-line bg-bg p-3">
          <p className="text-[11px] font-medium text-ink-3">Owner</p>
          <p className="mt-1 text-[14px] font-semibold text-ink-1">{getEmployeeName(job.ownerId)}</p>
        </div>
      </div>

      <div>
        <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-ink-3">Tasks</p>
        <div className="flex flex-col gap-1.5">
          {taskList.map((t) => (
            <label
              key={t.id}
              className="flex items-center gap-2.5 rounded-[9px] border border-line bg-bg px-3 py-2 text-[13px]"
            >
              <input type="checkbox" checked={t.done} onChange={() => toggle(t.id)} className="h-4 w-4 accent-accent" />
              <span className={cn("flex-1", t.done && "text-ink-3 line-through")}>{t.title}</span>
              <span className="text-[11px] text-ink-3">{getEmployeeName(t.assigneeId)}</span>
            </label>
          ))}
          {taskList.length === 0 ? <p className="text-[13px] text-ink-3">No tasks yet.</p> : null}
        </div>
      </div>

      <div>
        <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-ink-3">AI actions</p>
        <AiActionRow>
          <AiAction label="Estimate completion" run={() => estimateCompletion(job, projectWord)} />
          <AiAction label="Find bottlenecks" run={() => findBottlenecks(job)} />
          <AiAction label="Generate status update" run={() => generateStatusUpdate(job, projectWord)} />
        </AiActionRow>
      </div>
    </div>
  );
}
