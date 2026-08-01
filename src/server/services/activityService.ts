import { db } from "@/server/db";

// One call site for every real module's mutations to record into
// ActivityLogEntry — this is what makes the Activity module "go real"
// as a side effect of every other module converting, rather than
// needing its own separate write path. Mirrors the shape storageService
// already uses for uploads (see recordUpload/deleteUpload).
export async function logActivity(
  workspaceId: string,
  actorId: string,
  action: string,
  entityType: string,
  entityId: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  await db.activityLogEntry.create({
    data: { workspaceId, actorId, action, entityType, entityId, metadata: metadata as never },
  });
}

export interface ActivityFeedRow {
  id: string;
  actorId: string | null;
  actorName: string | null;
  action: string;
  entityType: string;
  entityId: string;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
}

export async function listActivity(workspaceId: string, limit = 100): Promise<ActivityFeedRow[]> {
  const entries = await db.activityLogEntry.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  const actorIds = [...new Set(entries.map((e) => e.actorId).filter((id): id is string => !!id))];
  const actors = actorIds.length
    ? await db.user.findMany({ where: { id: { in: actorIds } }, select: { id: true, name: true } })
    : [];
  const actorNameById = new Map(actors.map((a) => [a.id, a.name]));
  return entries.map((e) => ({
    id: e.id,
    actorId: e.actorId,
    actorName: e.actorId ? actorNameById.get(e.actorId) ?? "Former member" : null,
    action: e.action,
    entityType: e.entityType,
    entityId: e.entityId,
    metadata: (e.metadata as Record<string, unknown> | null) ?? null,
    createdAt: e.createdAt,
  }));
}
