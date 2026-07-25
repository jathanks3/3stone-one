import { db } from "@/server/db";

export interface AuditLogListItem {
  id: string;
  staffUserId: string;
  staffName: string;
  staffEmail: string;
  action: string;
  targetWorkspaceId: string | null;
  targetEntityType: string | null;
  targetEntityId: string | null;
  createdAt: Date;
}

const PAGE_SIZE = 50;

// PlatformAuditLogEntry has no declared relation to User (it's a raw
// staffUserId string, by design — an audit row must never be lost just
// because the referenced user was later deleted). So this resolves names
// with a second query instead of a Prisma `include`, and falls back to
// the raw ID for any staffUserId that no longer has a User row.
export async function listAuditLogEntries(page = 1): Promise<{ entries: AuditLogListItem[]; hasMore: boolean }> {
  const entries = await db.platformAuditLogEntry.findMany({
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE + 1,
  });
  const hasMore = entries.length > PAGE_SIZE;
  const page_ = entries.slice(0, PAGE_SIZE);

  const staffIds = [...new Set(page_.map((e) => e.staffUserId))];
  const staff = await db.user.findMany({
    where: { id: { in: staffIds } },
    select: { id: true, name: true, email: true },
  });
  const staffById = new Map(staff.map((s) => [s.id, s]));

  return {
    entries: page_.map((e) => ({
      id: e.id,
      staffUserId: e.staffUserId,
      staffName: staffById.get(e.staffUserId)?.name ?? "(deleted user)",
      staffEmail: staffById.get(e.staffUserId)?.email ?? e.staffUserId,
      action: e.action,
      targetWorkspaceId: e.targetWorkspaceId,
      targetEntityType: e.targetEntityType,
      targetEntityId: e.targetEntityId,
      createdAt: e.createdAt,
    })),
    hasMore,
  };
}
