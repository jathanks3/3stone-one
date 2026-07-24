import { cookies } from "next/headers";

export const SESSION_COOKIE_NAME = "threestone_session";

// Mirrors prisma/schema.prisma's StaffRole enum — kept as a literal union
// here rather than importing from the generated client, since this file
// runs in proxy.ts's Edge middleware, which the Prisma client can't.
export type StaffRole = "founder" | "operations" | "support";
const STAFF_ROLES: readonly StaffRole[] = ["founder", "operations", "support"];

export interface SessionPayload {
  userId: string;
  // Optional: a pure-staff session (someone with only a StaffMembership,
  // no workspace of their own) has nothing meaningful to put here yet —
  // there's no self-serve "create your own workspace" flow in this app.
  workspaceId?: string;
  // Required, never inferred — every session must explicitly say which
  // world it belongs to. The default on any ambiguity is `true` (demo),
  // not `false` (real) — see parseSessionCookie: unknown must never be
  // trusted with real/staff access.
  isDemo: boolean;
  // Orthogonal to workspace membership (docs/15-company-platform-vision.md)
  // — set only for staff with an active StaffMembership, and only ever
  // meaningful when isDemo is false (see parseSessionCookie: a demo
  // session can never carry a staffRole, structurally, even if some other
  // bug tried to attach one). Gates the "3Stone AI" internal section; see
  // proxy.ts and (app)/3stone-ai/layout.tsx for the enforcement layers —
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
    typeof parsed !== "object" ||
    parsed === null ||
    typeof (parsed as SessionPayload).userId !== "string" ||
    (parsed as SessionPayload).userId.length === 0
  ) {
    return null;
  }

  const raw2 = parsed as SessionPayload;

  // Demo-ness is never inferred from absence — but if the field is
  // missing or malformed, the only safe default is `true`. Treating an
  // ambiguous session as "real" would be the one bug in this file that
  // could actually let a demo session touch something it shouldn't.
  const isDemo = typeof raw2.isDemo === "boolean" ? raw2.isDemo : true;

  const workspaceId =
    typeof raw2.workspaceId === "string" && raw2.workspaceId.length > 0 ? raw2.workspaceId : undefined;

  // staffRole is a privilege claim, not a required field — if it's present
  // but doesn't parse to one of the three known roles, or the session is
  // demo, drop it rather than reject the whole session. A session must
  // never be invalidated by a malformed claim to a privilege it never
  // had; a staff claim that doesn't check out (or belongs to a demo
  // session) must never be trusted either. Fail closed on the sensitive
  // part, not the whole.
  const staffRole =
    !isDemo && typeof raw2.staffRole === "string" && STAFF_ROLES.includes(raw2.staffRole as StaffRole)
      ? (raw2.staffRole as StaffRole)
      : undefined;

  return {
    userId: raw2.userId,
    ...(workspaceId ? { workspaceId } : {}),
    isDemo,
    ...(staffRole ? { staffRole } : {}),
  };
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  return parseSessionCookie(cookieStore.get(SESSION_COOKIE_NAME)?.value);
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * True only for a session that is both authenticated as staff AND not a
 * demo session — the one check every layer of the "3Stone AI" section's
 * authorization (middleware, section layout, API, nav) must use. Never
 * check `staffRole` alone; parseSessionCookie already strips staffRole
 * from demo sessions, but this helper exists so every call site reads
 * the same intent instead of re-deriving it.
 */
export function hasStaffAccess(session: SessionPayload | null): session is SessionPayload & { staffRole: StaffRole } {
  return Boolean(session && !session.isDemo && session.staffRole);
}
