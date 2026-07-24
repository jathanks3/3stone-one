import type { Metadata } from "next";
import { getSession, hasStaffAccess } from "@/lib/session";
import { listProspects } from "@/server/platform/services/salesPipelineService";
import { recordAuditEntry } from "@/server/platform/services/auditLogService";
import { AddProspectForm } from "./AddProspectForm";

export const metadata: Metadata = { title: "Sales Pipeline — 3Stone AI" };

const STAGE_LABELS: Record<string, string> = {
  lead: "Lead",
  discovery_scheduled: "Discovery Scheduled",
  proposal_draft: "Proposal Draft",
  proposal_sent: "Proposal Sent",
  negotiation: "Negotiation",
};

// 3Stone AI's own sales pipeline — people who are not customers yet.
// Deliberately separate from Customers (which is Workspaces, i.e.
// people who already are customers) — see salesPipelineService.ts.
export default async function ProspectsPage() {
  const session = await getSession();
  if (!hasStaffAccess(session)) return null; // layout above already redirects

  const prospects = await listProspects();
  await recordAuditEntry({ staffUserId: session.userId, action: "viewed_sales_pipeline" });

  return (
    <div>
      <h1 className="text-[22px] font-bold text-ink-1">Sales Pipeline</h1>
      <p className="mt-1 text-[13.5px] text-ink-2">Prospects — not customers yet.</p>

      <div className="mt-5">
        <AddProspectForm />
      </div>

      <div className="mt-5 overflow-x-auto rounded-[12px] border border-line">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-line bg-surface text-left text-ink-3">
              <th className="px-4 py-2.5 font-medium">Name</th>
              <th className="px-4 py-2.5 font-medium">Email</th>
              <th className="px-4 py-2.5 font-medium">Business</th>
              <th className="px-4 py-2.5 font-medium">Stage</th>
            </tr>
          </thead>
          <tbody>
            {prospects.map((p) => (
              <tr key={p.id} className="border-b border-line last:border-0">
                <td className="px-4 py-2.5 font-medium text-ink-1">{p.name}</td>
                <td className="px-4 py-2.5 text-ink-2">{p.email}</td>
                <td className="px-4 py-2.5 text-ink-2">{p.businessName ?? "—"}</td>
                <td className="px-4 py-2.5 text-ink-2">{STAGE_LABELS[p.stage] ?? p.stage}</td>
              </tr>
            ))}
            {prospects.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-ink-3">
                  No active prospects.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
