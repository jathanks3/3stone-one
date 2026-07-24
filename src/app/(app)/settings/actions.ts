"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
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
import { createCheckoutSession, createBillingPortalSession } from "@/server/services/stripeService";
import type { IndustryProfileKey, WorkspacePlan } from "@/types";

export interface ActionState {
  error?: string;
  success?: string;
  // Only set by inviteMemberAction/resendInvitationAction, and only when
  // email delivery isn't actually configured (see emailService.ts) — the
  // same "show the link when it wasn't really sent" pattern used on
  // /signup and /reset-password.
  link?: string;
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
      logoUrl: formData.has("logoUrl") ? String(formData.get("logoUrl") ?? "") : undefined,
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
    const { inviteToken, delivered } = await inviteMember(workspaceId, email, roleName, userId);
    revalidatePath("/settings");
    return {
      success: delivered ? `Invitation emailed to ${email}.` : `Invitation created for ${email} — email delivery isn't configured yet.`,
      link: delivered ? undefined : `/invite/accept?token=${inviteToken}`,
    };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Something went wrong." };
  }
}

export async function resendInvitationAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const { userId, workspaceId } = await currentWorkspaceId();
    await requireTeamManager(userId, workspaceId);
    const { inviteToken, delivered } = await resendInvitation(workspaceId, String(formData.get("invitationId") ?? ""));
    revalidatePath("/settings");
    return {
      success: delivered ? "Reminder emailed." : "Invitation extended — email delivery isn't configured yet.",
      link: delivered ? undefined : `/invite/accept?token=${inviteToken}`,
    };
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

async function currentOrigin(): Promise<string> {
  const headerList = await headers();
  const host = headerList.get("host");
  const protocol = host?.startsWith("localhost") ? "http" : "https";
  return `${protocol}://${host}`;
}

export async function startCheckoutAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { userId, workspaceId } = await currentWorkspaceId();
  await requireTeamManager(userId, workspaceId);
  const planKey = String(formData.get("planKey") ?? "") as Exclude<WorkspacePlan, "free" | "enterprise">;
  const origin = await currentOrigin();

  let url: string;
  try {
    ({ url } = await createCheckoutSession(workspaceId, planKey, {
      successUrl: `${origin}/settings?billing=success`,
      cancelUrl: `${origin}/settings?billing=cancelled`,
    }));
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Checkout is not available yet." };
  }
  redirect(url);
}

export async function openBillingPortalAction(_prev: ActionState, _formData: FormData): Promise<ActionState> {
  const { userId, workspaceId } = await currentWorkspaceId();
  await requireTeamManager(userId, workspaceId);
  const origin = await currentOrigin();

  let url: string;
  try {
    ({ url } = await createBillingPortalSession(workspaceId, `${origin}/settings`));
  } catch (e) {
    return { error: e instanceof Error ? e.message : "No billing account yet." };
  }
  redirect(url);
}
