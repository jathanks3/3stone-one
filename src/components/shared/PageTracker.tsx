"use client";

import { usePageTracking } from "@/hooks/usePageTracking";

// Mounted once in the root layout so every route (marketing, signup,
// dashboard, Founder Platform) gets pageview tracking, not just the
// authenticated (app) area.
export function PageTracker() {
  usePageTracking();
  return null;
}
