import { NextResponse } from "next/server";
import { verifyEmailToken } from "@/server/services/onboardingService";
import { recordLogin } from "@/server/services/authService";
import { createSession } from "@/lib/session";

// A Route Handler, not a page — createSession() sets a cookie, and
// cookie mutation is only allowed in a Server Action or Route Handler,
// never during a plain Server Component's render (same constraint that
// shaped /demo's route.ts earlier in this app's history; same fix here).
//
// A real, single-use, expiring token check (onboardingService.verifyEmailToken).
// Once it succeeds, this creates the real session (isDemo: false, no
// workspaceId or staffRole yet) that carries the rest of the wizard —
// everything after this is just an authenticated flow reading
// getSession(), not a second identity mechanism for "mid-signup" state.
export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token");
  if (!token) {
    return NextResponse.redirect(new URL("/signup?verifyError=missing", request.url));
  }

  try {
    const { userId } = await verifyEmailToken(token);
    const { sessionVersion } = await recordLogin(userId, {
      ipAddress: request.headers.get("x-forwarded-for"),
      userAgent: request.headers.get("user-agent"),
    });
    await createSession({ userId, isDemo: false, sessionVersion });
  } catch (e) {
    console.error("GET /signup/verify: token verification failed", e);
    return NextResponse.redirect(new URL("/signup?verifyError=invalid", request.url));
  }

  return NextResponse.redirect(new URL("/signup/password", request.url));
}
