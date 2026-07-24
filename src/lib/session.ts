import { cookies } from "next/headers";

export const SESSION_COOKIE_NAME = "threestone_session";

// Mirrors prisma/schema.prisma's StaffRole enum — kept as a literal union
// here rather than importing from the generated client, since this file
// runs in proxy.ts's Edge middleware, which the Prisma client can't.
export type StaffRole = "founder" | "operations" | "support";
const STAFF_ROLES: readonly StaffRole[] = ["founder", "operations", "support"];

export interface SessionPayload {
  userId: string;
  workspaceId: string;
  // Orthogonal to workspace membership (docs/15-company-platform-vision.md)
  // — set only for staff with an active StaffMembership. Absent for every
  // customer session. Gates the "3Stone AI" internal section; see
  // proxy.ts and (app)/(platform)/layout.tsx for the enforcement layers —
  // this field alone is never sufficient authorization on its own.
  staffRole?: StaffRole;
}

export async function createSession(payload: SessionPayload) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, JSON.stringify(payload), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

/**
 * The single source of truth for what counts as a valid session cookie —
 * shape-checked, not just present. Pure (no `cookies()`/Node APIs) so it can
 * run in proxy.ts's Edge middleware as well as here.
 */
export function parseSessionCookie(raw: string | undefined | null): SessionPayload | null {
  if (!raw) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (
    typeof parsed === "object" &&
    parsed !== null &&
    typeof (parsed as SessionPayload).userId === "string" &&
    (parsed as SessionPayload).userId.length > 0 &&
    typeof (parsed as SessionPayload).workspaceId === "string" &&
    (parsed as SessionPayload).workspaceId.length > 0
  ) {
    const { userId, workspaceId, staffRole } = parsed as SessionPayload;
    // staffRole is a privilege claim, not a required field — if it's
    // present but doesn't parse to one of the three known roles, drop it
    // rather than reject the whole session. A customer's ordinary session
    // must never be invalidated by a malformed claim to a privilege they
    // never had; a staff claim that doesn't check out must never be
    // trusted either. Fail closed on the sensitive part, not the whole.
    const validStaffRole = typeof staffRole === "string" && STAFF_ROLES.includes(staffRole as StaffRole)
      ? (staffRole as StaffRole)
      : undefined;
    return validStaffRole ? { userId, workspaceId, staffRole: validStaffRole } : { userId, workspaceId };
  }
  return null;
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  return parseSessionCookie(cookieStore.get(SESSION_COOKIE_NAME)?.value);
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}
