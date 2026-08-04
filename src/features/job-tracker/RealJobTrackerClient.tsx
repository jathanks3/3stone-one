"use client";

import { useState, useTransition } from "react";
import { Briefcase, ChevronLeft, ChevronRight, Plus, Trash2, X } from "lucide-react";
import { Card } from "@/ui/Card";
import { EmptyState } from "@/ui/EmptyState";
import { useToast } from "@/lib/toast";
import {
  createJobApplicationAction,
  deleteJobApplicationAction,
  moveJobApplicationAction,
} from "@/app/(app)/job-tracker/actions";
import type { JobApplicationRow } from "@/server/services/jobApplicationService";

const COLUMNS: { status: JobApplicationRow["status"]; label: string }[] = [
  { status: "saved", label: "Saved" },
  { status: "applied", label: "Applied" },
  { status: "interviewing", label: "Interviewing" },
  { status: "offer", label: "Offer" },
  { status: "rejected", label: "Rejected" },
];

function formatDate(d: Date | null): string | null {
  if (!d) return null;
  return new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function RealJobTrackerClient({ initialApplications }: { initialApplications: JobApplicationRow[] }) {
  const [applications, setApplications] = useState<JobApplicationRow[]>(initialApplications);
  const [adding, setAdding] = useState(false);
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [notes, setNotes] = useState("");
  const [source, setSource] = useState("manual");
  const [sourceUrl, setSourceUrl] = useState("");
  const [isPending, startTransition] = useTransition();
  const { showToast } = useToast();

  function addApplication(e: React.FormEvent) {
    e.preventDefault();
    if (!company.trim() || !role.trim()) return;
    startTransition(async () => {
      const fd = new FormData();
      fd.set("company", company.trim());
      fd.set("role", role.trim());
      fd.set("notes", notes.trim());
      fd.set("source", source);
      fd.set("sourceUrl", sourceUrl.trim());
      const result = await createJobApplicationAction({}, fd);
      if (result.error || !result.id) return showToast({ title: "Couldn't add application", description: result.error ?? "Something went wrong." });
      setApplications((prev) => [...prev, { id: result.id!, company: company.trim(), role: role.trim(), status: "saved", appliedDate: null, notes: notes.trim() || null, source, sourceUrl: sourceUrl.trim() || null }]);
      setCompany("");
      setRole("");
      setNotes("");
      setSource("manual");
      setSourceUrl("");
      setAdding(false);
    });
  }

  function deleteApplication(id: string) {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("applicationId", id);
      const result = await deleteJobApplicationAction({}, fd);
      if (result.error) return showToast({ title: "Couldn't delete application", description: result.error });
      setApplications((prev) => prev.filter((a) => a.id !== id));
    });
  }

  function moveApplication(id: string, direction: -1 | 1) {
    const app = applications.find((a) => a.id === id);
    if (!app) return;
    const currentIndex = COLUMNS.findIndex((c) => c.status === app.status);
    const nextIndex = currentIndex + direction;
    if (nextIndex < 0 || nextIndex >= COLUMNS.length) return;
    const nextStatus = COLUMNS[nextIndex].status;
    startTransition(async () => {
      const fd = new FormData();
      fd.set("applicationId", id);
      fd.set("direction", String(direction));
      const result = await moveJobApplicationAction({}, fd);
      if (result.error) return showToast({ title: "Couldn't move application", description: result.error });
      setApplications((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: nextStatus, appliedDate: a.appliedDate ?? (nextStatus !== "saved" ? new Date() : null) } : a))
      );
    });
  }

  const total = applications.length;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-bold text-ink-1">Internship & Job Tracker</h1>
          <p className="mt-1 text-[14px] text-ink-2">
            {total} application{total === 1 ? "" : "s"} — move a card through the pipeline as it progresses.
          </p>
        </div>
        <button
          onClick={() => setAdding((v) => !v)}
          className="flex h-9 flex-shrink-0 items-center gap-1.5 rounded-[10px] bg-accent px-3.5 text-[13px] font-semibold text-on-accent hover:opacity-90"
        >
          {adding ? <X size={15} /> : <Plus size={15} />}
          {adding ? "Cancel" : "Add application"}
        </button>
      </div>

      {adding ? (
        <Card className="mt-5 p-4">
          <form onSubmit={addApplication} className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <label className="flex-1 text-[12.5px] font-medium text-ink-2">
              Company
              <input
                autoFocus
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="e.g. Cedar & Co."
                className="mt-1 h-9 w-full rounded-[8px] border border-line-strong bg-bg px-3 text-[13.5px] text-ink-1 outline-none focus:border-accent"
              />
            </label>
            <label className="text-[12.5px] font-medium text-ink-2">
              Source
              <select name="source" value={source} onChange={(e) => setSource(e.target.value)} className="mt-1 h-9 w-full rounded-[8px] border border-line-strong bg-bg px-3 text-[13.5px] text-ink-1 outline-none focus:border-accent">
                <option value="manual">Manual</option>
                <option value="linkedin">LinkedIn</option>
                <option value="indeed">Indeed</option>
                <option value="handshake">Handshake</option>
                <option value="12twenty">12twenty (law careers)</option>
                <option value="company_site">Company site</option>
                <option value="other">Other</option>
              </select>
            </label>
            <label className="text-[12.5px] font-medium text-ink-2 sm:col-span-2">
              Job or internship link (optional)
              <input name="sourceUrl" type="url" value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} placeholder="https://…" className="mt-1 h-9 w-full rounded-[8px] border border-line-strong bg-bg px-3 text-[13.5px] text-ink-1 outline-none focus:border-accent" />
            </label>
            <label className="flex-1 text-[12.5px] font-medium text-ink-2">
              Role
              <input
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="e.g. Research Assistant"
                className="mt-1 h-9 w-full rounded-[8px] border border-line-strong bg-bg px-3 text-[13.5px] text-ink-1 outline-none focus:border-accent"
              />
            </label>
            <label className="flex-1 text-[12.5px] font-medium text-ink-2">
              Notes (optional)
              <input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Application opens Aug 1"
                className="mt-1 h-9 w-full rounded-[8px] border border-line-strong bg-bg px-3 text-[13.5px] text-ink-1 outline-none focus:border-accent"
              />
            </label>
            <button type="submit" disabled={isPending} className="h-9 self-end rounded-[8px] bg-accent px-4 text-[13px] font-semibold text-on-accent hover:opacity-90 disabled:opacity-60">
              Add
            </button>
          </form>
        </Card>
      ) : null}

      {total === 0 ? (
        <div className="mt-6">
          <EmptyState icon={Briefcase} title="Nothing saved yet" description="Add your first application to start your pipeline." />
        </div>
      ) : (
        <div className="mt-6 flex gap-3 overflow-x-auto pb-2">
          {COLUMNS.map((column, columnIndex) => {
            const items = applications.filter((a) => a.status === column.status);
            return (
              <div key={column.status} className="flex w-[240px] flex-shrink-0 flex-col gap-2.5">
                <div className="flex items-center justify-between px-1">
                  <p className="text-[12px] font-semibold uppercase tracking-wide text-ink-3">{column.label}</p>
                  <span className="text-[11.5px] text-ink-3">{items.length}</span>
                </div>
                <div className="flex flex-col gap-2">
                  {items.map((app) => {
                    const displayDate = formatDate(app.appliedDate);
                    return (
                      <Card key={app.id} className="p-3.5">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-[13.5px] font-semibold text-ink-1">{app.company}</p>
                          <button
                            onClick={() => deleteApplication(app.id)}
                            disabled={isPending}
                            aria-label="Delete application"
                            className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-[6px] text-ink-3 hover:bg-critical-wash hover:text-critical"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                        <p className="mt-0.5 text-[12.5px] text-ink-2">{app.role}</p>
                        <div className="mt-1.5 flex items-center gap-2">
                          <span className="rounded-full bg-surface-raised px-2 py-0.5 text-[10.5px] font-medium capitalize text-ink-3">{app.source.replace("_", " ")}</span>
                          {app.sourceUrl ? <a href={app.sourceUrl} target="_blank" rel="noreferrer" className="text-[11px] font-semibold text-accent hover:underline">Open listing</a> : null}
                        </div>
                        {displayDate ? <p className="mt-1.5 text-[11px] text-ink-3">Applied {displayDate}</p> : null}
                        {app.notes ? <p className="mt-1.5 line-clamp-2 text-[11.5px] leading-relaxed text-ink-3">{app.notes}</p> : null}
                        <div className="mt-2.5 flex items-center justify-between border-t border-line pt-2">
                          <button
                            onClick={() => moveApplication(app.id, -1)}
                            disabled={columnIndex === 0 || isPending}
                            aria-label="Move to previous stage"
                            className="flex h-6 w-6 items-center justify-center rounded-[6px] text-ink-2 hover:bg-surface-raised disabled:cursor-not-allowed disabled:opacity-30"
                          >
                            <ChevronLeft size={14} />
                          </button>
                          <button
                            onClick={() => moveApplication(app.id, 1)}
                            disabled={columnIndex === COLUMNS.length - 1 || isPending}
                            aria-label="Move to next stage"
                            className="flex h-6 w-6 items-center justify-center rounded-[6px] text-ink-2 hover:bg-surface-raised disabled:cursor-not-allowed disabled:opacity-30"
                          >
                            <ChevronRight size={14} />
                          </button>
                        </div>
                      </Card>
                    );
                  })}
                  {items.length === 0 ? <div className="rounded-[10px] border border-dashed border-line py-6 text-center text-[11.5px] text-ink-3">Empty</div> : null}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
