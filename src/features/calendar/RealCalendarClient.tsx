"use client";

import { useState, useTransition } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  MoreHorizontal,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { Card } from "@/ui/Card";
import { EmptyState } from "@/ui/EmptyState";
import { useIndustry } from "@/lib/industry";
import { useOnClickOutside } from "@/lib/useOnClickOutside";
import { useEscapeKey } from "@/lib/useEscapeKey";
import { cn } from "@/lib/utils";
import { buildIcsCalendar, googleCalendarAddUrl } from "@/lib/ics";
import { downloadTextFile } from "@/lib/download";
import { useToast } from "@/lib/toast";
import { createCalendarEventAction, deleteCalendarEventAction, deleteSyncedCalendarEventAction } from "@/app/(app)/calendar/actions";
import type { CalendarEventRow } from "@/server/services/calendarService";
import { useRef } from "react";

function parseLocalDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function toIsoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatTime12h(time24: string): string {
  const [h, m] = time24.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
}

function formatDateHeading(iso: string): string {
  return parseLocalDate(iso).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
}

function dayBadge(iso: string): { weekday: string; day: string } {
  const d = parseLocalDate(iso);
  return { weekday: d.toLocaleDateString(undefined, { weekday: "short" }).toUpperCase(), day: String(d.getDate()) };
}

function groupByDate(events: CalendarEventRow[]): [string, CalendarEventRow[]][] {
  const sorted = [...events].sort((a, b) => (a.date === b.date ? a.time.localeCompare(b.time) : a.date.localeCompare(b.date)));
  const groups = new Map<string, CalendarEventRow[]>();
  for (const event of sorted) {
    const list = groups.get(event.date) ?? [];
    list.push(event);
    groups.set(event.date, list);
  }
  return Array.from(groups.entries());
}

