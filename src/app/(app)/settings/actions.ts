"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/session";
import { getActiveWorkspaceIdForUser } from "@/server/services/onboardingService";
import {
  requireTeamManager,
  inviteMember,
  resendInvitation,
  revokeInvitation,
  changeRole,
  removeMember,
  transferOwnership,
  type AssignableRoleName,
} from "@/server/services/teamService";
import { updateWorkspaceSettings } from "@/server/services/workspaceSettingsService";
import type { IndustryProfileKey } from "@/types";

export interface ActionState {
  error?: string;
  success?: string;
}

// Every action here re-derives workspaceId from the caller's own session
// (never from a hidden form field) and re-checks Owner/Admin permission
// server-side — the UI hides buttons a Member/Client shouldn't see, but
// that's convenience, not the actual authorization boundary.
async function currentWorkspaceId(): Promise<{ userId: string; workspaceId: string }> {
  const session = await getSession();
  if (!session || session.isDemo) throw new Error("Not authenticated.");
  const workspaceId = await getActiveWorkspaceIdForUser(session.userId);
  if (!workspaceId) throw new Error("No workspace.");
  return { userId: session.userId, workspaceId };
}

export async function updateSettingsAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const { userId, workspaceId } = await currentWorkspaceId();
    await requireTeamManager(userId, workspaceId);
    await updateWorkspaceSettings(workspaceId, {
      name: String(formData.get("name") ?? ""),
      slug: String(formData.get("slug") ?? ""),
      timezone: String(formData.get("timezone") ?? "") || undefined,
      address: String(formData.get("address") ?? "") || undefined,
      contactEmail: String(formData.get("contactEmail") ?? "") || undefined,
      contactPhone: String(formData.get("contactPhone") ?? "") || undefined,
      industryProfileKey: (String(formData.get("industryProfileKey") ?? "") || undefined) as
        | IndustryProfileKey
        | undefined,
    });
    revalidatePath("/settings");
    return { success: "Workspace settings saved." };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Something went wrong." };
  }
}

export async function inviteMemberAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const { userId, workspaceId } = await currentWorkspaceId();
    await requireTeamManager(userId, workspaceId);
    const email = String(formData.get("email") ?? "").trim();
    const roleName = String(formData.get("roleName") ?? "") as AssignableRoleName;
    if (!email) return { error: "Email is required." };
    await inviteMember(workspaceId, email, roleName, userId);
    revalidatePath("/settings");
    return { success: `Invitation sent to ${email}.` };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Something went wrong." };
  }
}

export async function resendInvitationAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const { userId, workspaceId } = await currentWorkspaceId();
    await requireTeamManager(userId, workspaceId);
    await resendInvitation(workspaceId, String(formData.get("invitationId") ?? ""));
    revalidatePath("/settings");
    return { success: "Invitation resent." };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Something went wrong." };
  }
}

export async function revokeInvitationAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const { userId, workspaceId } = await currentWorkspaceId();
    await requireTeamManager(userId, workspaceId);
    await revokeInvitation(workspaceId, String(formData.get("invitationId") ?? ""));
    revalidatePath("/settings");
    return { success: "Invitation revoked." };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Something went wrong." };
  }
}

export async function changeRoleAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const { userId, workspaceId } = await currentWorkspaceId();
    await requireTeamManager(userId, workspaceId);
    const roleName = String(formData.get("roleName") ?? "") as AssignableRoleName;
    await changeRole(workspaceId, String(formData.get("memberId") ?? ""), roleName);
    revalidatePath("/settings");
    return { success: "Role updated." };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Something went wrong." };
  }
}

export async function removeMemberAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const { userId, workspaceId } = await currentWorkspaceId();
    await requireTeamManager(userId, workspaceId);
    await removeMember(workspaceId, String(formData.get("memberId") ?? ""));
    revalidatePath("/settings");
    return { success: "Member removed." };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Something went wrong." };
  }
}

export async function transferOwnershipAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const { userId, workspaceId } = await currentWorkspaceId();
    // Deliberately not requireTeamManager (which also allows Admin) —
    // transferOwnership itself re-verifies the caller's own membership is
    // the Owner role before doing anything.
    const acting = await requireTeamManager(userId, workspaceId);
    await transferOwnership(workspaceId, acting.memberId, String(formData.get("toMemberId") ?? ""));
    revalidatePath("/settings");
    return { success: "Ownership transferred." };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Something went wrong." };
  }
}
