"use server";

import { revalidatePath } from "next/cache";
import { getSession, hasStaffAccess } from "@/lib/session";
import {
  listWorkspaceCustomers,
  offboardWorkspaceClient,
} from "@/server/platform/services/workspaceCustomerService";
import { recordAuditEntry } from "@/server/platform/services/auditLogService";

export interface OffboardResult {
  error?: string;
  success?: boolean;
}

// Requires the founder to type the client's exact current name — the
// only confirmation step for an action with no undo. Re-fetches the
// name from the real database rather than trusting a hidden form field,
// so a stale page can't be used to offboard the wrong client.
export async function offboardWorkspaceClientAction(
  clientId: string,
  confirmedName: string
): Promise<OffboardResult> {
  const session = await getSession();
  if (!hasStaffAccess(session)) {
    return { error: "Not authorized." };
  }

  const customers = await listWorkspaceCustomers();
  const target = customers.find((c) => c.id === clientId);
  if (!target) {
    return { error: "Client not found — it may already be offboarded." };
  }
  if (confirmedName.trim() !== target.name) {
    return { error: `Name doesn't match. Type "${target.name}" exactly to confirm.` };
  }

  await offboardWorkspaceClient(clientId);
  await recordAuditEntry({
    staffUserId: session.userId,
    action: "offboarded_workspace_client",
    targetEntityType: "WorkspaceClient",
    targetEntityId: clientId,
    metadata: { name: target.name },
  });
  revalidatePath("/3stone-ai/workspace-customers");
  return { success: true };
}
