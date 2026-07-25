import { db } from "@/server/db";
import type { StaffRole } from "../../../../generated/prisma/client";

export interface StaffListItem {
  membershipId: string;
  userId: string;
  name: string;
  email: string;
  role: StaffRole;
  status: "active" | "revoked";
  grantedAt: Date;
}

export async function listStaff(): Promise<StaffListItem[]> {
  const rows = await db.staffMembership.findMany({
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { grantedAt: "asc" },
  });
  return rows.map((r) => ({
    membershipId: r.id,
    userId: r.user.id,
    name: r.user.name,
    email: r.user.email,
    role: r.role,
    status: r.status,
    grantedAt: r.grantedAt,
  }));
}

// Grants staff access to an email. If no User exists yet for that email,
// creates one (no password set — they set their own via the existing
// forgot-password flow, same as any first-time credential bootstrap in
// this app; there is no separate staff-invitation email system yet).
export async function grantStaffAccess(input: {
  email: string;
  name: string;
  role: StaffRole;
  grantedByUserId: string;
}): Promise<{ error?: string }> {
  const existingMembership = await db.staffMembership.findFirst({
    where: { user: { email: input.email } },
  });
  if (existingMembership) {
    return { error: "This email already has staff access (or a revoked record) — check the list below." };
  }

  const user = await db.user.upsert({
    where: { email: input.email },
    update: {},
    create: { email: input.email, name: input.name },
  });

  await db.staffMembership.create({
    data: { userId: user.id, role: input.role, status: "active", grantedByUserId: input.grantedByUserId },
  });
  return {};
}

// Revocation must take effect immediately, not just on next login — so
// this also bumps the user's sessionVersion, which invalidates any
// already-issued session cookie (see (marketing)/login/actions.ts and
// lib/session.ts's isSessionVersionCurrent). Setting status alone would
// only stop a *future* login from getting staffRole; an already-logged-in
// revoked staff member would keep working until their cookie expired.
export async function revokeStaffAccess(membershipId: string): Promise<void> {
  const membership = await db.staffMembership.findUniqueOrThrow({ where: { id: membershipId } });
  await db.$transaction([
    db.staffMembership.update({
      where: { id: membershipId },
      data: { status: "revoked", revokedAt: new Date() },
    }),
    db.user.update({
      where: { id: membership.userId },
      data: { sessionVersion: { increment: 1 } },
    }),
  ]);
}
