"use client";

import { useMemo, useState, useTransition } from "react";
import { ChevronLeft, ChevronRight, KanbanSquare, Plus } from "lucide-react";
import { useIndustry } from "@/lib/industry";
import { Tabs } from "@/ui/Tabs";
import { SearchInput } from "@/ui/SearchInput";
import { DataTable, type Column } from "@/ui/DataTable";
import { KanbanBoard, type KanbanColumn } from "@/ui/KanbanBoard";
import { DetailPanel } from "@/ui/DetailPanel";
import { EmptyState } from "@/ui/EmptyState";
import { Badge } from "@/ui/Badge";
import { Button } from "@/ui/Button";
import { cn } from "@/lib/utils";
import { useToast } from "@/lib/toast";
import { JOB_STATUS_LABEL } from "@/server/mock-data";
import {
  createProjectAction,
  createTaskAction,
  deleteProjectAction,
  deleteTaskAction,
  toggleTaskDoneAction,
  updateProjectStatusAction,
} from "@/app/(app)/projects/actions";
import type { ProjectRow, ProjectStatusKey } from "@/server/services/projectService";

// Duplicated from projectService.ts (not re-imported) - that file also
// pulls in the Prisma/pg client, which would otherwise leak an
// unresolvable server-only "pg"/"node:net" dependency into this client
// component's browser bundle. Every other server-only value this file
// needs comes in as a type-only import instead, which TypeScript erases
// entirely at compile time.
const PROJECT_STATUS_ORDER: ProjectStatusKey[] = ["bid", "scheduled", "in_progress", "done"];

const STATUS_TONE: Record<ProjectStatusKey, "neutral" | "accent" | "good"> = {
  bid: "neutral",
  scheduled: "accent",
  in_progress: "accent",
  done: "good",
};

export function RealProjectsClient({ initialProjects }: { initialProjects: ProjectRow[] }) {
  const { profile } = useIndustry();
  const [projects, setProjects] = useState<ProjectRow[]>(initialProjects);
  const [selected, setSelected] = useState<ProjectRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { showToast } = useToast();

  function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await createProjectAction({}, form);
      if (result.error || !result.id) return showToast({ title: "Couldn't create project", description: result.error ?? "Something went wrong." });
      setProjects((prev) => [
        {
          id: result.id!,
          name: String(form.get("name")),
          description: String(form.get("description") || "") || null,
          statusKey: "bid",
          ownerId: null,
          ownerName: "You",
          organizationId: null,
          organizationName: null,
          startDate: new Date(),
          dueDate: form.get("dueDate") ? new Date(String(form.get("dueDate"))) : null,
          tasks: [],
        },
        ...prev,
      ]);
      setCreating(false);
    });
  }

  function moveProject(project: ProjectRow, toStatus: string) {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("projectId", project.id);
      fd.set("statusKey", toStatus);
      const result = await updateProjectStatusAction({}, fd);
      if (result.error) return showToast({ title: "Couldn't update status", description: result.error });
      setProjects((prev) => prev.map((p) => (p.id === project.id ? { ...p, statusKey: toStatus } : p)));
    });
  }

  function refreshProject(updated: ProjectRow) {
    setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    setSelected(updated);
  }

  function removeProject(project: ProjectRow) {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("projectId", project.id);
      const result = await deleteProjectAction({}, fd);
      if (result.error) return showToast({ title: "Couldn't delete", description: result.error });
      setProjects((prev) => prev.filter((p) => p.id !== project.id));
      setSelected(null);
    });
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-bold text-ink-1">{profile.terms.projects}</h1>
          <p className="mt-1 text-[14px] text-ink-2">Kanban, calendar, and list views for every {profile.terms.project.toLowerCase()}.</p>
        </div>
        <Button variant="primary" onClick={() => setCreating(true)}>
          <Plus size={14} /> New {profile.terms.project.toLowerCase()}
        </Button>
      </div>

      {projects.length === 0 ? (
        <div className="mt-8">
          <EmptyState icon={KanbanSquare} title={`No ${profile.terms.projects.toLowerCase()} yet`} description={`Create your first ${profile.terms.project.toLowerCase()} to get started.`} />
        </div>
      ) : (
        <div className="mt-6">
          <Tabs
            tabs={[
              { key: "kanban", label: "Kanban", content: <KanbanTab projects={projects} onMove={moveProject} onSelect={setSelected} /> },
              { key: "list", label: "List", content: <ListTab projects={projects} onSelect={setSelected} /> },
              { key: "calendar", label: "Calendar", content: <CalendarTab projects={projects} onSelect={setSelected} /> },
            ]}
          />
        </div>
      )}

      <DetailPanel open={creating} onClose={() => setCreating(false)} title={`New ${profile.terms.project.toLowerCase()}`}>
        <form onSubmit={handleCreate} className="flex flex-col gap-4">
          <label className="text-[12.5px] font-medium text-ink-2">
            Name
            <input
              autoFocus
              name="name"
              required
              className="mt-1 h-10 w-full rounded-[9px] border border-line-strong bg-bg px-3 text-[14px] text-ink-1 outline-none focus:border-accent"
            />
          </label>
          <label className="text-[12.5px] font-medium text-ink-2">
            Description
            <textarea
              name="description"
              rows={4}
              className="mt-1 w-full resize-none rounded-[9px] border border-line-strong bg-bg px-3 py-2 text-[13.5px] text-ink-1 outline-none focus:border-accent"
            />
          </label>
          <label className="text-[12.5px] font-medium text-ink-2">
            Due date
            <input
              type="date"
              name="dueDate"
              className="mt-1 h-10 w-full rounded-[9px] border border-line-strong bg-bg px-3 text-[14px] text-ink-1 outline-none focus:border-accent"
            />
          </label>
          <button
            type="submit"
            disabled={isPending}
            className="h-9 rounded-[9px] bg-accent px-4 text-[13px] font-semibold text-on-accent hover:opacity-90 disabled:opacity-60"
          >
            Create
          </button>
        </form>
      </DetailPanel>

      <DetailPanel open={!!selected} onClose={() => setSelected(null)} title={selected?.name ?? ""} subtitle={selected?.organizationName ?? undefined}>
        {selected ? <ProjectDetail project={selected} onChange={refreshProject} onDelete={removeProject} /> : null}
      </DetailPanel>
    </div>
  );
}

