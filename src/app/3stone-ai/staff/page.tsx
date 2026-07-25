import type { Metadata } from "next";
import { getSession, hasStaffAccess } from "@/lib/session";
import { listStaff } from "@/server/platform/services/staffService";
import { recordAuditEntry } from "@/server/platform/services/auditLogService";
import { AddStaffForm } from "./AddStaffForm";
import { RevokeButton } from "./RevokeButton";

export const metadata: Metadata = { title: "Staff — 3Stone AI" };

const ROLE_LABELS: Record<string, string> = {
  founder: "Founder",
  operations: "Operations",
  support: "Support",
};

export default async function StaffPage() {
  const session = await getSession();
  if (!hasStaffAccess(session)) return null; // layout above already redirects

  const staff = await listStaff();
  await recordAuditEntry({ staffUserId: session.userId, action: "viewed_staff" });

  return (
    <div>
      <h1 className="text-[22px] font-bold text-ink-1">Staff</h1>
      <p className="mt-1 text-[13.5px] text-ink-2">Who has access to the Founder Platform, and at what role.</p>

      <div className="mt-5">
        <AddStaffForm />
      </div>

      <div className="mt-5 overflow-x-auto rounded-[12px] border border-line">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-line bg-surface text-left text-ink-3">
              <th className="px-4 py-2.5 font-medium">Name</th>
              <th className="px-4 py-2.5 font-medium">Email</th>
              <th className="px-4 py-2.5 font-medium">Role</th>
              <th className="px-4 py-2.5 font-medium">Status</th>
              <th className="px-4 py-2.5 font-medium">Granted</th>
              <th className="px-4 py-2.5 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {staff.map((s) => (
              <tr key={s.membershipId} className="border-b border-line last:border-0">
                <td className="px-4 py-2.5 font-medium text-ink-1">{s.name}</td>
                <td className="px-4 py-2.5 text-ink-2">{s.email}</td>
                <td className="px-4 py-2.5 text-ink-2">{ROLE_LABELS[s.role] ?? s.role}</td>
                <td className="px-4 py-2.5">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                      s.status === "active" ? "bg-good-wash text-good" : "bg-line text-ink-3"
                    }`}
                  >
                    {s.status === "active" ? "Active" : "Revoked"}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-2.5 text-ink-3">{s.grantedAt.toLocaleDateString()}</td>
                <td className="px-4 py-2.5 text-right">
                  {s.status === "active" ? (
                    s.userId === session.userId ? (
                      <span className="text-[12px] text-ink-3">(you)</span>
                    ) : (
                      <RevokeButton membershipId={s.membershipId} userId={s.userId} />
                    )
                  ) : null}
                </td>
              </tr>
            ))}
            {staff.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-ink-3">
                  No staff yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
