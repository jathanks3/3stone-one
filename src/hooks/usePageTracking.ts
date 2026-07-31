"use client";

// Fires a pageview event to /api/track on every route change. Best-
// effort and silent on failure - analytics must never affect the real
// user experience. sessionId is a random token in sessionStorage (resets
// per browser tab session), never tied to a real account or IP client-side.
import { useEffect } from "react";
import { usePathname } from "next/navigation";

const SESSION_KEY = "one_analytics_session";

function getSessionId(): string {
  let id = sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

function track(eventType: "pageview" | "click", path: string) {
  const sessionId = getSessionId();
  fetch("/api/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ eventType, path, sessionId }),
    keepalive: true,
  }).catch(() => {});
}

export function usePageTracking() {
  const pathname = usePathname();

  useEffect(() => {
    // Excludes the internal Founder Platform (/3stone-ai) - staff
    // browsing their own tools shouldn't inflate customer traffic
    // numbers. Path-based, not session-based: cheap, and the prefix is
    // unambiguous regardless of auth state.
    if (pathname === "/3stone-ai" || pathname.startsWith("/3stone-ai/")) return;
    track("pageview", pathname);
  }, [pathname]);
}
