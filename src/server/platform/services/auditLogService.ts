import { db } from "@/server/db";
import type { Prisma } from "../../../../generated/prisma/client";

interface RecordAuditEntryInput {
  staffUserId: string;
  action: string;
  targetWorkspaceId?: string;
  targetEntityType?: string;
  targetEntityId?: string;
  metadata?: Record<string, unknown>;
}

// The one place that writes to platform_audit_log_entries. Every other
// service that needs to log a staff action calls this — never inserts
// directly — so there is exactly one shape for "what an audit entry looks
// like" to reason about later (docs/03-database-schema.md,
// docs/15-company-platform-vision.md: "every entry is audited").
export async function recordAuditEntry(input: RecordAuditEntryInput) {
  await db.platformAuditLogEntry.create({
    data: {
      staffUserId: input.staffUserId,
      action: input.action,
      targetWorkspaceId: input.targetWorkspaceId,
      targetEntityType: input.targetEntityType,
      targetEntityId: input.targetEntityId,
      metadata: input.metadata as Prisma.InputJsonValue | undefined,
    },
  });
}
