import { randomBytes } from "node:crypto";
import { headers } from "next/headers";
import { db } from "@/server/db";
import { hashPassword } from "@/lib/password";
import { createNotification } from "@/server/services/notificationService";
import { sendEmail } from "@/server/services/emailService";

async function currentOrigin(): Promise<string> {
  const headerList = await headers();
  const host = headerList.get("host");
  const protocol = host?.startsWith("localhost") ? "http" : "https";
  return `${protocol}://${host}`;
}

const INVITATION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

// Roles a workspace owner can invite someone into or reassign someone to.
// "Owner" is deliberately excluded — there is exactly one per workspace,
// changed only via transferOwnership, never via a role dropdown.
export const ASSIGNABLE_ROLE_NAMES = ["Admin", "Manager", "Member", "Client"] as const;
export type AssignableRoleName = (typeof ASSIGNABLE_ROLE_NAMES)[number];

// Every mutation below is reached through a Server Action that already
// derived workspaceId from the caller's own session (never from
// client-supplied input — see Settings actions.ts), which is what makes
// this a tenant-isolation check and not just a permission check: it's
// impossible to pass a different workspace's id in and manage its team
// instead of your own, because the workspaceId this function receives
// was never in the client's control to begin with.
export async function requireTeamManager(userId: string, workspaceId: string): Promise<{ memberId: string }> {
  const member = await db.workspaceMember.findFirst({
    where: { userId, workspaceId, status: "active" },
    include: { role: true },
  });
  if (!member || !["Owner", "Admin"].includes(member.role.name)) {
    throw new Error("Only the workspace owner or an admin can manage the team.");
  }
  return { memberId: member.id };
}

export interface TeamMemberRow {
  id: string;
  userId: string;
  name: string;
  email: string;
  roleId: string;
  roleName: string;
  status: "active" | "invited" | "suspended";
  joinedAt: Date;
}

export interface PendingInvitationRow {
  id: string;
  email: string;
  roleName: string;
  invitedByName: string;
  expiresAt: Date;
  createdAt: Date;
}

// Only "active" — removeMember sets status to "suspended" rather than
// deleting the row (preserves history: who was on this workspace, and
// when), but a suspended member is exactly what "removed" means for this
// table. They must disappear from it, not linger with a different label.
export async function listMembers(workspaceId: string): Promise<TeamMemberRow[]> {
  const members = await db.workspaceMember.findMany({
    where: { workspaceId, status: "active" },
    include: { user: true, role: true },
    orderBy: { joinedAt: "asc" },
  });
  return members.map((m) => ({
    id: m.id,
    userId: m.userId,
    name: m.user.name,
    email: m.user.email,
    roleId: m.roleId,
    roleName: m.role.name,
    status: m.status,
    joinedAt: m.joinedAt,
  }));
}

export async function listPendingInvitations(workspaceId: string): Promise<PendingInvitationRow[]> {
  const invitations = await db.invitation.findMany({
    where: { workspaceId, status: "pending" },
    include: { role: true, invitedBy: true },
    orderBy: { createdAt: "desc" },
  });
  return invitations.map((i) => ({
    id: i.id,
    email: i.email,
    roleName: i.role.name,
    invitedByName: i.invitedBy.name,
    expiresAt: i.expiresAt,
    createdAt: i.createdAt,
  }));
}

async function getAssignableRole(roleName: AssignableRoleName) {
  return db.role.findFirstOrThrow({ where: { name: roleName, workspaceId: null, isSystemRole: true } });
}

