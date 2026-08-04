"use client";

import { useState, useTransition } from "react";
import { CalendarClock, CheckCircle2, Circle, Plus, Users } from "lucide-react";
import { Tabs } from "@/ui/Tabs";
import { Card } from "@/ui/Card";
import { DetailPanel } from "@/ui/DetailPanel";
import { EmptyState } from "@/ui/EmptyState";
import { Button } from "@/ui/Button";
import { cn } from "@/lib/utils";
import { useToast } from "@/lib/toast";
import {
  addActionItemAction,
  addDecisionAction,
  createMeetingAction,
  deleteMeetingAction,
  toggleActionItemAction,
} from "@/app/(app)/meetings/actions";
import type { MeetingRow } from "@/server/services/meetingService";
import { askAssistant } from "@/lib/assistantBus";
import { MeetingRecorder } from "@/components/shared/VoiceCapture";
import { createNoteAction } from "@/app/(app)/notes/actions";

function formatWhen(d: Date): string {
  return new Date(d).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export function RealMeetingsClient({ initialMeetings }: { initialMeetings: MeetingRow[] }) {
  const [meetings, setMeetings] = useState<MeetingRow[]>(initialMeetings);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { showToast } = useToast();

  const selected = selectedId ? meetings.find((m) => m.id === selectedId) ?? null : null;
  const upcoming = meetings.filter((m) => !m.isPast);
  const past = meetings.filter((m) => m.isPast);

  function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await createMeetingAction({}, form);
      if (result.error || !result.id) return showToast({ title: "Couldn't schedule meeting", description: result.error ?? "Something went wrong." });
      setMeetings((prev) => [
        {
          id: result.id!,
          title: String(form.get("title")),
          scheduledAt: new Date(String(form.get("scheduledAt"))),
          attendees: String(form.get("attendees") ?? "").split(",").map((s) => s.trim()).filter(Boolean),
          agenda: String(form.get("agenda") ?? "").split("\n").filter(Boolean),
          actionItems: [],
          decisions: [],
          isPast: new Date(String(form.get("scheduledAt"))).getTime() < Date.now(),
          externalProvider: result.provider ?? null,
          externalJoinUrl: result.joinUrl ?? null,
        },
        ...prev,
      ]);
      setCreating(false);
    });
  }

  function removeMeeting(id: string) {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("meetingId", id);
      const result = await deleteMeetingAction({}, fd);
      if (result.error) return showToast({ title: "Couldn't delete meeting", description: result.error });
      setMeetings((prev) => prev.filter((m) => m.id !== id));
      setSelectedId(null);
    });
  }

  function updateMeeting(updated: MeetingRow) {
    setMeetings((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-bold text-ink-1">Meetings</h1>
          <p className="mt-1 text-[14px] text-ink-2">Agendas, action items, and decisions.</p>
        </div>
        <Button variant="primary" onClick={() => setCreating(true)}>
          <Plus size={14} /> Schedule meeting
        </Button>
      </div>

      <div className="mt-6">
        <Tabs
          tabs={[
            { key: "upcoming", label: "Upcoming", content: <MeetingList meetings={upcoming} onSelect={setSelectedId} /> },
            { key: "past", label: "Past", content: <MeetingList meetings={past} onSelect={setSelectedId} /> },
          ]}
        />
      </div>

      <DetailPanel open={creating} onClose={() => setCreating(false)} title="Schedule a meeting">
        <form onSubmit={handleCreate} className="flex flex-col gap-4">
          <label className="text-[12.5px] font-medium text-ink-2">
            Title
            <input name="title" required autoFocus className="mt-1 h-10 w-full rounded-[9px] border border-line-strong bg-bg px-3 text-[14px] text-ink-1 outline-none focus:border-accent" />
          </label>
          <label className="flex items-start gap-2.5 rounded-[9px] border border-line bg-surface-raised p-3 text-[12.5px] text-ink-2">
            <input name="createTeamsMeeting" type="checkbox" className="mt-0.5" />
            <span><strong className="text-ink-1">Create a Microsoft Teams meeting</strong><br />Adds a real Teams join link using the connected Microsoft account.</span>
          </label>
          <label className="text-[12.5px] font-medium text-ink-2">
            Zoom join link (optional)
            <input name="zoomJoinUrl" type="url" placeholder="https://zoom.us/j/…" className="mt-1 h-10 w-full rounded-[9px] border border-line-strong bg-bg px-3 text-[14px] text-ink-1 outline-none focus:border-accent" />
            <span className="mt-1 block text-[11.5px] font-normal text-ink-3">Free path: create the meeting in Zoom, then paste its link here so it populates Meetings.</span>
          </label>
          <label className="text-[12.5px] font-medium text-ink-2">
            Date & time
            <input name="scheduledAt" type="datetime-local" required className="mt-1 h-10 w-full rounded-[9px] border border-line-strong bg-bg px-3 text-[14px] text-ink-1 outline-none focus:border-accent" />
          </label>
          <label className="text-[12.5px] font-medium text-ink-2">
            Attendees (comma-separated)
            <input name="attendees" placeholder="e.g. Jordan Ellis, Alicia Ford" className="mt-1 h-10 w-full rounded-[9px] border border-line-strong bg-bg px-3 text-[14px] text-ink-1 outline-none focus:border-accent" />
          </label>
          <label className="text-[12.5px] font-medium text-ink-2">
            Agenda (one item per line)
            <textarea name="agenda" rows={4} className="mt-1 w-full resize-none rounded-[9px] border border-line-strong bg-bg px-3 py-2 text-[13.5px] text-ink-1 outline-none focus:border-accent" />
          </label>
          <button type="submit" disabled={isPending} className="h-9 rounded-[9px] bg-accent px-4 text-[13px] font-semibold text-on-accent hover:opacity-90 disabled:opacity-60">
            Schedule
          </button>
        </form>
      </DetailPanel>

      <DetailPanel open={!!selected} onClose={() => setSelectedId(null)} title={selected?.title ?? ""} subtitle={selected ? formatWhen(selected.scheduledAt) : ""}>
        {selected ? <MeetingDetail meeting={selected} onChange={updateMeeting} onDelete={() => removeMeeting(selected.id)} /> : null}
      </DetailPanel>
    </div>
  );
}

function MeetingList({ meetings, onSelect }: { meetings: MeetingRow[]; onSelect: (id: string) => void }) {
  if (meetings.length === 0) {
    return <EmptyState icon={CalendarClock} title="Nothing here" description="No meetings in this view yet." />;
  }
  return (
    <div className="flex flex-col gap-3">
      {meetings.map((m) => (
        <Card key={m.id} className="cursor-pointer p-4 transition-colors hover:bg-surface-raised" onClick={() => onSelect(m.id)}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-[14.5px] font-semibold text-ink-1">{m.title}</p>
            <span className="text-[12.5px] text-ink-3">{formatWhen(m.scheduledAt)}</span>
          </div>
          {m.attendees.length > 0 ? (
            <div className="mt-2 flex items-center gap-1.5 text-[12.5px] text-ink-3">
              <Users size={13} />
              {m.attendees.join(", ")}
            </div>
          ) : null}
          {m.actionItems.length > 0 ? (
            <p className="mt-2 text-[12px] text-ink-3">
              {m.actionItems.filter((a) => a.status === "done").length}/{m.actionItems.length} action items complete
            </p>
          ) : null}
          {m.externalJoinUrl ? <a href={m.externalJoinUrl} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="mt-2 inline-flex text-[12.5px] font-semibold text-accent hover:underline">Join {m.externalProvider === "zoom" ? "Zoom" : "Microsoft Teams"} meeting</a> : null}
        </Card>
      ))}
    </div>
  );
}

function MeetingDetail({ meeting, onChange, onDelete }: { meeting: MeetingRow; onChange: (m: MeetingRow) => void; onDelete: () => void }) {
  const [actionTitle, setActionTitle] = useState("");
  const [decisionSummary, setDecisionSummary] = useState("");
  const [isPending, startTransition] = useTransition();
  const { showToast } = useToast();

  async function saveTranscript(transcript: string) {
    const form = new FormData();
    form.set("title", `${meeting.title} — meeting transcript`);
    form.set("body", `Meeting: ${meeting.title}\nDate: ${formatWhen(meeting.scheduledAt)}${meeting.attendees.length ? `\nAttendees: ${meeting.attendees.join(", ")}` : ""}\n\nTranscript\n${transcript}`);
    const result = await createNoteAction({}, form);
    if (result.error) return showToast({ title: "Couldn't save transcript", description: result.error });
    showToast({ title: "Meeting transcript saved", description: "The transcript is now available in Notes and to 3Stone AI." });
  }

  function toggleAction(actionItemId: string) {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("meetingId", meeting.id);
      fd.set("actionItemId", actionItemId);
      const result = await toggleActionItemAction({}, fd);
      if (result.error) return showToast({ title: "Couldn't update", description: result.error });
      onChange({
        ...meeting,
        actionItems: meeting.actionItems.map((a) => (a.id === actionItemId ? { ...a, status: a.status === "done" ? "todo" : "done" } : a)),
      });
    });
  }

  function addAction(e: React.FormEvent) {
    e.preventDefault();
    if (!actionTitle.trim()) return;
    startTransition(async () => {
      const fd = new FormData();
      fd.set("meetingId", meeting.id);
      fd.set("title", actionTitle.trim());
      const result = await addActionItemAction({}, fd);
      if (result.error || !result.id) return showToast({ title: "Couldn't add action item", description: result.error ?? "Something went wrong." });
      onChange({ ...meeting, actionItems: [...meeting.actionItems, { id: result.id!, title: actionTitle.trim(), status: "todo" }] });
      setActionTitle("");
    });
  }

  function addDecision(e: React.FormEvent) {
    e.preventDefault();
    if (!decisionSummary.trim()) return;
    startTransition(async () => {
      const fd = new FormData();
      fd.set("meetingId", meeting.id);
      fd.set("summary", decisionSummary.trim());
      const result = await addDecisionAction({}, fd);
      if (result.error || !result.id) return showToast({ title: "Couldn't record decision", description: result.error ?? "Something went wrong." });
      onChange({ ...meeting, decisions: [...meeting.decisions, { id: result.id!, summary: decisionSummary.trim(), decidedAt: new Date() }] });
      setDecisionSummary("");
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" onClick={() => askAssistant(`Help me prepare for the meeting "${meeting.title}" at ${formatWhen(meeting.scheduledAt)}. Use its agenda, attendees, related emails, calendar context, and available files. Ask me what outcome I want if it is not clear.`)}>Prep with 3Stone AI</Button>
        <Button variant="secondary" onClick={() => askAssistant(`Help me make notes for "${meeting.title}". Start a clean meeting-note structure for agenda notes, decisions, follow-ups, and action items, then ask me what I want to capture.`)}>Make meeting notes</Button>
      </div>
      <MeetingRecorder onSave={saveTranscript} />
      {meeting.attendees.length > 0 ? (
        <div>
          <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-ink-3">Attendees</p>
          <p className="text-[13.5px] text-ink-2">{meeting.attendees.join(", ")}</p>
        </div>
      ) : null}

      {meeting.agenda.length > 0 ? (
        <div>
          <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-ink-3">Agenda</p>
          <ul className="flex flex-col gap-1.5">
            {meeting.agenda.map((item, i) => (
              <li key={i} className="text-[13.5px] text-ink-2">{i + 1}. {item}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {meeting.externalJoinUrl ? <a href={meeting.externalJoinUrl} target="_blank" rel="noreferrer" className="inline-flex h-9 items-center justify-center rounded-[9px] bg-accent px-4 text-[13px] font-semibold text-on-accent">Join {meeting.externalProvider === "zoom" ? "Zoom" : "Microsoft Teams"}</a> : null}

      {!meeting.isSynced ? <div>
        <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-ink-3">Action items</p>
        <div className="flex flex-col gap-1.5">
          {meeting.actionItems.map((a) => (
            <button
              key={a.id}
              onClick={() => toggleAction(a.id)}
              disabled={isPending}
              className="flex items-center gap-2.5 rounded-[9px] border border-line bg-bg px-3 py-2 text-left text-[13px]"
            >
              {a.status === "done" ? <CheckCircle2 size={16} className="flex-shrink-0 text-good" /> : <Circle size={16} className="flex-shrink-0 text-ink-3" />}
              <span className={cn("flex-1", a.status === "done" && "text-ink-3 line-through")}>{a.title}</span>
            </button>
          ))}
          {meeting.actionItems.length === 0 ? <p className="text-[13px] text-ink-3">No action items yet.</p> : null}
        </div>
        <form onSubmit={addAction} className="mt-2 flex gap-2">
          <input value={actionTitle} onChange={(e) => setActionTitle(e.target.value)} placeholder="Add an action item…" className="h-9 flex-1 rounded-[8px] border border-line-strong bg-bg px-3 text-[13px] text-ink-1 outline-none focus:border-accent" />
          <button type="submit" disabled={isPending} className="h-9 rounded-[8px] bg-accent px-3.5 text-[13px] font-semibold text-on-accent hover:opacity-90 disabled:opacity-60">Add</button>
        </form>
      </div> : null}

      {!meeting.isSynced ? <div>
        <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-ink-3">Decisions</p>
        <ul className="flex flex-col gap-1.5">
          {meeting.decisions.map((d) => (
            <li key={d.id} className="text-[13.5px] text-ink-2">• {d.summary}</li>
          ))}
          {meeting.decisions.length === 0 ? <p className="text-[13px] text-ink-3">No decisions recorded yet.</p> : null}
        </ul>
        <form onSubmit={addDecision} className="mt-2 flex gap-2">
          <input value={decisionSummary} onChange={(e) => setDecisionSummary(e.target.value)} placeholder="Record a decision…" className="h-9 flex-1 rounded-[8px] border border-line-strong bg-bg px-3 text-[13px] text-ink-1 outline-none focus:border-accent" />
          <button type="submit" disabled={isPending} className="h-9 rounded-[8px] bg-accent px-3.5 text-[13px] font-semibold text-on-accent hover:opacity-90 disabled:opacity-60">Add</button>
        </form>
      </div> : null}

      {meeting.isSynced ? <p className="text-[12.5px] text-ink-3">Synced live from Microsoft. Manage the original event in Outlook; prep and notes stay available through 3Stone AI.</p> : <Button variant="secondary" disabled={isPending} onClick={onDelete}>Delete meeting</Button>}
    </div>
  );
}
