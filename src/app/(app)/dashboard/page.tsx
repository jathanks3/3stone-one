import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { DashboardClient } from "@/features/dashboard/DashboardClient";
import { RealDashboard } from "@/features/dashboard/RealDashboard";
import { getSession, hasStaffAccess } from "@/lib/session";
import { getDashboardData } from "@/server/services/dashboardService";
import { db } from "@/server/db";

export const metadata: Metadata = {
  title: "Dashboard — 3Stone One",
};

// First module converted per the founder's charter's conversion order.
// Demo path is byte-for-byte unchanged (DashboardClient, untouched, still
// reading mock data — a demo session must never touch the database at
// all, not just "see different data"). A real session gets its own real
// workspace's real counts, via the same session/workspace resolution
// (app)/layout.tsx just did — this page doesn't re-derive workspace
// membership itself, it trusts the layout already proved it and just
// needs the workspace id.
export default async function DashboardPage() {
  const session = await getSession();

  if (!session || session.isDemo) {
    return <DashboardClient />;
  }

  // (app)/layout.tsx already redirected away any real session without a
  // resolvable workspace before this page could render — but this file
  // doesn't share that lookup, so it re-derives just the id it needs
  // rather than assuming. Not a demo fallback: if this ever legitimately
  // fails, that's a bug to see, not a screen to paper over with mock data.
  const membership = await db.workspaceMember.findFirst({
    where: { userId: session.userId, status: "active" },
    select: { workspaceId: true },
    orderBy: { joinedAt: "asc" },
  });
  if (!membership) {
    // (app)/layout.tsx already redirects a real session with no workspace
    // before this page renders — reaching here means that check was
    // bypassed somehow, which is a bug to surface, not a case to paper
    // over with demo or placeholder data.
    redirect(hasStaffAccess(session) ? "/3stone-ai" : "/login");
  }

  const data = await getDashboardData(membership.workspaceId);
  return <RealDashboard data={data} />;
}
