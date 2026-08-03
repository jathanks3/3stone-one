import type { Metadata } from "next";
import { getSession, hasStaffAccess } from "@/lib/session";
import { listDemoProfiles } from "@/server/services/demoProfileService";
import { recordAuditEntry } from "@/server/platform/services/auditLogService";
import { AddDemoProfileForm } from "./AddDemoProfileForm";
import { DemoProfileRow } from "./DemoProfileRow";

export const metadata: Metadata = { title: "Demo Profiles — 3Stone AI" };

// Founder-authored presets for the public Workspace/Student demo - save
// a prospect's org name/wording/color once here, then copy the link
// (or hand it to them) instead of the generic demo. See
// (marketing)/demo/route.ts for how ?profile=<id> applies this.
export default async function DemoProfilesPage() {
  const session = await getSession();
  if (!hasStaffAccess(session)) return null; // layout above already redirects

  const profiles = await listDemoProfiles();
  await recordAuditEntry({ staffUserId: session.userId, action: "viewed_demo_profiles" });

  return (
    <div>
      <h1 className="text-[22px] font-bold text-ink-1">Demo Profiles</h1>
      <p className="mt-1 text-[13.5px] text-ink-2">
        Save a prospect's name, org, and wording once, then copy their link before a call - the public demo shows up already built for them.
      </p>

      <div className="mt-5">
        <AddDemoProfileForm />
      </div>

      <div className="mt-5 overflow-x-auto rounded-[12px] border border-line">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-line bg-surface text-left text-ink-3">
              <th className="px-4 py-2.5 font-medium">Name</th>
              <th className="px-4 py-2.5 font-medium">Edition</th>
              <th className="px-4 py-2.5 font-medium">Org name</th>
              <th className="px-4 py-2.5 font-medium">Wording</th>
              <th className="px-4 py-2.5 font-medium">Accent</th>
              <th className="px-4 py-2.5 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {profiles.map((p) => (
              <DemoProfileRow key={p.id} profile={p} />
            ))}
            {profiles.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-ink-3">
                  No demo profiles yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
