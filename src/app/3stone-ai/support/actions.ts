"use server";

import { revalidatePath } from "next/cache";
import { getSession, hasStaffAccess } from "@/lib/session";
import { db } from "@/server/db";
import { recordAuditEntry } from "@/server/platform/services/auditLogService";
type SupportTicketStatus = "open" | "pending" | "resolved" | "closed";
const STATUSES = new Set<SupportTicketStatus>(["open", "pending", "resolved", "closed"]);

export async function updateProblemReportStatus(formData: FormData): Promise<void> {
  const session = await getSession();
  if (!hasStaffAccess(session)) throw new Error("Not authorized.");
  const ticketId = String(formData.get("ticketId") ?? "");
  const status = String(formData.get("status") ?? "") as SupportTicketStatus;
  if (!ticketId || !STATUSES.has(status)) throw new Error("Invalid report update.");
  await db.supportTicket.update({
    where: { id: ticketId },
    data: { status, resolvedAt: status === "resolved" || status === "closed" ? new Date() : null },
  });
  await recordAuditEntry({ staffUserId: session.userId, action: "updated_support_report", targetEntityType: "SupportTicket", targetEntityId: ticketId });
  revalidatePath("/3stone-ai/support");
  revalidatePath("/3stone-ai");
}
