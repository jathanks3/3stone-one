import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { DEMO_USER, DEMO_WORKSPACE } from "@/server/mock-data";
import { getIndustryDataset } from "@/server/mock-data/industries";
import { getSession, hasStaffAccess } from "@/lib/session";
import { db } from "@/server/db";
import { IndustryProvider } from "@/lib/industry";
import { getAllowedModuleKeys } from "@/lib/editionModules";
import { getAllNavItems } from "@/lib/nav";
import { getIndustryProfile } from "@/config/industry-profiles";
import { getDemoProfile } from "@/server/services/demoProfileService";
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

  let workspace: { id: string; name: string; industryProfileKey: IndustryProfileKey; editionKey: string };
  let user: SessionUser;
  let demoAccentColor: string | null = null;

  if (!session || session.isDemo) {
    // Mostly unchanged from the mock-only era - demo still never touches
    // real customer data. The one real exception: a founder-authored
    // DemoProfile (see /3stone-ai/demo-profiles), a single cheap lookup
    // by id, only when a call actually asked for one via ?profile=<id>
    // (see (marketing)/demo/route.ts) - lets a prospect's demo show their
    // own org name/wording/color instead of the generic placeholder.
    // Edition comes from the session (set by /demo?edition=... - see
    // src/app/(marketing)/demo/route.ts), defaulting to the full
    // original product when no demo edition was requested. Workspace and
    // Student each get their own fixed profile/dataset (see
    // src/config/industry-profiles/workplace.ts, student.ts) instead of
    // always showing the flagship's default construction-industry demo -
    // a prospective Workspace/Student customer should see a demo themed
    // for them, not "Jobs"/"Technicians" wording from an unrelated trade.
    const demoEditionKey = session?.demoEditionKey ?? "business";
    const demoProfile = session?.demoProfileId ? await getDemoProfile(session.demoProfileId) : null;
    const demoIndustryProfileKey = demoProfile
      ? (demoProfile.industryProfileKey as IndustryProfileKey)
      : demoEditionKey === "workspace"
        ? "workplace"
        : demoEditionKey === "student"
          ? "student"
          : DEMO_WORKSPACE.industryProfileKey;
    workspace = {
      id: DEMO_WORKSPACE.id,
      name: demoProfile
        ? demoProfile.orgName
        : demoEditionKey === "business"
          ? DEMO_WORKSPACE.name
          : getIndustryDataset(demoIndustryProfileKey).orgName,
      industryProfileKey: demoIndustryProfileKey,
      editionKey: demoEditionKey,
    };
    demoAccentColor = demoProfile?.accentColor ?? null;
    user = DEMO_USER;
  } else {
    const membership = await db.workspaceMember.findFirst({
      where: { userId: session.userId, status: "active" },
      include: { workspace: true, role: true, user: true },
      orderBy: { joinedAt: "asc" },
    });

    if (!membership) {
      // A real, authenticated person with no workspace of their own yet.
      // Real bug found here: this used to send non-staff accounts to
      // /login - but proxy.ts treats /login as "already logged in? go to
      // /dashboard", and this layout treats /dashboard as "no membership?
      // go to /login" - an account with a password but no workspace
      // (signup abandoned right after setting a password, before
      // createWorkspace ran) got stuck bouncing between the two forever
      // ("this page isn't working" / ERR_TOO_MANY_REDIRECTS). Send them
      // to finish creating a workspace instead - that page only requires
      // a real session (see signup/workspace/page.tsx), so it works
      // exactly the same whether they arrived via the normal wizard or
      // by resuming here after logging back in.
      redirect(hasStaffAccess(session) ? "/3stone-ai" : "/signup/workspace");
    }

    // Session revocation check: a password change/reset increments
    // User.sessionVersion, which makes every cookie issued before that
    // moment stale. membership.user is already fetched above (no extra
    // query) — this is the one place that check has to happen for every
    // page under the customer app, since every page renders through this
    // layout first. Redirect to /logout, not /login — the stale cookie is
    // still correctly signed, so proxy.ts's Edge-only check still sees it
    // as "logged in" and would bounce a plain /login redirect straight
    // back to /dashboard (it has no DB access to see sessionVersion
    // itself). /logout actually deletes the cookie, breaking that loop.
    if (membership.user.sessionVersion !== session.sessionVersion) {
      redirect("/logout");
    }

    workspace = {
      id: membership.workspace.id,
      name: membership.workspace.name,
      industryProfileKey: (membership.workspace.industryProfileKey ?? "construction") as IndustryProfileKey,
      editionKey: membership.workspace.editionKey,
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

  // Route-level enforcement: nav hiding alone doesn't stop a direct URL
  // visit to an excluded module. Only ever redirects for a pathname that's
  // a REAL module key (e.g. "finance") - routes with no nav entry at all
  // (like /profile) are never gated, since they're not business modules
  // this system knows how to restrict.
  const allowedModuleKeys = getAllowedModuleKeys(workspace.editionKey);
  if (allowedModuleKeys) {
    const pathname = (await headers()).get("x-pathname") ?? "";
    const moduleKey = pathname.split("/")[1] ?? "";
    const allModuleKeys = new Set(getAllNavItems(getIndustryProfile(workspace.industryProfileKey)).map((i) => i.key));
    if (allModuleKeys.has(moduleKey) && !allowedModuleKeys.has(moduleKey)) {
      redirect("/dashboard");
    }
  }

  return (
    <IndustryProvider
      initialKey={workspace.industryProfileKey}
      initialBusinessId={workspace.id}
      isDemo={!session || session.isDemo}
      workspaceName={workspace.name}
      editionKey={workspace.editionKey}
      demoAccentColor={demoAccentColor}
    >
      <AppShell user={user}>{children}</AppShell>
    </IndustryProvider>
  );
}