function getMonthMatrix(monthCursor: Date): Date[] {
  const year = monthCursor.getFullYear();
  const month = monthCursor.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const start = new Date(year, month, 1 - firstOfMonth.getDay());
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

const SOURCE_LABEL: Record<"google" | "outlook", string> = {
  google: "Google Calendar",
  outlook: "Outlook",
};

function EventRow({ event, onDelete, disabled }: { event: CalendarEventRow; onDelete: (id: string) => void; disabled: boolean }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useOnClickOutside(ref, () => setMenuOpen(false));
  useEscapeKey(menuOpen, () => setMenuOpen(false));
  const badge = dayBadge(event.date);
  const isSynced = event.source === "google" || event.source === "outlook";
  // Outlook is granted Calendars.ReadWrite, so deleting it here really
  // deletes it in Outlook too. Google is intentionally still
  // calendar.readonly (see googleIntegrationService.ts) - there is no
  // write scope to delete through yet, so a Google-sourced event stays
  // view-only until that changes.
  const canDelete = event.source !== "google";

  return (
    <Card className="group flex items-center gap-3.5 p-3.5">
      <div className="flex h-11 w-11 flex-shrink-0 flex-col items-center justify-center rounded-[10px] bg-accent-wash text-accent">
        <span className="text-[9.5px] font-bold leading-none">{badge.weekday}</span>
        <span className="text-[15px] font-extrabold leading-none">{badge.day}</span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[14px] font-semibold text-ink-1">{event.title}</p>
        <p className="truncate text-[12.5px] text-ink-3">
          {event.allDay ? "All day" : formatTime12h(event.time)}
          {isSynced ? ` · Synced from ${SOURCE_LABEL[event.source as "google" | "outlook"]}` : ""}
        </p>
      </div>
      <div className="relative flex flex-shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100" ref={ref}>
        {isSynced ? null : (
          <>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Export this event"
              className="flex h-8 w-8 items-center justify-center rounded-[8px] text-ink-3 hover:bg-surface-raised hover:text-ink-1"
            >
              <MoreHorizontal size={15} />
            </button>
            {menuOpen ? (
              <div className="absolute right-0 top-[calc(100%+4px)] z-20 w-52 rounded-[10px] border border-line bg-surface p-1 shadow-[var(--shadow)]">
                <a
                  href={googleCalendarAddUrl(event)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 rounded-[7px] px-2.5 py-2 text-left text-[12.5px] text-ink-2 hover:bg-surface-raised hover:text-ink-1"
                >
                  <ExternalLink size={14} />
                  Add to Google Calendar
                </a>
                <button
                  onClick={() => {
                    downloadTextFile(`${event.title.replace(/[^\w-]+/g, "_")}.ics`, buildIcsCalendar([event], event.title), "text/calendar");
                    setMenuOpen(false);
                  }}
                  className="flex w-full items-center gap-2 rounded-[7px] px-2.5 py-2 text-left text-[12.5px] text-ink-2 hover:bg-surface-raised hover:text-ink-1"
                >
                  <Download size={14} />
                  Download .ics (Apple/Outlook)
                </button>
              </div>
            ) : null}
          </>
        )}
        {canDelete ? (
          <button
            onClick={() => onDelete(event.id)}
            disabled={disabled}
            aria-label={isSynced ? "Delete this event in Outlook" : "Delete event"}
            title={isSynced ? "Deletes it in Outlook too" : undefined}
            className="flex h-8 w-8 items-center justify-center rounded-[8px] text-ink-3 hover:bg-critical-wash hover:text-critical"
          >
            <Trash2 size={15} />
          </button>
        ) : null}
      </div>
    </Card>
  );
}

export function RealCalendarClient({ initialEvents }: { initialEvents: CalendarEventRow[] }) {
  const { editionKey } = useIndustry();
  const [events, setEvents] = useState<CalendarEventRow[]>(initialEvents);
  const [view, setView] = useState<"month" | "list">("month");
  const [monthCursor, setMonthCursor] = useState<Date>(() => (initialEvents[0] ? parseLocalDate(initialEvents[0].date) : new Date()));
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [isPending, startTransition] = useTransition();
  const { showToast } = useToast();

  function startAdding(prefillDate?: string) {
    setTitle("");
    setDate(prefillDate ?? "");
    setTime("");
    setAdding(true);
  }

  function addEvent(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !date || !time) return;
    startTransition(async () => {
      const fd = new FormData();
      fd.set("title", title.trim());
      fd.set("date", date);
      fd.set("time", time);
      const result = await createCalendarEventAction({}, fd);
      if (result.error || !result.id) return showToast({ title: "Couldn't add event", description: result.error ?? "Something went wrong." });
      setEvents((prev) => [...prev, { id: result.id!, title: title.trim(), date, time }]);
      setAdding(false);
    });
  }

  function deleteEvent(id: string) {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("eventId", id);
      // Outlook-sourced rows carry a real Graph event id (prefixed
      // "outlook:") and delete through Microsoft's API instead of the
      // local CalendarEvent table.
      const result = id.startsWith("outlook:")
        ? await deleteSyncedCalendarEventAction({}, fd)
        : await deleteCalendarEventAction({}, fd);
      if (result.error) return showToast({ title: "Couldn't delete event", description: result.error });
      setEvents((prev) => prev.filter((ev) => ev.id !== id));
    });
  }

  function exportAll() {
    const calendarName = editionKey === "student" ? "3Stone One Student" : "3Stone One Workspace";
    downloadTextFile("calendar.ics", buildIcsCalendar(events, calendarName), "text/calendar");
  }

  const groups = groupByDate(events);
  const monthDays = getMonthMatrix(monthCursor);
  const monthLabel = monthCursor.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  const selectedDayEvents = selectedDate ? events.filter((e) => e.date === selectedDate).sort((a, b) => a.time.localeCompare(b.time)) : [];

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-bold text-ink-1">Calendar</h1>
          <p className="mt-1 text-[14px] text-ink-2">
            {editionKey === "student"
              ? "Classes, deadlines, and study sessions — yours to add and remove."
              : "Your team's schedule — add, move, and delete what's coming up."}
          </p>
        </div>
        <div className="flex flex-shrink-0 items-center gap-2">
          <div className="flex rounded-[10px] border border-line-strong p-0.5">
            <button
              onClick={() => setView("month")}
              className={cn("rounded-[7px] px-3 py-1.5 text-[12.5px] font-semibold transition-colors", view === "month" ? "bg-accent text-on-accent" : "text-ink-2 hover:text-ink-1")}
            >
              Calendar
            </button>
            <button
              onClick={() => setView("list")}
              className={cn("rounded-[7px] px-3 py-1.5 text-[12.5px] font-semibold transition-colors", view === "list" ? "bg-accent text-on-accent" : "text-ink-2 hover:text-ink-1")}
            >
              List
            </button>
          </div>
          <button
            onClick={exportAll}
            className="flex h-9 flex-shrink-0 items-center gap-1.5 rounded-[10px] border border-line-strong px-3 text-[13px] font-semibold text-ink-1 hover:bg-surface-raised"
          >
            <Download size={15} />
            Export all
          </button>
          <button
            onClick={() => (adding ? setAdding(false) : startAdding(selectedDate ?? undefined))}
            className="flex h-9 flex-shrink-0 items-center gap-1.5 rounded-[10px] bg-accent px-3.5 text-[13px] font-semibold text-on-accent hover:opacity-90"
          >
            {adding ? <X size={15} /> : <Plus size={15} />}
            {adding ? "Cancel" : "Add event"}
          </button>
        </div>
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
              disabled={isPending}
              className="h-9 flex-shrink-0 rounded-[8px] bg-accent px-4 text-[13px] font-semibold text-on-accent hover:opacity-90 disabled:opacity-60"
            >
              Add
            </button>
          </form>
        </Card>
      ) : null}

      {view === "month" ? (
        <div className="mt-6">
          <div className="flex items-center justify-between">
            <p className="text-[15px] font-bold text-ink-1">{monthLabel}</p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setMonthCursor((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
                aria-label="Previous month"
                className="flex h-8 w-8 items-center justify-center rounded-[8px] text-ink-2 hover:bg-surface-raised"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => setMonthCursor((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
                aria-label="Next month"
                className="flex h-8 w-8 items-center justify-center rounded-[8px] text-ink-2 hover:bg-surface-raised"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-7 gap-1.5 text-center text-[11px] font-semibold uppercase tracking-wide text-ink-3">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>
          <div className="mt-1.5 grid grid-cols-7 gap-1.5">
            {monthDays.map((day) => {
              const iso = toIsoDate(day);
              const inMonth = day.getMonth() === monthCursor.getMonth();
              const dayEvents = events.filter((e) => e.date === iso).sort((a, b) => a.time.localeCompare(b.time));
              const isSelected = selectedDate === iso;
              return (
                <button
                  key={iso}
                  onClick={() => setSelectedDate(isSelected ? null : iso)}
                  className={cn(
                    "flex min-h-[76px] flex-col items-start gap-1 rounded-[10px] border p-1.5 text-left transition-colors",
                    isSelected ? "border-accent bg-accent-wash" : "border-line hover:border-line-strong hover:bg-surface-raised",
                    !inMonth && "opacity-40"
                  )}
                >
                  <span className={cn("text-[12px] font-semibold", isSelected ? "text-accent" : "text-ink-2")}>{day.getDate()}</span>
                  <div className="flex w-full flex-col gap-0.5">
                    {dayEvents.slice(0, 2).map((e) => (
                      <span key={e.id} className="truncate rounded-[4px] bg-accent-wash-strong px-1 py-0.5 text-[10px] font-medium text-accent">
                        {e.title}
                      </span>
                    ))}
                    {dayEvents.length > 2 ? <span className="text-[10px] text-ink-3">+{dayEvents.length - 2} more</span> : null}
                  </div>
                </button>
              );
            })}
          </div>

          {selectedDate ? (
            <div className="mt-5">
              <p className="mb-2.5 text-[12px] font-semibold uppercase tracking-wide text-ink-3">{formatDateHeading(selectedDate)}</p>
              {selectedDayEvents.length === 0 ? (
                <EmptyState icon={CalendarDays} title="Nothing scheduled" description="Add an event to this day to get started." />
              ) : (
                <div className="flex flex-col gap-2">
                  {selectedDayEvents.map((event) => (
                    <EventRow key={event.id} event={event} onDelete={deleteEvent} disabled={isPending} />
                  ))}
                </div>
              )}
            </div>
          ) : null}
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-6">
          {groups.length === 0 ? (
            <EmptyState icon={CalendarDays} title="Nothing scheduled" description="Add your first event to get started." />
          ) : (
            groups.map(([groupDate, dayEvents]) => (
              <div key={groupDate}>
                <p className="mb-2.5 text-[12px] font-semibold uppercase tracking-wide text-ink-3">{formatDateHeading(groupDate)}</p>
                <div className="flex flex-col gap-2">
                  {dayEvents.map((event) => (
                    <EventRow key={event.id} event={event} onDelete={deleteEvent} disabled={isPending} />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
