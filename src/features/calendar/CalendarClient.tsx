"use client";

import { useRef, useState } from "react";
import { CalendarDays, Plus, Trash2, X } from "lucide-react";
import { Card } from "@/ui/Card";
import { EmptyState } from "@/ui/EmptyState";
import { useIndustry } from "@/lib/industry";
import { DEMO_CALENDAR_EVENTS, STUDENT_CALENDAR_EVENTS } from "@/server/mock-data/calendar";
import type { CalendarEvent } from "@/types";

function parseLocalDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function formatDateHeading(iso: string): string {
  return parseLocalDate(iso).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
}

function dayBadge(iso: string): { weekday: string; day: string } {
  const d = parseLocalDate(iso);
  return {
    weekday: d.toLocaleDateString(undefined, { weekday: "short" }).toUpperCase(),
    day: String(d.getDate()),
  };
}

function groupByDate(events: CalendarEvent[]): [string, CalendarEvent[]][] {
  const sorted = [...events].sort((a, b) => (a.date === b.date ? a.time.localeCompare(b.time) : a.date.localeCompare(b.date)));
  const groups = new Map<string, CalendarEvent[]>();
  for (const event of sorted) {
    const list = groups.get(event.date) ?? [];
    list.push(event);
    groups.set(event.date, list);
  }
  return Array.from(groups.entries());
}

export function CalendarClient() {
  const { editionKey } = useIndustry();
  const seed = editionKey === "student" ? STUDENT_CALENDAR_EVENTS : DEMO_CALENDAR_EVENTS;
  const [events, setEvents] = useState<CalendarEvent[]>(seed);
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const nextId = useRef(seed.length);

  function addEvent(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !date || !time) return;
    nextId.current += 1;
    setEvents((prev) => [...prev, { id: `local_${nextId.current}`, title: title.trim(), date, time }]);
    setTitle("");
    setDate("");
    setTime("");
    setAdding(false);
  }

  function deleteEvent(id: string) {
    setEvents((prev) => prev.filter((ev) => ev.id !== id));
  }

  const groups = groupByDate(events);

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-bold text-ink-1">Calendar</h1>
          <p className="mt-1 text-[14px] text-ink-2">
            {editionKey === "student" ? "Classes, deadlines, and study sessions — yours to add and remove." : "Your team's schedule — add, move, and delete what's coming up."}
          </p>
        </div>
        <button
          onClick={() => setAdding((v) => !v)}
          className="flex h-9 flex-shrink-0 items-center gap-1.5 rounded-[10px] bg-accent px-3.5 text-[13px] font-semibold text-on-accent hover:opacity-90"
        >
          {adding ? <X size={15} /> : <Plus size={15} />}
          {adding ? "Cancel" : "Add event"}
        </button>
      </div>

      {adding ? (
        <Card className="mt-5 p-4">
          <form onSubmit={addEvent} className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <label className="flex-1 text-[12.5px] font-medium text-ink-2">
              Title
              <input
                autoFocus
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Client check-in"
                className="mt-1 h-9 w-full rounded-[8px] border border-line-strong bg-bg px-3 text-[13.5px] text-ink-1 outline-none focus:border-accent"
              />
            </label>
            <label className="text-[12.5px] font-medium text-ink-2">
              Date
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="mt-1 h-9 w-full rounded-[8px] border border-line-strong bg-bg px-3 text-[13.5px] text-ink-1 outline-none focus:border-accent sm:w-40"
              />
            </label>
            <label className="text-[12.5px] font-medium text-ink-2">
              Time
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
                className="mt-1 h-9 w-full rounded-[8px] border border-line-strong bg-bg px-3 text-[13.5px] text-ink-1 outline-none focus:border-accent sm:w-32"
              />
            </label>
            <button
              type="submit"
              className="h-9 flex-shrink-0 rounded-[8px] bg-accent px-4 text-[13px] font-semibold text-on-accent hover:opacity-90"
            >
              Add
            </button>
          </form>
        </Card>
      ) : null}

      <div className="mt-6 flex flex-col gap-6">
        {groups.length === 0 ? (
          <EmptyState icon={CalendarDays} title="Nothing scheduled" description="Add your first event to get started." />
        ) : (
          groups.map(([date, dayEvents]) => (
            <div key={date}>
              <p className="mb-2.5 text-[12px] font-semibold uppercase tracking-wide text-ink-3">{formatDateHeading(date)}</p>
              <div className="flex flex-col gap-2">
                {dayEvents.map((event) => {
                  const badge = dayBadge(event.date);
                  return (
                    <Card key={event.id} className="group flex items-center gap-3.5 p-3.5">
                      <div className="flex h-11 w-11 flex-shrink-0 flex-col items-center justify-center rounded-[10px] bg-accent-wash text-accent">
                        <span className="text-[9.5px] font-bold leading-none">{badge.weekday}</span>
                        <span className="text-[15px] font-extrabold leading-none">{badge.day}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[14px] font-semibold text-ink-1">{event.title}</p>
                        <p className="text-[12.5px] text-ink-3">{event.time}</p>
                      </div>
                      <button
                        onClick={() => deleteEvent(event.id)}
                        aria-label="Delete event"
                        className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[8px] text-ink-3 opacity-0 transition-opacity hover:bg-critical-wash hover:text-critical group-hover:opacity-100"
                      >
                        <Trash2 size={15} />
                      </button>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