function KanbanTab({ projects, onMove, onSelect }: { projects: ProjectRow[]; onMove: (p: ProjectRow, toStatus: string) => void; onSelect: (p: ProjectRow) => void }) {
  const columns: KanbanColumn<ProjectRow>[] = PROJECT_STATUS_ORDER.map((status) => ({
    key: status,
    label: JOB_STATUS_LABEL[status],
    items: projects.filter((p) => p.statusKey === status),
  }));

  return (
    <KanbanBoard
      columns={columns}
      cardKey={(p) => p.id}
      onMove={(project, toStatus) => onMove(project, toStatus)}
      renderCard={(project) => (
        <button className="w-full text-left" onClick={() => onSelect(project)}>
          <p className="text-[13px] font-semibold leading-snug text-ink-1">{project.name}</p>
          {project.organizationName ? <p className="mt-1 text-[12px] text-ink-3">{project.organizationName}</p> : null}
          {project.dueDate ? <p className="mt-2 text-[12px] text-ink-3">Due {new Date(project.dueDate).toLocaleDateString()}</p> : null}
        </button>
      )}
    />
  );
}

function ListTab({ projects, onSelect }: { projects: ProjectRow[]; onSelect: (p: ProjectRow) => void }) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => projects.filter((p) => p.name.toLowerCase().includes(query.toLowerCase())), [projects, query]);

  const columns: Column<ProjectRow>[] = [
    { key: "name", header: "Name", render: (p) => <span className="font-medium text-ink-1">{p.name}</span> },
    { key: "client", header: "Client", render: (p) => p.organizationName ?? "—" },
    {
      key: "status",
      header: "Status",
      render: (p) => <Badge tone={STATUS_TONE[p.statusKey as ProjectStatusKey] ?? "neutral"}>{JOB_STATUS_LABEL[p.statusKey as ProjectStatusKey] ?? p.statusKey}</Badge>,
    },
    { key: "due", header: "Due", render: (p) => (p.dueDate ? new Date(p.dueDate).toLocaleDateString() : "—") },
    { key: "owner", header: "Owner", render: (p) => p.ownerName ?? "—" },
  ];

  return (
    <div className="flex flex-col gap-4">
      <SearchInput value={query} onChange={setQuery} placeholder="Search…" />
      {filtered.length === 0 ? (
        <EmptyState icon={KanbanSquare} title="No matches" description="Try a different search term." />
      ) : (
        <DataTable columns={columns} rows={filtered} rowKey={(p) => p.id} onRowClick={onSelect} />
      )}
    </div>
  );
}

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function CalendarTab({ projects, onSelect }: { projects: ProjectRow[]; onSelect: (p: ProjectRow) => void }) {
  const withDue = projects.filter((p) => p.dueDate);
  const [cursor, setCursor] = useState(() => (withDue[0]?.dueDate ? new Date(withDue[0].dueDate) : new Date()));
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const byDay = new Map<number, ProjectRow[]>();
  withDue.forEach((p) => {
    const d = new Date(p.dueDate as Date);
    if (d.getFullYear() === year && d.getMonth() === month) {
      const list = byDay.get(d.getDate()) ?? [];
      list.push(p);
      byDay.set(d.getDate(), list);
    }
  });

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-[15px] font-semibold text-ink-1">{MONTH_NAMES[month]} {year}</p>
        <div className="flex gap-1">
          <button onClick={() => setCursor(new Date(year, month - 1, 1))} className="flex h-8 w-8 items-center justify-center rounded-[8px] border border-line hover:bg-surface-raised" aria-label="Previous month">
            <ChevronLeft size={15} />
          </button>
          <button onClick={() => setCursor(new Date(year, month + 1, 1))} className="flex h-8 w-8 items-center justify-center rounded-[8px] border border-line hover:bg-surface-raised" aria-label="Next month">
            <ChevronRight size={15} />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-2xl border border-line bg-line">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="bg-surface-raised py-2 text-center text-[11px] font-semibold text-ink-3">{d}</div>
        ))}
        {cells.map((day, i) => (
          <div key={i} className={cn("min-h-[92px] bg-surface p-1.5", !day && "bg-bg")}>
            {day ? (
              <>
                <p className="mb-1 text-[11.5px] text-ink-3">{day}</p>
                <div className="flex flex-col gap-1">
                  {(byDay.get(day) ?? []).map((p) => (
                    <button key={p.id} onClick={() => onSelect(p)} className="truncate rounded-[6px] bg-accent-wash px-1.5 py-1 text-left text-[11px] font-medium text-accent">
                      {p.name}
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

function ProjectDetail({ project, onChange, onDelete }: { project: ProjectRow; onChange: (p: ProjectRow) => void; onDelete: (p: ProjectRow) => void }) {
  const [taskTitle, setTaskTitle] = useState("");
  const [isPending, startTransition] = useTransition();
  const { showToast } = useToast();

  function addTask(e: React.FormEvent) {
    e.preventDefault();
    if (!taskTitle.trim()) return;
    startTransition(async () => {
      const fd = new FormData();
      fd.set("projectId", project.id);
      fd.set("title", taskTitle.trim());
      const result = await createTaskAction({}, fd);
      if (result.error || !result.id) return showToast({ title: "Couldn't add task", description: result.error ?? "Something went wrong." });
      onChange({ ...project, tasks: [...project.tasks, { id: result.id!, title: taskTitle.trim(), status: "todo", dueDate: null }] });
      setTaskTitle("");
    });
  }

  function toggleTask(taskId: string) {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("taskId", taskId);
      const result = await toggleTaskDoneAction({}, fd);
      if (result.error) return showToast({ title: "Couldn't update task", description: result.error });
      onChange({
        ...project,
        tasks: project.tasks.map((t) => (t.id === taskId ? { ...t, status: t.status === "done" ? "todo" : "done" } : t)),
      });
    });
  }

  function removeTask(taskId: string) {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("taskId", taskId);
      const result = await deleteTaskAction({}, fd);
      if (result.error) return showToast({ title: "Couldn't delete task", description: result.error });
      onChange({ ...project, tasks: project.tasks.filter((t) => t.id !== taskId) });
    });
  }

  return (
    <div className="flex flex-col gap-5">
      {project.description ? <p className="text-[13.5px] leading-relaxed text-ink-2">{project.description}</p> : null}

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-[10px] border border-line bg-bg p-3">
          <p className="text-[11px] font-medium text-ink-3">Status</p>
          <p className="mt-1 text-[14px] font-semibold text-ink-1">{JOB_STATUS_LABEL[project.statusKey as ProjectStatusKey] ?? project.statusKey}</p>
        </div>
        <div className="rounded-[10px] border border-line bg-bg p-3">
          <p className="text-[11px] font-medium text-ink-3">Owner</p>
          <p className="mt-1 text-[14px] font-semibold text-ink-1">{project.ownerName ?? "Unassigned"}</p>
        </div>
      </div>

      <div>
        <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-ink-3">Tasks</p>
        <div className="flex flex-col gap-1.5">
          {project.tasks.map((t) => (
            <label key={t.id} className="flex items-center gap-2.5 rounded-[9px] border border-line bg-bg px-3 py-2 text-[13px]">
              <input type="checkbox" checked={t.status === "done"} onChange={() => toggleTask(t.id)} className="h-4 w-4 accent-accent" />
              <span className={cn("flex-1", t.status === "done" && "text-ink-3 line-through")}>{t.title}</span>
              <button onClick={() => removeTask(t.id)} disabled={isPending} className="text-[11px] text-ink-3 hover:text-critical">Remove</button>
            </label>
          ))}
          {project.tasks.length === 0 ? <p className="text-[13px] text-ink-3">No tasks yet.</p> : null}
        </div>
        <form onSubmit={addTask} className="mt-2.5 flex gap-2">
          <input
            value={taskTitle}
            onChange={(e) => setTaskTitle(e.target.value)}
            placeholder="Add a task…"
            className="h-9 flex-1 rounded-[8px] border border-line-strong bg-bg px-3 text-[13px] text-ink-1 outline-none focus:border-accent"
          />
          <button type="submit" disabled={isPending} className="h-9 rounded-[8px] bg-accent px-3.5 text-[13px] font-semibold text-on-accent hover:opacity-90 disabled:opacity-60">
            Add
          </button>
        </form>
      </div>

      <Button variant="secondary" disabled={isPending} onClick={() => onDelete(project)}>Delete project</Button>
    </div>
  );
}
