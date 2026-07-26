import type { Metadata } from "next";
import { getSession, hasStaffAccess } from "@/lib/session";
import { isWorkspaceDbConfigured, listWorkspaceCustomers } from "@/server/platform/services/workspaceCustomerService";
import { recordAuditEntry } from "@/server/platform/services/auditLogService";

export const metadata: Metadata = { title: "Workspace Customers — 3Stone AI" };

// The real cross-product integration: reads directly from
// workspace.3stoneai.com's own Supabase database (read-only), not
// 3stone-one's own (frozen, empty) Workspace table. This is the actual
// answer to "does the Founder Platform see real customers."
export default async function WorkspaceCustomersPage() {
  const session = await getSession();
  if (!hasStaffAccess(session)) return null; // layout above already redirects

  if (!isWorkspaceDbConfigured()) {
    return (
      <div>
        <h1 className="text-[22px] font-bold text-ink-1">Workspace Customers</h1>
        <p className="mt-2 text-[13.5px] text-critical">
          Not configured — SUPABASE_URL / SUPABASE_DB_PASSWORD are missing.
        </p>
      </div>
    );
  }

  const customers = await listWorkspaceCustomers();
  await recordAuditEntry({ staffUserId: session.userId, action: "viewed_workspace_customers" });

  return (
    <div>
      <h1 className="text-[22px] font-bold text-ink-1">Workspace Customers</h1>
      <p className="mt-1 text-[13.5px] text-ink-2">
        Real customers of workspace.3stoneai.com, read directly from that product's own database.
      </p>

      <div className="mt-5 overflow-x-auto rounded-[12px] border border-line">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-line bg-surface text-left text-ink-3">
              <th className="px-4 py-2.5 font-medium">Name</th>
              <th className="px-4 py-2.5 font-medium">Industry</th>
              <th className="px-4 py-2.5 font-medium">Status</th>
              <th className="px-4 py-2.5 font-medium">Lifecycle</th>
              <th className="px-4 py-2.5 font-medium">Created</th>
              <th className="px-4 py-2.5 font-medium">Activated</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c.id} className="border-b border-line last:border-0">
                <td className="px-4 py-2.5 font-medium text-ink-1">{c.name}</td>
                <td className="px-4 py-2.5 text-ink-2">{c.industry ?? "—"}</td>
                <td className="px-4 py-2.5 text-ink-2">{c.status}</td>
                <td className="px-4 py-2.5 text-ink-2">{c.lifecycleStage ?? "—"}</td>
                <td className="whitespace-nowrap px-4 py-2.5 text-ink-3">{c.createdAt.toLocaleDateString()}</td>
                <td className="whitespace-nowrap px-4 py-2.5 text-ink-3">
                  {c.activatedAt ? c.activatedAt.toLocaleDateString() : "—"}
                </td>
              </tr>
            ))}
            {customers.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-ink-3">
                  No customers yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
