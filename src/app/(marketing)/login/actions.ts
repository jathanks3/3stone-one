"use server";

import { redirect } from "next/navigation";
import { createSession } from "@/lib/session";
import { verifyPassword } from "@/lib/password";
import { db } from "@/server/db";
import { DEMO_USER, DEMO_WORKSPACE } from "@/server/mock-data";

export interface LoginFormState {
  error?: string;
}

const GENERIC_LOGIN_ERROR = "Invalid email or password.";

// Real authentication — separate from demoLoginAction below, and never
// sharing a code path with it. A real login always produces isDemo:
// false; nothing here can ever grant staff access to a demo session, and
// nothing in demoLoginAction can ever reach this function.
export async function loginAction(
  _prevState: LoginFormState,
  formData: FormData
): Promise<LoginFormState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Enter an email and password to continue." };
  }

  let user: { id: string; passwordHash: string | null } | null;
  try {
    user = await db.user.findUnique({ where: { email }, select: { id: true, passwordHash: true } });
  } catch (e) {
    // A DB error (e.g. not provisioned yet) must never surface connection
    // detail to the client — same generic message as a wrong password.
    // It must still be visible to whoever operates this app, though —
    // logged server-side (Vercel's own log aggregation today, a real
    // monitoring pipeline once one exists), just never in the response.
    console.error("loginAction: database error during login", e);
    return { error: GENERIC_LOGIN_ERROR };
  }

  // Same generic error whether the email doesn't exist or the password is
  // wrong — telling them apart is a user-enumeration vector.
  if (!user || !user.passwordHash || !(await verifyPassword(password, user.passwordHash))) {
    return { error: GENERIC_LOGIN_ERROR };
  }

  const staffMembership = await db.staffMembership.findUnique({ where: { userId: user.id } });
  const staffRole = staffMembership?.status === "active" ? staffMembership.role : undefined;

  await createSession({ userId: user.id, isDemo: false, ...(staffRole ? { staffRole } : {}) });
  redirect("/dashboard");
}

// The demo — untouched in behavior, explicit about what it is. Always
// isDemo: true, always the same mock identity, never touches the real
// database. See docs/15-company-platform-vision.md: "a demo session must
// never receive a real StaffMembership, query real customer data, or
// access any /3stone-ai/* route" — isDemo: true is what makes every one
// of those true structurally (parseSessionCookie strips staffRole from
// any session where isDemo is true, regardless of what's in the cookie).
export async function demoLoginAction() {
  await createSession({ userId: DEMO_USER.id, workspaceId: DEMO_WORKSPACE.id, isDemo: true });
  redirect("/dashboard");
}
