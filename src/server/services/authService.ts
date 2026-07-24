import { randomBytes } from "node:crypto";
import { headers } from "next/headers";
import { db } from "@/server/db";
import { hashPassword, verifyPassword } from "@/lib/password";
import { createNotification } from "@/server/services/notificationService";
import { getActiveWorkspaceIdForUser } from "@/server/services/onboardingService";
import { sendEmail } from "@/server/services/emailService";

async function currentOrigin(): Promise<string> {
  const headerList = await headers();
  const host = headerList.get("host");
  const protocol = host?.startsWith("localhost") ? "http" : "https";
  return `${protocol}://${host}`;
}

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
const LOGIN_ATTEMPT_WINDOW_MS = 1000 * 60 * 15; // 15 minutes
const LOGIN_ATTEMPT_LIMIT = 5;
const RESET_REQUEST_WINDOW_MS = 1000 * 60 * 60; // 1 hour
const RESET_REQUEST_LIMIT = 3;

export interface RequestContext {
  ipAddress?: string | null;
  userAgent?: string | null;
}

// DB-backed, not in-memory — a serverless deployment has no shared
// process memory between invocations, so an in-memory counter would
// silently do nothing in production. No new infra (Redis/KV) needed:
// SecurityEvent/PasswordResetToken already record what's needed, this
// just counts recent rows. Scoped to a known account (not IP or a
// nonexistent email) so it never becomes a second enumeration vector —
// see the two call sites below for why.
async function recentEventCount(userId: string, type: string, windowMs: number): Promise<number> {
  return db.securityEvent.count({
    where: { userId, type, createdAt: { gte: new Date(Date.now() - windowMs) } },
  });
}

// Exported so loginAction (a real account under active brute-forcing)
// can check before spending a scrypt hash comparison on every attempt.
// Deliberately keyed on the existing user row, never on the submitted
// email string before it's confirmed to exist — rate-limiting a
// nonexistent email would itself leak "this account doesn't exist" by
// its absence of any limit ever kicking in.
export async function isLoginRateLimited(userId: string): Promise<boolean> {
  return (await recentEventCount(userId, "login_failed", LOGIN_ATTEMPT_WINDOW_MS)) >= LOGIN_ATTEMPT_LIMIT;
}

export async function recordFailedLogin(userId: string, context: RequestContext = {}): Promise<void> {
  await logSecurityEvent(userId, "login_failed", context);
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
): Promise<{ resetToken?: string; delivered?: boolean }> {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await db.user.findUnique({ where: { email: normalizedEmail } });
  if (!user || !user.passwordHash) {
    // No account, or an account that never set a password (mid-signup,
    // or invited-but-never-accepted) — nothing to reset. Silently no-op.
    return {};
  }

  const recentRequests = await db.passwordResetToken.count({
    where: { userId: user.id, createdAt: { gte: new Date(Date.now() - RESET_REQUEST_WINDOW_MS) } },
  });
  if (recentRequests >= RESET_REQUEST_LIMIT) {
    // Same anti-enumeration principle as everywhere else in this file:
    // silently no-op rather than return a "too many requests" error that
    // would itself confirm the account exists.
    return {};
  }

  const token = randomBytes(32).toString("hex");
  await db.passwordResetToken.create({
    data: { token, userId: user.id, expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS) },
  });
  await logSecurityEvent(user.id, "password_reset_requested", context);

  const origin = await currentOrigin();
  const { delivered } = await sendEmail(
    {
      to: normalizedEmail,
      subject: "Reset your password — 3Stone One",
      text: `Reset your password: ${origin}/reset-password/confirm?token=${token}`,
    },
    "password_reset"
  );
  return { resetToken: token, delivered };
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
