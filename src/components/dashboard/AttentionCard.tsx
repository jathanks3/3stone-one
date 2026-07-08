"use client";

import { AlertTriangle, ClipboardCheck, FileWarning } from "lucide-react";
import { Card } from "@/ui/Card";
import { useIndustry } from "@/lib/industry";
import type { Invoice, Job, PurchaseRequest } from "@/types";

export function AttentionCard({
  overdueJobs,
  unpaidInvoices,
  pendingRequests,
}: {
  overdueJobs: Job[];
  unpaidInvoices: Invoice[];
  pendingRequests: PurchaseRequest[];
}) {
  const { profile } = useIndustry();
  const projectWord = (overdueJobs.length === 1 ? profile.terms.project : profile.terms.projects).toLowerCase();

  return (
    <Card id="attention" className="scroll-mt-6 p-5">
      <h2 className="text-[13px] font-semibold text-ink-2">What needs my attention</h2>
      <ul className="mt-3.5 flex flex-col gap-3.5">
        <li className="flex items-center gap-2.5">
          <AlertTriangle size={16} className="flex-shrink-0 text-critical" />
          <span className="text-[14px] text-ink-1">
            {overdueJobs.length} {projectWord} overdue — {overdueJobs.map((j) => j.client).join(", ")}
          </span>
        </li>
        <li className="flex items-center gap-2.5">
          <FileWarning size={16} className="flex-shrink-0 text-warning-ink" />
          <span className="text-[14px] text-ink-1">
            {unpaidInvoices.length} invoice{unpaidInvoices.length === 1 ? "" : "s"} unpaid
          </span>
        </li>
        <li className="flex items-center gap-2.5">
          <ClipboardCheck size={16} className="flex-shrink-0 text-accent" />
          <span className="text-[14px] text-ink-1">
            {pendingRequests.length} purchase request{pendingRequests.length === 1 ? "" : "s"} awaiting your approval
          </span>
        </li>
      </ul>
    </Card>
  );
}
