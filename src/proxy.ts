import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE_NAME, parseSessionCookie, hasStaffAccess } from "@/lib/session";

const PUBLIC_ROUTES = ["/login", "/demo"];
const STAFF_PREFIX = "/3stone-ai";
// Routes reachable regardless of session state — neither "logged-out
// only" (like /login) nor "logged-in only": a brand new visitor can
// arrive with no session at all, but partway through (email verified,
// invitation not yet accepted) they carry a real, if
// not-yet-workspace-having, session. None of these should ever trigger
// the "already logged in, go to /dashboard" rule below, or the flow
// would boot them out the moment they have a session at all.
const ALWAYS_ACCESSIBLE_PREFIXES = ["/signup", "/reset-password", "/invite", "/pricing"];

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
  const isAlwaysAccessibleRoute = ALWAYS_ACCESSIBLE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
  // /logout must always reach its Route Handler unconditionally, same
  // reasoning as the prefixes above — but it's never bounced by the
  // "already logged in" rule below for a different reason: that rule
  // exists to keep a logged-in user off the login form, but a session
  // that's cryptographically valid yet failed a deeper, DB-only check
  // (sessionVersion revocation — see (app)/layout.tsx and
  // 3stone-ai/layout.tsx, neither of which proxy.ts's Edge runtime can
  // run) still parses as "logged in" here. Without this carve-out,
  // redirecting a revoked session to /logout would immediately bounce
  // back to /dashboard, which bounces back to /login... forever.
  const isLogoutRoute = pathname === "/logout";

  // (app)/layout.tsx needs to know the requested pathname to enforce
  // per-edition module access (see src/lib/editionModules.ts) - a shared
  // layout has no direct way to see which page under it is being
  // rendered, so it's forwarded as a request header, a standard pattern
  // for this in the App Router.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", pathname);
  const nextWithPathname = () => NextResponse.next({ request: { headers: requestHeaders } });

  let response: NextResponse;
  // Layer 1 of 4 (see docs/15-company-platform-vision.md): checked first
  // and independently of the general auth gate below, because a customer
  // session is a valid *reason to proceed elsewhere*, not a valid reason
  // to proceed here. hasStaffAccess already refuses any demo session
  // structurally, not just by convention.
  if (isStaffRoute && !hasStaffAccess(session)) {
    response = NextResponse.redirect(new URL(hasSession ? "/dashboard" : "/login", request.url));
  } else if (isAlwaysAccessibleRoute || isLogoutRoute) {
    response = nextWithPathname();
  } else if (!hasSession && !isPublicRoute && pathname !== "/") {
    response = NextResponse.redirect(new URL("/login", request.url));
  } else if (hasSession && isPublicRoute) {
    response = NextResponse.redirect(new URL("/dashboard", request.url));
  } else {
    response = nextWithPathname();
  }

  if (hasInvalidCookie) {
    response.cookies.delete(SESSION_COOKIE_NAME);
  }

  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\.(?:png|svg|ico)$).*)"],
};