// Creates a standing offer to join — deliberately does NOT create a
// WorkspaceMember row. Accepting the invitation (acceptInvitation below)
// is what does that; an Invitation is not membership itself, so it can
// be resent or revoked without ever having touched membership.
export async function inviteMember(
  workspaceId: string,
  email: string,
  roleName: AssignableRoleName,
  invitedByUserId: string
): Promise<{ invitationId: string; inviteToken: string; delivered: boolean }> {
  const normalizedEmail = email.trim().toLowerCase();

  const existingMember = await db.workspaceMember.findFirst({
    where: { workspaceId, user: { email: normalizedEmail }, status: { in: ["active", "invited"] } },
  });
  if (existingMember) {
    throw new Error("This person is already a member of this workspace.");
  }
  const existingInvitation = await db.invitation.findFirst({
    where: { workspaceId, email: normalizedEmail, status: "pending" },
  });
  if (existingInvitation) {
    throw new Error("An invitation is already pending for this email — resend it instead of creating a new one.");
  }

  const role = await getAssignableRole(roleName);
  // A bare User row (no password yet) so the invitation has a real user
  // to point at — the invited person sets their own password when they
  // accept, exactly like onboardingService.setPassword for a fresh
  // signup. Never upserts over an existing password.
  await db.user.upsert({
    where: { email: normalizedEmail },
    update: {},
    create: { email: normalizedEmail, name: normalizedEmail.split("@")[0] },
  });

  const inviteToken = randomBytes(32).toString("hex");
  const invitation = await db.invitation.create({
    data: {
      workspaceId,
      email: normalizedEmail,
      roleId: role.id,
      invitedByUserId,
      token: inviteToken,
      expiresAt: new Date(Date.now() + INVITATION_TTL_MS),
    },
  });

  const origin = await currentOrigin();
  const { delivered } = await sendEmail(
    {
      to: normalizedEmail,
      subject: "You're invited to 3Stone One",
      text: `You've been invited to join a workspace on 3Stone One: ${origin}/invite/accept?token=${inviteToken}`,
    },
    "team_invitation"
  );

  return { invitationId: invitation.id, inviteToken, delivered };
}

export async function resendInvitation(workspaceId: string, invitationId: string): Promise<{ inviteToken: string; delivered: boolean }> {
  const invitation = await db.invitation.findFirst({ where: { id: invitationId, workspaceId, status: "pending" } });
  if (!invitation) {
    throw new Error("Invitation not found.");
  }
  // Resending extends the expiry rather than minting a new token — the
  // link already sent in the first email stays valid.
  await db.invitation.update({
    where: { id: invitationId },
    data: { expiresAt: new Date(Date.now() + INVITATION_TTL_MS) },
  });
  const origin = await currentOrigin();
  const { delivered } = await sendEmail(
    {
      to: invitation.email,
      subject: "Reminder: you're invited to 3Stone One",
      text: `Reminder — you've been invited to join a workspace on 3Stone One: ${origin}/invite/accept?token=${invitation.token}`,
    },
    "team_invitation_reminder"
  );
  return { inviteToken: invitation.token, delivered };
}

export async function revokeInvitation(workspaceId: string, invitationId: string): Promise<void> {
  const invitation = await db.invitation.findFirst({ where: { id: invitationId, workspaceId, status: "pending" } });
  if (!invitation) {
    throw new Error("Invitation not found.");
  }
  await db.invitation.update({ where: { id: invitationId }, data: { status: "revoked", revokedAt: new Date() } });
}

export async function changeRole(workspaceId: string, memberId: string, roleName: AssignableRoleName): Promise<void> {
  const member = await db.workspaceMember.findFirst({ where: { id: memberId, workspaceId }, include: { role: true } });
  if (!member) {
    throw new Error("Member not found.");
  }
  if (member.role.name === "Owner") {
    throw new Error("Use ownership transfer to change the workspace owner's role.");
  }
  const role = await getAssignableRole(roleName);
  const [workspace] = await db.$transaction([
    db.workspace.findUniqueOrThrow({ where: { id: workspaceId } }),
    db.workspaceMember.update({ where: { id: memberId }, data: { roleId: role.id } }),
  ]);
  await createNotification(workspaceId, member.userId, "role_changed", { roleName, workspaceName: workspace.name });
}

export async function removeMember(workspaceId: string, memberId: string): Promise<void> {
  const member = await db.workspaceMember.findFirst({ where: { id: memberId, workspaceId }, include: { role: true } });
  if (!member) {
    throw new Error("Member not found.");
  }
  if (member.role.name === "Owner") {
    throw new Error("The workspace owner can't be removed — transfer ownership first.");
  }
  await db.workspaceMember.update({ where: { id: memberId }, data: { status: "suspended" } });
}

