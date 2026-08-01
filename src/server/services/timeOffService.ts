import { db } from "@/server/db";
import { logActivity } from "@/server/services/activityService";
import { requireTeamManager } from "@/server/services/teamService";
import type { TimeOffType, TimeOffStatus } from "../../../generated/prisma/client";

export interface TimeOffRequestRow {
  id: string;
  requesterId: string;
  requesterName: string;
  type: TimeOffType;
  startDate: Date;
  endDate: Date;
  status: TimeOffStatus;
  notes: string | null;
}

// Workspace-wide, not scoped to the caller - a manager needs to see
// everyone's requests to approve them, same as the demo's own behavior.
export async function listTimeOffRequests(workspaceId: string): Promise<TimeOffRequestRow[]> {
  const requests = await db.timeOffRequest.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "desc" },
    include: { requester: { select: { name: true } } },
  });
  return requests.map((r) => ({
    id: r.id,
    requesterId: r.requesterId,
    requesterName: r.requester.name,
    type: r.type,
    startDate: r.startDate,
    endDate: r.endDate,
    status: r.status,
    notes: r.notes,
  }));
}

export async function createTimeOffRequest(
  workspaceId: string,
  requesterId: string,
  type: TimeOffType,
  startDate: string,
  endDate: string,
  notes: string
): Promise<TimeOffRequestRow> {
  if (!startDate || !endDate) throw new Error("Start and end dates are required.");
  const requester = await db.user.findUniqueOrThrow({ where: { id: requesterId } });

  const { request } = await db.$transaction(async (tx) => {
    const approval = await tx.approvalRequest.create({
      data: { workspaceId, entityType: "time_off_request", entityId: "", requestedById: requesterId, status: "pending" },
    });
    const request = await tx.timeOffRequest.create({
      data: {
        workspaceId,
        requesterId,
        type,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        notes: notes.trim() || null,
        approvalRequestId: approval.id,
      },
    });
    await tx.approvalRequest.update({ where: { id: approval.id }, data: { entityId: request.id } });
    return { request };
  });

  await logActivity(workspaceId, requesterId, "requested_time_off", "TimeOffRequest", request.id, { type });
  return {
    id: request.id,
    requesterId,
    requesterName: requester.name,
    type: request.type,
    startDate: request.startDate,
    endDate: request.endDate,
    status: request.status,
    notes: request.notes,
  };
}

export async function decideTimeOffRequest(
  workspaceId: string,
  approverUserId: string,
  requestId: string,
  decision: "approved" | "denied"
): Promise<void> {
  const { memberId } = await requireTeamManager(approverUserId, workspaceId);
  const existing = await db.timeOffRequest.findFirst({ where: { id: requestId, workspaceId } });
  if (!existing) throw new Error("Request not found.");

  await db.$transaction(async (tx) => {
    await tx.timeOffRequest.update({ where: { id: requestId }, data: { status: decision } });
    if (existing.approvalRequestId) {
      await tx.approvalRequest.update({
        where: { id: existing.approvalRequestId },
        data: { status: decision === "approved" ? "approved" : "rejected", approverId: memberId, decidedAt: new Date() },
      });
    }
  });
  await logActivity(workspaceId, approverUserId, decision === "approved" ? "approved_time_off" : "denied_time_off", "TimeOffRequest", requestId);
}

// Withdrawing your own request, or a manager clearing any request -
// same dual-permission shape a real HR flow needs (per CLAUDE.md, this
// reuses the generic ApprovalRequest mechanism rather than a bespoke
// approval system, so the linked ApprovalRequest row is cleaned up too).
export async function deleteTimeOffRequest(workspaceId: string, actorUserId: string, requestId: string): Promise<void> {
  const existing = await db.timeOffRequest.findFirst({ where: { id: requestId, workspaceId } });
  if (!existing) throw new Error("Request not found.");
  if (existing.requesterId !== actorUserId) {
    await requireTeamManager(actorUserId, workspaceId);
  }
  await db.timeOffRequest.delete({ where: { id: requestId } });
  if (existing.approvalRequestId) {
    await db.approvalRequest.delete({ where: { id: existing.approvalRequestId } }).catch(() => {});
  }
  await logActivity(workspaceId, actorUserId, "deleted_time_off_request", "TimeOffRequest", requestId);
}
