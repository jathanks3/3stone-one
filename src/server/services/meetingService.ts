import { db } from "@/server/db";
import { logActivity } from "@/server/services/activityService";
import type { MeetingActionItemStatus } from "../../../generated/prisma/client";
import { getUpcomingOutlookEvents } from "@/server/services/microsoftIntegrationService";

export interface MeetingActionItemRow {
  id: string;
  title: string;
  status: MeetingActionItemStatus;
}

export interface DecisionRow {
  id: string;
  summary: string;
  decidedAt: Date;
}

export interface MeetingRow {
  id: string;
  title: string;
  scheduledAt: Date;
  attendees: string[];
  agenda: string[];
  actionItems: MeetingActionItemRow[];
  decisions: DecisionRow[];
  isPast: boolean;
  externalProvider: string | null;
  externalJoinUrl: string | null;
  isSynced?: boolean;
}

function toRow(m: {
  id: string;
  title: string;
  scheduledAt: Date;
  attendeeIds: unknown;
  agenda: string | null;
  actionItems: { id: string; title: string; status: MeetingActionItemStatus }[];
  decisions: { id: string; summary: string; decidedAt: Date }[];
  externalProvider: string | null;
  externalJoinUrl: string | null;
}): MeetingRow {
  const attendees = Array.isArray(m.attendeeIds) ? (m.attendeeIds as string[]) : [];
  return {
    id: m.id,
    title: m.title,
    scheduledAt: m.scheduledAt,
    attendees,
    agenda: m.agenda ? m.agenda.split("\n").filter(Boolean) : [],
    actionItems: m.actionItems.map((a) => ({ id: a.id, title: a.title, status: a.status })),
    decisions: m.decisions.map((d) => ({ id: d.id, summary: d.summary, decidedAt: d.decidedAt })),
    isPast: m.scheduledAt.getTime() < Date.now(),
    externalProvider: m.externalProvider,
    externalJoinUrl: m.externalJoinUrl,
  };
}

export async function listMeetings(workspaceId: string): Promise<MeetingRow[]> {
  const meetings = await db.meeting.findMany({
    where: { workspaceId },
    orderBy: { scheduledAt: "desc" },
    include: { actionItems: true, decisions: true },
  });
  return meetings.map(toRow);
}

// Outlook/Teams meetings remain owned by Microsoft and are read live. They
// appear beside native 3Stone meetings without duplicating or drifting from
// the user's calendar.
export async function listMicrosoftMeetings(workspaceId: string): Promise<MeetingRow[]> {
  const events = await getUpcomingOutlookEvents(workspaceId, 50);
  return events
    .filter((event) => event.id && event.start)
    .map((event) => ({
      id: `outlook:${event.id}`,
      title: event.summary,
      scheduledAt: new Date(event.start),
      attendees: event.attendees,
      agenda: event.preview ? [event.preview] : [],
      actionItems: [],
      decisions: [],
      isPast: new Date(event.end || event.start).getTime() < Date.now(),
      externalProvider: event.joinUrl ? "microsoft_teams" : "microsoft_outlook",
      externalJoinUrl: event.joinUrl,
      isSynced: true,
    }));
}

export interface CreateMeetingInput {
  title: string;
  scheduledAt: string;
  attendees: string[];
  agenda: string;
  createTeamsMeeting?: boolean;
  zoomJoinUrl?: string;
}

