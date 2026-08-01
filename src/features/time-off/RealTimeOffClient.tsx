"use client";

import { useState, useTransition } from "react";
import { Check, Plane, Plus, Trash2, X } from "lucide-react";
import { Card } from "@/ui/Card";
import { EmptyState } from "@/ui/EmptyState";
import { cn } from "@/lib/utils";
import { useToast } from "@/lib/toast";
import {
  createTimeOffRequestAction,
  decideTimeOffRequestAction,
  deleteTimeOffRequestAction,
} from "@/app/(app)/time-off/actions";
import type { TimeOffRequestRow } from "@/server/services/timeOffService";

const TYPE_LABEL: Record<string, string> = { vacation: "Vacation", sick: "Sick", personal: "Personal" };
const STATUS_STYLE: Record<string, string> = {
  pending: "bg-warning-wash text-warning-ink",
  approved: "bg-good-wash text-good",
  denied: "bg-critical-wash text-critical",
};

function formatRange(start: Date, end: Date): string {
  const fmt = (d: Date) => new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  const s = new Date(start).toDateString();
  const e = new Date(end).toDateString();
  return s === e ? fmt(start) : `${fmt(start)} – ${fmt(end)}`;
}

export function RealTimeOffClient({ initialRequests }: { initialRequests: TimeOffRequestRow[] }) {
  const [requests, setRequests] = useState<TimeOffRequestRow[]>(initialRequests);
  const [adding, setAdding] = useState(false);
  const [type, setType] = useState("vacation");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [notes, setNotes] = useState("");
  const [isPending, startTransition] = useTransition();
  const { showToast } = useToast();

  function addRequest(e: React.FormEvent) {
    e.preventDefault();
    if (!startDate || !endDate) return;
    startTransition(async () => {
      const fd = new FormData();
      fd.set("type", type);
      fd.set("startDate", startDate);
      fd.set("endDate", endDate);
      fd.set("notes", notes.trim());
      const result = await createTimeOffRequestAction({}, fd);
      if (result.error || !result.id) return showToast({ title: "Couldn't submit request", description: result.error ?? "Something went wrong." });
      setRequests((prev) => [
        { id: result.id!, requesterId: "", requesterName: "You", type: type as never, startDate: new Date(startDate), endDate: new Date(endDate), status: "pending", notes: notes.trim() || null },
        ...prev,
      ]);
      setStartDate("");
      setEndDate("");
      setNotes("");
      setAdding(false);
    });
  }

  function decide(id: string, decision: "approved" | "denied") {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("requestId", id);
      fd.set("decision", decision);
      const result = await decideTimeOffRequestAction({}, fd);
      if (result.error) return showToast({ title: "Couldn't update request", description: result.error });
      setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status: decision } : r)));
    });
  }

  function remove(id: string) {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("requestId", id);
      const result = await deleteTimeOffRequestAction({}, fd);
      if (result.error) return showToast({ title: "Couldn't delete request", description: result.error });
      setRequests((prev) => prev.filter((r) => r.id !== id));
    });
  }

  const pending = requests.filter((r) => r.status === "pending");
  const decided = requests.filter((r) => r.status !== "pending");
  const pendingCount = pending.length;

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-bold text-ink-1">Time Off</h1>
          <p className="mt-1 text-[14px] text-ink-2">
            {pendingCount > 0 ? `${pendingCount} request${pendingCount === 1 ? "" : "s"} awaiting approval.` : "Nothing awaiting approval right now."}
          </p>
        </div>
        <button
          onClick={() => setAdding((v) => !v)}
          className="flex h-9 flex-shrink-0 items-center gap-1.5 rounded-[10px] bg-accent px-3.5 text-[13px] font-semibold text-on-accent hover:opacity-90"
        >
          {adding ? <X size={15} /> : <Plus size={15} />}
          {adding ? "Cancel" : "Request time off"}
        </button>
      </div>

      {adding ? (
        <Card className="mt-5 p-4">
          <form onSubmit={addRequest} className="flex flex-col gap-3">
            <div className="flex flex-col gap-3 sm:flex-row">
              <label className="text-[12.5px] font-medium text-ink-2">
                Type
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="mt-1 h-9 w-full rounded-[8px] border border-line-strong bg-bg px-2 text-[13.5px] text-ink-1 outline-none focus:border-accent sm:w-36"
                >
                  <option value="vacation">Vacation</option>
                  <option value="sick">Sick</option>
                  <option value="personal">Personal</option>
                </select>
              </label>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <label className="flex-1 text-[12.5px] font-medium text-ink-2">
                Start date
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required className="mt-1 h-9 w-full rounded-[8px] border border-line-strong bg-bg px-3 text-[13.5px] text-ink-1 outline-none focus:border-accent" />
              </label>
              <label className="flex-1 text-[12.5px] font-medium text-ink-2">
                End date
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required className="mt-1 h-9 w-full rounded-[8px] border border-line-strong bg-bg px-3 text-[13.5px] text-ink-1 outline-none focus:border-accent" />
              </label>
              <label className="flex-1 text-[12.5px] font-medium text-ink-2">
                Notes (optional)
                <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Anything your manager should know" className="mt-1 h-9 w-full rounded-[8px] border border-line-strong bg-bg px-3 text-[13.5px] text-ink-1 outline-none focus:border-accent" />
              </label>
            </div>
            <button type="submit" disabled={isPending} className="mt-1 h-9 self-start rounded-[8px] bg-accent px-4 text-[13px] font-semibold text-on-accent hover:opacity-90 disabled:opacity-60">
              Submit request
            </button>
          </form>
        </Card>
      ) : null}

      <div className="mt-6 flex flex-col gap-6">
        {requests.length === 0 ? (
          <EmptyState icon={Plane} title="No requests yet" description="Submit your first time off request to get started." />
        ) : (
          <>
            {pending.length > 0 ? (
              <div>
                <p className="mb-2.5 text-[12px] font-semibold uppercase tracking-wide text-ink-3">Awaiting approval</p>
                <div className="flex flex-col gap-2">
                  {pending.map((r) => (
                    <Card key={r.id} className="flex flex-wrap items-center gap-3 p-3.5">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-[14px] font-semibold text-ink-1">{r.requesterName}</p>
                          <span className={cn("rounded-full px-2 py-0.5 text-[10.5px] font-semibold", STATUS_STYLE[r.status])}>{TYPE_LABEL[r.type]}</span>
                        </div>
                        <p className="mt-0.5 text-[12.5px] text-ink-3">{formatRange(r.startDate, r.endDate)}</p>
                        {r.notes ? <p className="mt-1 text-[12px] text-ink-3">{r.notes}</p> : null}
                      </div>
                      <div className="flex flex-shrink-0 items-center gap-1.5">
                        <button onClick={() => decide(r.id, "approved")} disabled={isPending} aria-label="Approve" className="flex h-8 w-8 items-center justify-center rounded-[8px] text-good hover:bg-good-wash">
                          <Check size={16} />
                        </button>
                        <button onClick={() => decide(r.id, "denied")} disabled={isPending} aria-label="Deny" className="flex h-8 w-8 items-center justify-center rounded-[8px] text-critical hover:bg-critical-wash">
                          <X size={16} />
                        </button>
                        <button onClick={() => remove(r.id)} disabled={isPending} aria-label="Delete request" className="flex h-8 w-8 items-center justify-center rounded-[8px] text-ink-3 hover:bg-critical-wash hover:text-critical">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            ) : null}

            {decided.length > 0 ? (
              <div>
                <p className="mb-2.5 text-[12px] font-semibold uppercase tracking-wide text-ink-3">Decided</p>
                <div className="flex flex-col gap-2">
                  {decided.map((r) => (
                    <Card key={r.id} className="flex flex-wrap items-center gap-3 p-3.5">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-[14px] font-semibold text-ink-1">{r.requesterName}</p>
                          <span className="rounded-full bg-accent-wash px-2 py-0.5 text-[10.5px] font-semibold text-accent">{TYPE_LABEL[r.type]}</span>
                          <span className={cn("rounded-full px-2 py-0.5 text-[10.5px] font-semibold capitalize", STATUS_STYLE[r.status])}>{r.status}</span>
                        </div>
                        <p className="mt-0.5 text-[12.5px] text-ink-3">{formatRange(r.startDate, r.endDate)}</p>
                        {r.notes ? <p className="mt-1 text-[12px] text-ink-3">{r.notes}</p> : null}
                      </div>
                      <button onClick={() => remove(r.id)} disabled={isPending} aria-label="Delete request" className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[8px] text-ink-3 hover:bg-critical-wash hover:text-critical">
                        <Trash2 size={14} />
                      </button>
                    </Card>
                  ))}
                </div>
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
