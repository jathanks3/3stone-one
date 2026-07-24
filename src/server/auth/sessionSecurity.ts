import { db } from "@/server/db";
import type { SessionPayload } from "@/lib/session";

// The DB half of session revocation (see lib/session.ts's sessionVersion
// comment) for the two call sites that don't already have the owning
// User row in hand from another query: the 3stone-ai staff layout and
// requireStaff's API guard. (app)/layout.tsx does this check inline
// instead, since it already fetches the User row for its own purposes.
export async function isSessionVersionCurrent(session: SessionPayload): Promise<boolean> {
  if (session.isDemo) return true; // nothing to revoke — demo never has a User row's sessionVersion to compare
  const user = await db.user.findUnique({ where: { id: session.userId }, select: { sessionVersion: true } });
  return user !== null && user.sessionVersion === session.sessionVersion;
}
