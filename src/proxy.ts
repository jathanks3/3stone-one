import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE_NAME, parseSessionCookie, hasStaffAccess } from "@/lib/session";

const PUBLIC_ROUTES = ["/login", "/demo"];
const STAFF_PREFIX = "/3stone-ai";
const SIGNUP_PREFIX = "/signup";
const RESET_PASSWORD_PREFIX = "/reset-password";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const rawCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = await parseSessionCookie(rawCookie);
  const hasSession = session !== null;
  // A cookie can be present but fail shape validation (corrupted, tampered,
  // or from a stale format) — that must be treated as no session at all,
  // not silently trusted, and not left behind for the next request to trip
  // over again.
  const hasInvalidCookie = Boolean(rawCookie) && !hasSession;
  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);
  const isStaffRoute = pathname === STAFF_PREFIX || pathname.startsWith(`${STAFF_PREFIX}/`);
  // /signup is neither "logged-out only" nor "logged-in only" — a brand
  // new visitor starts it with no session at all, but partway through
  // (once their email is verified) they carry a real, if
  // not-yet-workspace-having, session for the rest of the wizard. It
  // must never trigger the "already logged in, go to /dashboard" rule
  // below, or the wizard would boot them out the moment they have a
  // session at all.
  const isSignupRoute = pathname === SIGNUP_PREFIX || pathname.startsWith(`${SIGNUP_PREFIX}/`);
  // Same reasoning as /signup: reset-password can be hit by someone with
  // no session at all (the common case, via an emailed link) or by
  // someone who's already logged in (they might just prefer to reset
  // rather than remember) — never a reason to bounce either way.
  const isResetPasswordRoute =
    pathname === RESET_PASSWORD_PREFIX || pathname.startsWith(`${RESET_PASSWORD_PREFIX}/`);
  // /logout must always reach its Route Handler unconditionally, the same
  // way /signup does — never bounced by the "already logged in" rule
  // below. That rule exists to keep a logged-in user off the login form,
  // but a session that's cryptographically valid yet failed a deeper,
  // DB-only check (sessionVersion revocation — see (app)/layout.tsx and
  // 3stone-ai/layout.tsx, neither of which proxy.ts's Edge runtime can
  // run) still parses as "logged in" here. Without this carve-out,
  // redirecting a revoked session to /logout would immediately bounce
  // back to /dashboard, which bounces back to /login... forever.
  const isLogoutRoute = pathname === "/logout";

  let response: NextResponse;
  // Layer 1 of 4 (see docs/15-company-platform-vision.md): checked first
  // and independently of the general auth gate below, because a customer
  // session is a valid *reason to proceed elsewhere*, not a valid reason
  // to proceed here. hasStaffAccess already refuses any demo session
  // structurally, not just by convention.
  if (isStaffRoute && !hasStaffAccess(session)) {
    response = NextResponse.redirect(new URL(hasSession ? "/dashboard" : "/login", request.url));
  } else if (isSignupRoute || isLogoutRoute || isResetPasswordRoute) {
    response = NextResponse.next();
  } else if (!hasSession && !isPublicRoute && pathname !== "/") {
    response = NextResponse.redirect(new URL("/login", request.url));
  } else if (hasSession && isPublicRoute) {
    response = NextResponse.redirect(new URL("/dashboard", request.url));
  } else {
    response = NextResponse.next();
  }

  if (hasInvalidCookie) {
    response.cookies.delete(SESSION_COOKIE_NAME);
  }

  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\.(?:png|svg|ico)$).*)"],
};
