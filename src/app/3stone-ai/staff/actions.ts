"use server";

import { revalidatePath } from "next/cache";
import { getSession, hasStaffAccess } from "@/lib/session";
import { grantStaffAccess, revokeStaffAccess } from "@/server/platform/services/staffService";
import { recordAuditEntry } from "@/server/platform/services/auditLogService";
import type { StaffRole } from "../../../../generated/prisma/client";

export interface AddStaffFormState {
  error?: string;
}

const STAFF_ROLES: readonly StaffRole[] = ["founder", "operations", "support"];

export async function addStaffAction(
  _prevState: AddStaffFormState,
  formData: FormData
): Promise<AddStaffFormState> {
  const session = await getSession();
  if (!hasStaffAccess(session)) {
    return { error: "Not authorized." };
  }

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const name = String(formData.get("name") ?? "").trim();
  const role = String(formData.get("role") ?? "");
  if (!email || !name) {
    return { error: "Email and name are required." };
  }
  if (!STAFF_ROLES.includes(role as StaffRole)) {
    return { error: "Invalid role." };
  }

  const result = await grantStaffAccess({ email, name, role: role as StaffRole, grantedByUserId: session.userId });
  if (result.error) return { error: result.error };

  await recordAuditEntry({
    staffUserId: session.userId,
    action: "granted_staff_access",
    targetEntityType: "User",
    metadata: { email, role },
  });
  revalidatePath("/3stone-ai/staff");
  return {};
}

export async function revokeStaffAction(membershipId: string, targetUserId: string): Promise<{ error?: string }> {
  const session = await getSession();
  if (!hasStaffAccess(session)) {
    return { error: "Not authorized." };
  }
  if (targetUserId === session.userId) {
    return { error: "You can't revoke your own access." };
  }

  await revokeStaffAccess(membershipId);
  await recordAuditEntry({
    staffUserId: session.userId,
    action: "revoked_staff_access",
    targetEntityType: "StaffMembership",
    targetEntityId: membershipId,
  });
  revalidatePath("/3stone-ai/staff");
  return {};
}
