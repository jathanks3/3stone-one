import { NextResponse } from "next/server";
import { deleteSession } from "@/lib/session";

// A Route Handler, not a page — deleting a cookie is only allowed in a
// Server Action or Route Handler, never a plain Server Component render
// (same constraint /demo and /signup/verify were built around).
//
// This is both the real "Log out" action and the only safe redirect
// target for a session that fails the sessionVersion check
// ((app)/layout.tsx, 3stone-ai/layout.tsx): that cookie is still
// cryptographically valid (correctly signed), so proxy.ts's Edge-only,
// DB-free check still sees "logged in" and would bounce a plain
// /login redirect straight back to /dashboard — an infinite loop between
// the Edge layer (which can't see sessionVersion) and the layout (which
// can). Actually deleting the cookie here breaks that loop for good.
export async function GET(request: Request) {
  await deleteSession();
  return NextResponse.redirect(new URL("/login", request.url));
}
