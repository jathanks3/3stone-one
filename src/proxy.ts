import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE_NAME, parseSessionCookie } from "@/lib/session";

const PUBLIC_ROUTES = ["/login", "/demo"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const rawCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const hasSession = parseSessionCookie(rawCookie) !== null;
  // A cookie can be present but fail shape validation (corrupted, tampered,
  // or from a stale format) — that must be treated as no session at all,
  // not silently trusted, and not left behind for the next request to trip
  // over again.
  const hasInvalidCookie = Boolean(rawCookie) && !hasSession;
  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

  let response: NextResponse;
  if (!hasSession && !isPublicRoute && pathname !== "/") {
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
