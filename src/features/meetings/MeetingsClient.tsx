"use client";

import { useState } from "react";
import { CalendarClock, CheckCircle2, Circle, Users } from "lucide-react";
import { Tabs } from "@/ui/Tabs";
import { Card } from "@/ui/Card";
import { DetailPanel } from "@/ui/DetailPanel";
import { EmptyState } from "@/ui/EmptyState";
import { AiAction, AiActionRow } from "@/ui/AiAction";
import { cn } from "@/lib/utils";
import { DEMO_MEETINGS } from "@/server/mock-data";
import { generateAgenda, summarizeMeeting } from "@/server/ai/capabilities";
import type { Meeting } from "@/types";

export function MeetingsClient() {
  const [meetings, setMeetings] = useState<Meeting[]>(DEMO_MEETINGS);
  const [selected, setSelected] = useState<Meeting | null>(null);

  function toggleAction(meetingId: string, actionId: string) {
    setMeetings((prev) =>
      prev.map((m) =>
        m.id === meetingId
          ? { ...m, actionItems: m.actionItems.map((a) => (a.id === actionId ? { ...a, done: !a.done } : a)) }
          : m
      )
    );
  }

  const upcoming = meetings.filter((m) => m.status === "upcoming");
  const past = meetings.filter((m) => m.status === "past");
  const activeSelected = selected ? meetings.find((m) => m.id === selected.id) ?? null : null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <h1 className="text-[22px] font-bold text-ink-1">Meetings</h1>
      <p className="mt-1 text-[14px] text-ink-2">Agendas, action items, AI summaries, and decisions.</p>

      <div className="mt-6">
        <Tabs
          tabs={[
            {
              key: "upcoming",
              label: "Upcoming",
              content: <MeetingList meetings={upcoming} onSelect={setSelected} />,
            },
            { key: "past", label: "Past", content: <MeetingList meetings={past} onSelect={setSelected} /> },
          ]}
        />
      </div>

      <DetailPanel
        open={!!activeSelected}
        onClose={() => setSelected(null)}
        title={activeSelected?.title ?? ""}
        subtitle={activeSelected?.at}
      >
        {activeSelected ? (
          <MeetingDetail meeting={activeSelected} onToggleAction={(aid) => toggleAction(activeSelected.id, aid)} />
        ) : null}
      </DetailPanel>
    </div>
  );
}

function MeetingList({ meetings, onSelect }: { meetings: Meeting[]; onSelect: (m: Meeting) => void }) {
  if (meetings.length === 0) {
    return <EmptyState icon={CalendarClock} title="Nothing here" description="No meetings in this view yet." />;
  }
  return (
    <div className="flex flex-col gap-3">
      {meetings.map((m) => (
        <Card
          key={m.id}
          className="cursor-pointer p-4 transition-colors hover:bg-surface-raised"
          onClick={() => onSelect(m)}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-[14.5px] font-semibold text-ink-1">{m.title}</p>
            <span className="text-[12.5px] text-ink-3">{m.at}</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[12.5px] text-ink-3">
            <Users size={13} />
            {m.attendees.join(", ")}
          </div>
          {m.actionItems.length > 0 ? (
            <p className="mt-2 text-[12px] text-ink-3">
              {m.actionItems.filter((a) => a.done).length}/{m.actionItems.length} action items complete
            </p>
          ) : null}
        </Card>
      ))}
    </div>
  );
}

function MeetingDetail({ meeting, onToggleAction }: { meeting: Meeting; onToggleAction: (actionId: string) => void }) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-ink-3">Attendees</p>
        <p className="text-[13.5px] text-ink-2">{meeting.attendees.join(", ")}</p>
      </div>

      <div>
        <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-ink-3">Agenda</p>
        <ul className="flex flex-col gap-1.5">
          {meeting.agenda.map((item, i) => (
            <li key={i} className="text-[13.5px] text-ink-2">
              {i + 1}. {item}
            </li>
          ))}
        </ul>
      </div>

      {meeting.actionItems.length > 0 ? (
        <div>
          <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-ink-3">Action items</p>
          <div className="flex flex-col gap-1.5">
            {meeting.actionItems.map((a) => (
              <button
                key={a.id}
                onClick={() => onToggleAction(a.id)}
                className="flex items-center gap-2.5 rounded-[9px] border border-line bg-bg px-3 py-2 text-left text-[13px]"
              >
                {a.done ? (
                  <CheckCircle2 size={16} className="flex-shrink-0 text-good" />
                ) : (
                  <Circle size={16} className="flex-shrink-0 text-ink-3" />
                )}
                <span className={cn("flex-1", a.done && "text-ink-3 line-through")}>{a.title}</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {meeting.decisions.length > 0 ? (
        <div>
          <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-ink-3">Decisions</p>
          <ul className="flex flex-col gap-1.5">
            {meeting.decisions.map((d, i) => (
              <li key={i} className="text-[13.5px] text-ink-2">
                • {d}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div>
        <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-ink-3">AI actions</p>
        <AiActionRow>
          <AiAction label="Generate agenda" run={() => generateAgenda(meeting)} />
          <AiAction label="Summarize meeting" run={() => summarizeMeeting(meeting)} />
        </AiActionRow>
      </div>
    </div>
  );
}
