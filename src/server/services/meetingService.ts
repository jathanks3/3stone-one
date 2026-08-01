import { db } from "@/server/db";
import { logActivity } from "@/server/services/activityService";
import type { MeetingActionItemStatus } from "../../../generated/prisma/client";

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
}

function toRow(m: {
  id: string;
  title: string;
  scheduledAt: Date;
  attendeeIds: unknown;
  agenda: string | null;
  actionItems: { id: string; title: string; status: MeetingActionItemStatus }[];
  decisions: { id: string; summary: string; decidedAt: Date }[];
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

export interface CreateMeetingInput {
  title: string;
  scheduledAt: string;
  attendees: string[];
  agenda: string;
}

export async function createMeeting(workspaceId: string, actorId: string, input: CreateMeetingInput): Promise<MeetingRow> {
  const trimmed = input.title.trim();
  if (!trimmed) throw new Error("Meeting title is required.");
  if (!input.scheduledAt) throw new Error("A date and time are required.");
  const meeting = await db.meeting.create({
    data: {
      workspaceId,
      title: trimmed,
      scheduledAt: new Date(input.scheduledAt),
      attendeeIds: input.attendees.filter(Boolean) as never,
      agenda: input.agenda.trim() || null,
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
