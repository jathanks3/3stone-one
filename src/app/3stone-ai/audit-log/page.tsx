import type { Metadata } from "next";
import Link from "next/link";
import { getSession, hasStaffAccess } from "@/lib/session";
import { listAuditLogEntries } from "@/server/platform/services/auditLogViewService";
import { recordAuditEntry } from "@/server/platform/services/auditLogService";

export const metadata: Metadata = { title: "Audit Log — 3Stone AI" };

function formatAction(action: string): string {
  return action.replaceAll("_", " ");
}

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const session = await getSession();
  if (!hasStaffAccess(session)) return null; // layout above already redirects

  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  const { entries, hasMore } = await listAuditLogEntries(page);
  // Viewing the audit log is itself logged, same as every other staff
  // action here — transparency applies to the founder's own activity too.
  await recordAuditEntry({ staffUserId: session.userId, action: "viewed_audit_log" });

  return (
    <div>
      <h1 className="text-[22px] font-bold text-ink-1">Audit Log</h1>
      <p className="mt-1 text-[13.5px] text-ink-2">Every staff action across the Founder Platform, newest first.</p>

      <div className="mt-5 overflow-x-auto rounded-[12px] border border-line">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-line bg-surface text-left text-ink-3">
              <th className="px-4 py-2.5 font-medium">When</th>
              <th className="px-4 py-2.5 font-medium">Staff</th>
              <th className="px-4 py-2.5 font-medium">Action</th>
              <th className="px-4 py-2.5 font-medium">Target</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => (
              <tr key={e.id} className="border-b border-line last:border-0">
                <td className="whitespace-nowrap px-4 py-2.5 text-ink-3">{e.createdAt.toLocaleString()}</td>
                <td className="px-4 py-2.5 font-medium text-ink-1">
                  {e.staffName}
                  <span className="ml-1 text-ink-3">({e.staffEmail})</span>
                </td>
                <td className="px-4 py-2.5 text-ink-2">{formatAction(e.action)}</td>
                <td className="px-4 py-2.5 text-ink-3">
                  {e.targetEntityType ? `${e.targetEntityType}${e.targetEntityId ? ` · ${e.targetEntityId}` : ""}` : "—"}
                </td>
              </tr>
            ))}
            {entries.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-ink-3">
                  No audit entries yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between text-[13px]">
        {page > 1 ? (
          <Link href={`/3stone-ai/audit-log?page=${page - 1}`} className="text-accent hover:opacity-80">
            ← Newer
          </Link>
        ) : (
          <span />
        )}
        {hasMore ? (
          <Link href={`/3stone-ai/audit-log?page=${page + 1}`} className="text-accent hover:opacity-80">
            Older →
          </Link>
        ) : (
          <span />
        )}
      </div>
    </div>
  );
}
