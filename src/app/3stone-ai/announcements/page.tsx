import type { Metadata } from "next";
import { getSession, hasStaffAccess } from "@/lib/session";
import { listAnnouncements } from "@/server/platform/services/announcementService";
import { recordAuditEntry } from "@/server/platform/services/auditLogService";
import { AddAnnouncementForm } from "./AddAnnouncementForm";
import { AnnouncementRow } from "./AnnouncementRow";

export const metadata: Metadata = { title: "Announcements — 3Stone AI" };

// Publishing here makes the announcement appear on every 3Stone AI
// product (BetAI today) via the same public feature-flags-style endpoint
// pattern — one place, no per-product redeploy.
export default async function AnnouncementsPage() {
  const session = await getSession();
  if (!hasStaffAccess(session)) return null; // layout above already redirects

  const announcements = await listAnnouncements();
  await recordAuditEntry({ staffUserId: session.userId, action: "viewed_announcements" });

  return (
    <div>
      <h1 className="text-[22px] font-bold text-ink-1">Announcements</h1>
      <p className="mt-1 text-[13.5px] text-ink-2">
        Published announcements show up across every 3Stone AI product automatically.
      </p>

      <div className="mt-5">
        <AddAnnouncementForm />
      </div>

      <div className="mt-5 flex flex-col gap-3">
        {announcements.map((a) => (
          <AnnouncementRow
            key={a.id}
            id={a.id}
            title={a.title}
            body={a.body}
            publishedAt={a.publishedAt ? a.publishedAt.toISOString() : null}
          />
        ))}
        {announcements.length === 0 ? (
          <p className="rounded-[12px] border border-line bg-surface p-6 text-center text-[13px] text-ink-3">
            No announcements yet.
          </p>
        ) : null}
      </div>
    </div>
  );
}
