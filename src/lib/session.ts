import { cookies } from "next/headers";

export const SESSION_COOKIE_NAME = "threestone_session";

export interface SessionPayload {
  userId: string;
  workspaceId: string;
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
    return parsed as SessionPayload;
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
