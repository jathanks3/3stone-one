import { redirect } from "next/navigation";
import { DEMO_USER, DEMO_WORKSPACE } from "@/server/mock-data";
import { getSession, hasStaffAccess } from "@/lib/session";
import { db } from "@/server/db";
import { IndustryProvider } from "@/lib/industry";
import { AppShell } from "@/components/shell/AppShell";
import type { IndustryProfileKey, SessionUser } from "@/types";

// Deliberately dynamic again — see the comment this replaces in git
// history. That version's whole justification was "every session sees
// identical, non-personalized content, so caching it is free and safe."
// That justification stopped being true the moment a real, per-customer
// workspace could exist: a real session's dashboard MUST be its own
// workspace's data, never another customer's and never the demo's, which
// is inherently per-request work, not a caching problem to solve. Demo
// sessions still cost nothing extra here (no DB read at all, same mock
// objects as before) — only real sessions pay for a real lookup, and only
// because they now have something real to look up.
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  let workspace: { id: string; name: string; industryProfileKey: IndustryProfileKey };
  let user: SessionUser;

  if (!session || session.isDemo) {
    // Unchanged from the mock-only era — demo never touches the database.
    workspace = { id: DEMO_WORKSPACE.id, name: DEMO_WORKSPACE.name, industryProfileKey: DEMO_WORKSPACE.industryProfileKey };
    user = DEMO_USER;
  } else {
    const membership = await db.workspaceMember.findFirst({
      where: { userId: session.userId, status: "active" },
      include: { workspace: true, role: true, user: true },
      orderBy: { joinedAt: "asc" },
    });

    if (!membership) {
      // A real, authenticated person with no workspace of their own yet
      // (today, only possible for staff-only accounts like the founder's).
      // Never fall back to demo/mock content for a real session — send
      // them somewhere that's actually theirs, or nowhere.
      redirect(hasStaffAccess(session) ? "/3stone-ai" : "/login");
    }

    workspace = {
      id: membership.workspace.id,
      name: membership.workspace.name,
      industryProfileKey: (membership.workspace.industryProfileKey ?? "construction") as IndustryProfileKey,
    };
    user = {
      id: membership.user.id,
      name: membership.user.name,
      initials: membership.user.name
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase(),
      email: membership.user.email,
      role: membership.role.name as SessionUser["role"],
      title: membership.role.name,
    };
  }

  return (
    <IndustryProvider
      initialKey={workspace.industryProfileKey}
      initialBusinessId={workspace.id}
      isDemo={!session || session.isDemo}
      workspaceName={workspace.name}
    >
      <AppShell user={user}>{children}</AppShell>
    </IndustryProvider>
  );
}
