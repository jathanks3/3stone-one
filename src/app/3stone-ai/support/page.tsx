import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/server/db";
import { updateProblemReportStatus } from "./actions";

export const metadata: Metadata = { title: "Problem Reports — 3Stone AI" };

export default async function SupportReportsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams;
  const allowedStatus = ["open", "pending", "resolved", "closed"].includes(status ?? "") ? status : undefined;
  const reports = await db.supportTicket.findMany({
    where: allowedStatus ? { status: allowedStatus as "open" | "pending" | "resolved" | "closed" } : undefined,
    include: { workspace: { select: { name: true, editionKey: true } }, messages: { orderBy: { createdAt: "asc" }, take: 1 } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><h1 className="text-[22px] font-bold text-ink-1">Problem Reports</h1><p className="mt-1 text-[13.5px] text-ink-2">Reports from every 3Stone One screen and the public 3Stone AI website.</p></div>
        <nav className="flex gap-2 text-[12.5px]">
          {["all", "open", "pending", "resolved", "closed"].map((item) => <Link key={item} href={item === "all" ? "/3stone-ai/support" : `/3stone-ai/support?status=${item}`} className={`rounded-full border px-3 py-1.5 capitalize ${(!allowedStatus && item === "all") || allowedStatus === item ? "border-accent bg-accent-wash text-accent" : "border-line text-ink-2"}`}>{item}</Link>)}
        </nav>
      </div>
      <div className="mt-5 grid gap-3">
        {reports.map((report) => (
          <article key={report.id} className="rounded-xl border border-line bg-surface p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div><div className="flex flex-wrap items-center gap-2"><h2 className="text-[14px] font-semibold text-ink-1">{report.subject}</h2><span className="rounded-full bg-surface-raised px-2 py-0.5 text-[10.5px] font-semibold uppercase text-ink-3">{report.status}</span></div><p className="mt-1 text-[12px] text-ink-3">{report.productArea ?? "Unspecified"} · {report.workspace ? `${report.workspace.name} (${report.workspace.editionKey})` : "Public visitor"} · {report.requestedByEmail} · {report.createdAt.toLocaleString()}</p></div>
              <form action={updateProblemReportStatus} className="flex items-center gap-2"><input type="hidden" name="ticketId" value={report.id} /><select name="status" defaultValue={report.status} className="h-8 rounded-lg border border-line-strong bg-bg px-2 text-[12px] text-ink-1">{["open", "pending", "resolved", "closed"].map((item) => <option key={item} value={item}>{item}</option>)}</select><button className="h-8 rounded-lg bg-accent px-3 text-[12px] font-semibold text-on-accent">Save</button></form>
            </div>
            <p className="mt-3 whitespace-pre-wrap text-[13px] leading-relaxed text-ink-2">{report.messages[0]?.body ?? "No details supplied."}</p>
            {report.sourceUrl ? <a href={report.sourceUrl} target="_blank" rel="noreferrer" className="mt-3 inline-block break-all text-[11.5px] text-accent hover:underline">Reported from {report.sourceUrl}</a> : null}
          </article>
        ))}
        {reports.length === 0 ? <p className="rounded-xl border border-line bg-surface px-4 py-8 text-center text-[13px] text-ink-3">No problem reports in this view.</p> : null}
      </div>
    </div>
  );
}
