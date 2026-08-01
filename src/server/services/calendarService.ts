import { db } from "@/server/db";
import { logActivity } from "@/server/services/activityService";

export interface CalendarEventRow {
  id: string;
  title: string;
  date: string;
  time: string;
}

export async function listCalendarEvents(workspaceId: string): Promise<CalendarEventRow[]> {
  return db.calendarEvent.findMany({
    where: { workspaceId },
    orderBy: [{ date: "asc" }, { time: "asc" }],
    select: { id: true, title: true, date: true, time: true },
  });
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
