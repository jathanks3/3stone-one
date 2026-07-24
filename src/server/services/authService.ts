import { randomBytes } from "node:crypto";
import { db } from "@/server/db";
import { hashPassword, verifyPassword } from "@/lib/password";
import { createNotification } from "@/server/services/notificationService";
import { getActiveWorkspaceIdForUser } from "@/server/services/onboardingService";

// A password-changed notification is workspace-scoped (Notification's
// schema), but this service only knows a userId — reused from
// onboardingService rather than duplicated. A pure staff-only account
// with no workspace membership yet simply gets no notification; nothing
// breaks, there's just nowhere to put it.
async function notifyPasswordChanged(userId: string, via: "reset" | "profile"): Promise<void> {
  const workspaceId = await getActiveWorkspaceIdForUser(userId);
  if (workspaceId) {
    await createNotification(workspaceId, userId, "password_changed", { via });
  }
}

const RESET_TOKEN_TTL_MS = 1000 * 60 * 60; // 1 hour — shorter than email verification's 24h; a reset token grants account takeover, not just proof of email ownership.

export interface RequestContext {
  ipAddress?: string | null;
  userAgent?: string | null;
}

async function logSecurityEvent(
  userId: string,
  type: string,
  context: RequestContext = {},
  metadata?: Record<string, unknown>
): Promise<void> {
  await db.securityEvent.create({
    data: {
      userId,
      type,
      ipAddress: context.ipAddress ?? undefined,
      userAgent: context.userAgent ?? undefined,
      metadata: metadata as never,
    },
  });
}

// Called at every real (non-demo) session creation. Returns the user's
// current sessionVersion so the caller can embed it in the new session
// cookie (lib/session.ts) — the number that later gets compared against
// the DB on every request, and that a password change/reset bumps to
// invalidate every cookie issued before it.
export async function recordLogin(userId: string, context: RequestContext = {}): Promise<{ sessionVersion: number }> {
  const user = await db.user.update({
    where: { id: userId },
    data: { lastLoginAt: new Date() },
    select: { sessionVersion: true },
  });
  await logSecurityEvent(userId, "login", context);
  return { sessionVersion: user.sessionVersion };
}

export async function getSecurityEvents(userId: string, limit = 20) {
  return db.securityEvent.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

// Anti-enumeration by design: the caller (the Server Action behind
// /reset-password) shows the exact same generic confirmation message
// whether or not `resetToken` comes back set — same principle as
// loginAction's single generic "Invalid email or password." for both a
// wrong password and a nonexistent account. `resetToken` is returned
// directly (not console.log-scraped) for the same reason
// onboardingService.startSignup returns its verification token directly:
// console.log is a shared global, and scraping it would race under
// concurrent requests.
export async function requestPasswordReset(
  email: string,
  context: RequestContext = {}
): Promise<{ resetToken?: string }> {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await db.user.findUnique({ where: { email: normalizedEmail } });
  if (!user || !user.passwordHash) {
    // No account, or an account that never set a password (mid-signup,
    // or invited-but-never-accepted) — nothing to reset. Silently no-op.
    return {};
  }

  const token = randomBytes(32).toString("hex");
  await db.passwordResetToken.create({
    data: { token, userId: user.id, expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS) },
  });
  await logSecurityEvent(user.id, "password_reset_requested", context);

  // Same stubbed-delivery boundary as onboardingService.startSignup's
  // verification email: real delivery needs a verified sending domain
  // (a DNS change), which is an explicit approval boundary, not something
  // to fake here. The token itself is fully real.
  console.log(`[stub email] Reset your password: /reset-password/confirm?token=${token}`);
  return { resetToken: token };
}

export async function validateResetToken(token: string): Promise<{ userId: string }> {
  const record = await db.passwordResetToken.findUnique({ where: { token } });
  if (!record || record.usedAt || record.expiresAt < new Date()) {
    throw new Error("This password reset link is invalid or has expired.");
  }
  return { userId: record.userId };
}

// Completes a reset (logged-out flow, via the emailed token). Bumps
// sessionVersion so every session that existed before this moment —
// including, notably, whatever session an attacker who triggered this
// reset might have had — stops verifying.
export async function completePasswordReset(
  token: string,
  newPassword: string,
  context: RequestContext = {}
): Promise<{ userId: string; sessionVersion: number }> {
  if (newPassword.length < 12) {
    throw new Error("Password must be at least 12 characters.");
  }
  const { userId } = await validateResetToken(token);

  const passwordHash = await hashPassword(newPassword);
  const [user] = await db.$transaction([
    db.user.update({
      where: { id: userId },
      data: { passwordHash, sessionVersion: { increment: 1 } },
      select: { sessionVersion: true },
    }),
    db.passwordResetToken.update({ where: { token }, data: { usedAt: new Date() } }),
  ]);
  await logSecurityEvent(userId, "password_changed", context, { via: "reset" });
  await notifyPasswordChanged(userId, "reset");

  return { userId, sessionVersion: user.sessionVersion };
}

// Changes a password from within an authenticated session (User Profile's
// "password change"), as opposed to the logged-out reset-token flow
// above. Also bumps sessionVersion — the caller must re-create the
// current browser's own session cookie with the new version afterward so
// the acting user isn't logged out of their own action, while any other
// device's session does become invalid.
export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
  context: RequestContext = {}
): Promise<{ sessionVersion: number }> {
  if (newPassword.length < 12) {
    throw new Error("Password must be at least 12 characters.");
  }
  const user = await db.user.findUniqueOrThrow({ where: { id: userId } });
  if (!user.passwordHash || !(await verifyPassword(currentPassword, user.passwordHash))) {
    throw new Error("Current password is incorrect.");
  }

  const passwordHash = await hashPassword(newPassword);
  const updated = await db.user.update({
    where: { id: userId },
    data: { passwordHash, sessionVersion: { increment: 1 } },
    select: { sessionVersion: true },
  });
  await logSecurityEvent(userId, "password_changed", context, { via: "profile" });
  await notifyPasswordChanged(userId, "profile");

  return { sessionVersion: updated.sessionVersion };
}
