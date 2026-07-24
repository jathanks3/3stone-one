import { NextResponse } from "next/server";
import { getSession, hasStaffAccess, type SessionPayload, type StaffRole } from "@/lib/session";
import { isSessionVersionCurrent } from "./sessionSecurity";

type StaffSession = SessionPayload & { staffRole: StaffRole };

// Layer 3 of 4 (see docs/15-company-platform-vision.md). Every
// /api/v1/platform/* route calls this itself — it never assumes the
// request only reached it because middleware or a layout already
// checked. A route handler that trusted "the page wouldn't have rendered
// the button that called me" would be one refactor away from becoming
// reachable without that page at all.
export async function requireStaff(): Promise<{ session: StaffSession } | { response: NextResponse }> {
  const session = await getSession();
  if (!hasStaffAccess(session) || !(await isSessionVersionCurrent(session))) {
    return { response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { session };
}
