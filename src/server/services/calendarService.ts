import { db } from "@/server/db";
import { logActivity } from "@/server/services/activityService";
import { getGoogleCalendarEventsInRange } from "@/server/services/googleIntegrationService";
import { getOutlookEventsInRange, deleteOutlookEvent } from "@/server/services/microsoftIntegrationService";
import { listCanvasAssignments } from "@/server/services/canvasIntegrationService";
import { listMondayItems } from "@/server/services/mondayIntegrationService";

export interface CalendarEventRow {
  id: string;
  title: string;
  date: string;
  time: string;
  // Absent/"internal" = a real row this workspace owns (editable/deletable).
  // "google"/"outlook" = read-only, synced live from that provider each
  // page load — there is no local row to edit or delete.
  source?: "internal" | "google" | "outlook" | "canvas" | "monday" | "job" | "meeting" | "project" | "task" | "milestone" | "meeting_task";
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
  const [google, microsoft, canvas, monday] = await Promise.all([
    db.integration.findUnique({ where: { workspaceId_provider: { workspaceId, provider: "google" } } }),
    db.integration.findUnique({ where: { workspaceId_provider: { workspaceId, provider: "microsoft" } } }),
    db.integration.findUnique({ where: { workspaceId_provider: { workspaceId, provider: "canvas" } } }),
    db.integration.findUnique({ where: { workspaceId_provider: { workspaceId, provider: "monday" } } }),
  ]);

  const rangeStart = new Date();
  rangeStart.setFullYear(rangeStart.getFullYear() - 2);
  const rangeEnd = new Date();
  rangeEnd.setFullYear(rangeEnd.getFullYear() + 2);
  const [googleEvents, microsoftEvents, canvasAssignments, mondayItems] = await Promise.all([
    google?.status === "connected" ? getGoogleCalendarEventsInRange(workspaceId, rangeStart, rangeEnd, 250).catch(() => []) : Promise.resolve([]),
    microsoft?.status === "connected" ? getOutlookEventsInRange(workspaceId, rangeStart, rangeEnd, 250).catch(() => []) : Promise.resolve([]),
    canvas?.status === "connected" ? listCanvasAssignments(workspaceId).catch(() => []) : Promise.resolve([]),
    monday?.status === "connected" ? listMondayItems(workspaceId).catch(() => []) : Promise.resolve([]),
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
  canvasAssignments.forEach((assignment) => {
    const { date, time, allDay } = splitIsoStart(assignment.dueAt);
    if (!date) return;
    rows.push({ id: `canvas:${assignment.id}`, title: assignment.title, date, time, allDay, source: "canvas" });
  });
  mondayItems.forEach((item) => {
    if (!item.dueDate) return;
    rows.push({ id: `monday:${item.id}`, title: `${item.name} — ${item.boardName}`, date: item.dueDate, time: "00:00", allDay: true, source: "monday" });
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
  const [internal, synced, meetings, projects, tasks, milestones, meetingTasks, jobApplications] = await Promise.all([
    listCalendarEvents(workspaceId),
    listSyncedCalendarEvents(workspaceId),
    db.meeting.findMany({ where: { workspaceId }, orderBy: { scheduledAt: "asc" }, select: { id: true, title: true, scheduledAt: true } }),
    db.project.findMany({ where: { workspaceId, dueDate: { not: null } }, select: { id: true, name: true, dueDate: true, statusKey: true } }),
    db.task.findMany({ where: { workspaceId, dueDate: { not: null } }, select: { id: true, title: true, dueDate: true, status: true } }),
    db.projectMilestone.findMany({ where: { project: { workspaceId }, dueDate: { not: null } }, select: { id: true, title: true, dueDate: true, status: true } }),
    db.meetingActionItem.findMany({ where: { meeting: { workspaceId }, dueDate: { not: null } }, select: { id: true, title: true, dueDate: true, status: true } }),
    db.jobApplication.findMany({ where: { workspaceId, appliedDate: { not: null } }, select: { id: true, company: true, role: true, appliedDate: true, status: true, source: true } }),
  ]);
  const meetingRows: CalendarEventRow[] = meetings.map((meeting) => {
    const local = meeting.scheduledAt;
    return {
      id: `meeting:${meeting.id}`,
      title: meeting.title,
      date: `${local.getFullYear()}-${String(local.getMonth() + 1).padStart(2, "0")}-${String(local.getDate()).padStart(2, "0")}`,
      time: `${String(local.getHours()).padStart(2, "0")}:${String(local.getMinutes()).padStart(2, "0")}`,
      source: "meeting",
    };
  });
  const dueRow = (id: string, title: string, dueDate: Date, source: CalendarEventRow["source"]): CalendarEventRow => ({
    id,
    title,
    date: `${dueDate.getFullYear()}-${String(dueDate.getMonth() + 1).padStart(2, "0")}-${String(dueDate.getDate()).padStart(2, "0")}`,
    time: `${String(dueDate.getHours()).padStart(2, "0")}:${String(dueDate.getMinutes()).padStart(2, "0")}`,
    allDay: dueDate.getHours() === 0 && dueDate.getMinutes() === 0,
    source,
  });
  const projectRows = projects.map((project) => dueRow(`project:${project.id}`, `${project.name}${project.statusKey === "done" ? " (completed)" : " due"}`, project.dueDate as Date, "project"));
  const taskRows = tasks.map((task) => dueRow(`task:${task.id}`, `${task.title}${task.status === "done" ? " (completed)" : " due"}`, task.dueDate as Date, "task"));
  const milestoneRows = milestones.map((milestone) => dueRow(`milestone:${milestone.id}`, `${milestone.title}${milestone.status === "approved" ? " (completed)" : " due"}`, milestone.dueDate as Date, "milestone"));
  const meetingTaskRows = meetingTasks.map((task) => dueRow(`meeting-task:${task.id}`, `${task.title}${task.status === "done" ? " (completed)" : " due"}`, task.dueDate as Date, "meeting_task"));
  const jobRows = jobApplications.map((application) => dueRow(`job:${application.id}`, `${application.company} — ${application.role} (${application.status}${application.source === "indeed" ? ", Indeed" : ""})`, application.appliedDate as Date, "job"));
  return [...internal.map((e) => ({ ...e, source: "internal" as const })), ...synced, ...meetingRows, ...projectRows, ...taskRows, ...milestoneRows, ...meetingTaskRows, ...jobRows];
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