// Reassigns the single "Owner" role from one member to another within
// the same workspace — the current owner becomes an Admin (still a full
// member, just no longer sole owner), never left without any role at all.
export async function transferOwnership(workspaceId: string, fromMemberId: string, toMemberId: string): Promise<void> {
  const [fromMember, toMember, ownerRole, adminRole] = await Promise.all([
    db.workspaceMember.findFirst({ where: { id: fromMemberId, workspaceId }, include: { role: true } }),
    db.workspaceMember.findFirst({ where: { id: toMemberId, workspaceId } }),
    db.role.findFirstOrThrow({ where: { name: "Owner", workspaceId: null, isSystemRole: true } }),
    db.role.findFirstOrThrow({ where: { name: "Admin", workspaceId: null, isSystemRole: true } }),
  ]);
  if (!fromMember || fromMember.role.name !== "Owner") {
    throw new Error("Only the current owner can transfer ownership.");
  }
  if (!toMember || toMember.status !== "active") {
    throw new Error("Target member not found.");
  }
  await db.$transaction([
    db.workspaceMember.update({ where: { id: toMemberId }, data: { roleId: ownerRole.id } }),
    db.workspaceMember.update({ where: { id: fromMemberId }, data: { roleId: adminRole.id } }),
  ]);
}

export interface InvitationPreview {
  workspaceName: string;
  roleName: string;
  email: string;
  needsPassword: boolean;
}

export async function previewInvitation(token: string): Promise<InvitationPreview> {
  const invitation = await db.invitation.findUnique({
    where: { token },
    include: { workspace: true, role: true },
  });
  if (!invitation || invitation.status !== "pending" || invitation.expiresAt < new Date()) {
    throw new Error("This invitation is invalid or has expired.");
  }
  const user = await db.user.findUnique({ where: { email: invitation.email } });
  return {
    workspaceName: invitation.workspace.name,
    roleName: invitation.role.name,
    email: invitation.email,
    needsPassword: !user?.passwordHash,
  };
}

// Sets the invited person's password (only reachable for an invitation
// that still needs one — previewInvitation.needsPassword) and creates
// their real, active WorkspaceMember row in one step. Returns the
// sessionVersion so the caller can log them straight into the new
// workspace, same pattern as onboardingService/authService.
export async function acceptInvitationWithNewPassword(
  token: string,
  password: string
): Promise<{ userId: string; sessionVersion: number }> {
  if (password.length < 12) {
    throw new Error("Password must be at least 12 characters.");
  }
  const invitation = await db.invitation.findUnique({ where: { token } });
  if (!invitation || invitation.status !== "pending" || invitation.expiresAt < new Date()) {
    throw new Error("This invitation is invalid or has expired.");
  }
  const user = await db.user.findUnique({ where: { email: invitation.email } });
  if (!user || user.passwordHash) {
    throw new Error("This account already has a password — log in, then reopen this invite link.");
  }

  const passwordHash = await hashPassword(password);

  const [updatedUser] = await db.$transaction([
    db.user.update({
      where: { id: user.id },
      data: { passwordHash, emailVerifiedAt: new Date() },
      select: { sessionVersion: true },
    }),
    db.workspaceMember.upsert({
      where: { workspaceId_userId: { workspaceId: invitation.workspaceId, userId: user.id } },
      update: { status: "active", roleId: invitation.roleId },
      create: { workspaceId: invitation.workspaceId, userId: user.id, roleId: invitation.roleId, status: "active" },
    }),
    db.invitation.update({ where: { token }, data: { status: "accepted", acceptedAt: new Date() } }),
  ]);

  const role = await db.role.findUnique({ where: { id: invitation.roleId } });
  await createNotification(invitation.workspaceId, invitation.invitedByUserId, "invitation_accepted", {
    memberName: user.name,
    roleName: role?.name ?? "a member",
  });

  return { userId: user.id, sessionVersion: updatedUser.sessionVersion };
}