export async function createMeeting(workspaceId: string, actorId: string, input: CreateMeetingInput): Promise<MeetingRow> {
  const trimmed = input.title.trim();
  if (!trimmed) throw new Error("Meeting title is required.");
  if (!input.scheduledAt) throw new Error("A date and time are required.");
  let teams: { id: string; joinUrl: string } | null = null;
  let zoomJoinUrl: string | null = null;
  if (input.zoomJoinUrl?.trim()) {
    const candidate = new URL(input.zoomJoinUrl.trim());
    if (candidate.protocol !== "https:" || !/(^|\.)zoom\.us$/i.test(candidate.hostname)) throw new Error("Enter a valid https://zoom.us meeting link.");
    zoomJoinUrl = candidate.toString();
  }
  if (input.createTeamsMeeting && zoomJoinUrl) throw new Error("Choose either Teams or Zoom for this meeting.");
  if (input.createTeamsMeeting) {
    const { createTeamsMeeting } = await import("@/server/services/microsoftIntegrationService");
    const startsAt = new Date(input.scheduledAt);
    teams = await createTeamsMeeting(workspaceId, {
      subject: trimmed,
      startsAt,
      endsAt: new Date(startsAt.getTime() + 60 * 60 * 1000),
    });
  }
  const meeting = await db.meeting.create({
    data: {
      workspaceId,
      title: trimmed,
      scheduledAt: new Date(input.scheduledAt),
      attendeeIds: input.attendees.filter(Boolean) as never,
      agenda: input.agenda.trim() || null,
      externalProvider: teams ? "microsoft_teams" : zoomJoinUrl ? "zoom" : null,
      externalMeetingId: teams?.id ?? null,
      externalJoinUrl: teams?.joinUrl ?? zoomJoinUrl,
    },
    include: { actionItems: true, decisions: true },
  });
  await logActivity(workspaceId, actorId, "scheduled_meeting", "Meeting", meeting.id, { title: trimmed });
  return toRow(meeting);
}

export async function deleteMeeting(workspaceId: string, meetingId: string, actorId: string): Promise<void> {
  const existing = await db.meeting.findFirst({ where: { id: meetingId, workspaceId } });
  if (!existing) throw new Error("Meeting not found.");
  await db.meetingActionItem.deleteMany({ where: { meetingId } });
  await db.decision.deleteMany({ where: { meetingId } });
  await db.meeting.delete({ where: { id: meetingId } });
  await logActivity(workspaceId, actorId, "deleted_meeting", "Meeting", meetingId, { title: existing.title });
}

async function requireOwnedMeeting(workspaceId: string, meetingId: string) {
  const meeting = await db.meeting.findFirst({ where: { id: meetingId, workspaceId } });
  if (!meeting) throw new Error("Meeting not found.");
  return meeting;
}

export async function addActionItem(workspaceId: string, meetingId: string, actorId: string, title: string): Promise<MeetingActionItemRow> {
  await requireOwnedMeeting(workspaceId, meetingId);
  const trimmed = title.trim();
  if (!trimmed) throw new Error("Action item title is required.");
  const item = await db.meetingActionItem.create({ data: { meetingId, title: trimmed, status: "todo" } });
  await logActivity(workspaceId, actorId, "created_meeting_action_item", "MeetingActionItem", item.id, { title: trimmed });
  return { id: item.id, title: item.title, status: item.status };
}

export async function toggleActionItem(workspaceId: string, meetingId: string, actionItemId: string, actorId: string): Promise<MeetingActionItemRow> {
  await requireOwnedMeeting(workspaceId, meetingId);
  const existing = await db.meetingActionItem.findFirst({ where: { id: actionItemId, meetingId } });
  if (!existing) throw new Error("Action item not found.");
  const nextStatus: MeetingActionItemStatus = existing.status === "done" ? "todo" : "done";
  const item = await db.meetingActionItem.update({ where: { id: actionItemId }, data: { status: nextStatus } });
  await logActivity(workspaceId, actorId, nextStatus === "done" ? "completed_meeting_action_item" : "reopened_meeting_action_item", "MeetingActionItem", actionItemId);
  return { id: item.id, title: item.title, status: item.status };
}

export async function addDecision(workspaceId: string, meetingId: string, actorId: string, summary: string): Promise<DecisionRow> {
  await requireOwnedMeeting(workspaceId, meetingId);
  const trimmed = summary.trim();
  if (!trimmed) throw new Error("Decision summary is required.");
  const decision = await db.decision.create({ data: { meetingId, summary: trimmed } });
  await logActivity(workspaceId, actorId, "recorded_decision", "Decision", decision.id, { summary: trimmed });
  return { id: decision.id, summary: decision.summary, decidedAt: decision.decidedAt };
}
