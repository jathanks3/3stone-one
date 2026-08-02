import { db } from "@/server/db";
import { logActivity } from "@/server/services/activityService";
import { getUpcomingGoogleCalendarEvents } from "@/server/services/googleIntegrationService";
import { getUpcomingOutlookEvents, deleteOutlookEvent } from "@/server/services/microsoftIntegrationService";

export interface CalendarEventRow {
  id: string;
  title: string;
  date: string;
  time: string;
  // Absent/"internal" = a real row this workspace owns (editable/deletable).
  // "google"/"outlook" = read-only, synced live from that provider each
  // page load — there is no local row to edit or delete.
  source?: "internal" | "google" | "outlook";
  allDay?: boolean;
}

export async function listCalendarEvents(workspaceId: string): Promise<CalendarEventRow[]> {
  return db.calendarEvent.findMany({
    where: { workspaceId },
    orderBy: [{ date: "asc" }, { time: "asc" }],
    select: { id: true, title: true, date: true, time: true },
  });
}

// Google/Microsoft return an ISO instant ("2026-08-05T14:00:00-04:00") for
// timed events or a bare date ("2026-08-05") for all-day ones. The digits
// before the offset ARE the wall-clock time the event owner sees on their
// own calendar - read them directly with a regex. Going through
// `new Date(iso).getHours()` instead reinterprets that instant in
// whatever timezone the server process happens to run in (Vercel:
// UTC) - that's exactly what previously shifted an 11am event to 3pm.
function splitIsoStart(iso: string): { date: string; time: string; allDay: boolean } {
  if (!iso) return { date: "", time: "00:00", allDay: true };
  const match = iso.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/);
  if (!match) return { date: iso, time: "00:00", allDay: true };
  return { date: match[1], time: match[2], allDay: false };
}

// Live, read-only pull from whichever calendar providers this workspace has
// connected — nothing here is stored locally, so a disconnect or a change
// made in Google/Outlook shows up immediately on next page load.
export async function listSyncedCalendarEvents(workspaceId: string): Promise<CalendarEventRow[]> {
  const [google, microsoft] = await Promise.all([
    db.integration.findUnique({ where: { workspaceId_provider: { workspaceId, provider: "google" } } }),
    db.integration.findUnique({ where: { workspaceId_provider: { workspaceId, provider: "microsoft" } } }),
  ]);

  const [googleEvents, microsoftEvents] = await Promise.all([
    google?.status === "connected" ? getUpcomingGoogleCalendarEvents(workspaceId, 25).catch(() => []) : Promise.resolve([]),
    microsoft?.status === "connected" ? getUpcomingOutlookEvents(workspaceId, 25).catch(() => []) : Promise.resolve([]),
  ]);

  const rows: CalendarEventRow[] = [];
  googleEvents.forEach((e, i) => {
    const { date, time, allDay } = splitIsoStart(e.start);
    if (!date) return;
    rows.push({ id: `google-${i}-${e.start}`, title: e.summary, date, time, allDay, source: "google" });
  });
  microsoftEvents.forEach((e) => {
    const { date, time, allDay } = splitIsoStart(e.start);
    if (!date || !e.id) return;
    // The real Graph event id (prefixed, not synthetic like Google's below)
    // - Calendars.ReadWrite is already granted, so this id is enough to
    // actually delete the event later via deleteSyncedCalendarEvent.
    rows.push({ id: `outlook:${e.id}`, title: e.summary, date, time, allDay, source: "outlook" });
  });
  return rows;
}

// Only Outlook is deletable today - Google is intentionally locked to
// calendar.readonly (see googleIntegrationService.ts) after the Google
// verification block, so there is no write scope to delete through yet.
export async function deleteSyncedCalendarEvent(workspaceId: string, rowId: string): Promise<void> {
  if (rowId.startsWith("outlook:")) {
    await deleteOutlookEvent(workspaceId, rowId.slice("outlook:".length));
    return;
  }
  throw new Error("This event lives in Google Calendar - delete it there for now.");
}

// What the Calendar module page actually renders — this workspace's own
// events plus a live merge of every connected provider's upcoming events.
export async function listAllCalendarEvents(workspaceId: string): Promise<CalendarEventRow[]> {
  const [internal, synced] = await Promise.all([
    listCalendarEvents(workspaceId),
    listSyncedCalendarEvents(workspaceId),
  ]);
  return [...internal.map((e) => ({ ...e, source: "internal" as const })), ...synced];
}

export async function createCalendarEvent(workspaceId: string, createdById: string, title: string, date: string, time: string): Promise<CalendarEventRow> {
  const trimmedTitle = title.trim();
  if (!trimmedTitle) throw new Error("Event title is required.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error("A valid date is required.");
  if (!/^\d{2}:\d{2}$/.test(time)) throw new Error("A valid time is required.");
  const event = await db.calendarEvent.create({
    data: { workspaceId, createdById, title: trimmedTitle, date, time },
  });
  await logActivity(workspaceId, createdById, "created_calendar_event", "CalendarEvent", event.id, { title: trimmedTitle, date });
  return event;
}

export async function deleteCalendarEvent(workspaceId: string, eventId: string, actorId: string): Promise<void> {
  const existing = await db.calendarEvent.findFirst({ where: { id: eventId, workspaceId } });
  if (!existing) throw new Error("Event not found.");
  await db.calendarEvent.delete({ where: { id: eventId } });
  await logActivity(workspaceId, actorId, "deleted_calendar_event", "CalendarEvent", eventId, { title: existing.title });
}
