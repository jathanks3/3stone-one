"use client";

import { useState } from "react";
import { Building2, Eye, FileText } from "lucide-react";
import { Card } from "@/ui/Card";
import { Badge } from "@/ui/Badge";
import { EmptyState } from "@/ui/EmptyState";
import { formatCurrency } from "@/lib/utils";
import type { ClientPortalDealRow, ClientPortalDocumentRow, ClientPortalOrgRow } from "@/server/services/clientPortalService";

function formatSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

const STAGE_LABEL: Record<string, string> = {
  new_lead: "New Lead",
  contacted: "Contacted",
  proposal: "Proposal",
  negotiation: "Negotiation",
  won: "Won",
  lost: "Lost",
};

export function RealClientPortalClient({
  organizations,
  documentsByOrg,
  dealsByOrg,
}: {
  organizations: ClientPortalOrgRow[];
  documentsByOrg: Record<string, ClientPortalDocumentRow[]>;
  dealsByOrg: Record<string, ClientPortalDealRow[]>;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(organizations[0]?.id ?? null);
  const selected = organizations.find((o) => o.id === selectedId) ?? null;
  const documents = selectedId ? documentsByOrg[selectedId] ?? [] : [];
  const deals = selectedId ? dealsByOrg[selectedId] ?? [] : [];

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-6 rounded-2xl border border-accent-wash-strong bg-accent-wash px-4 py-3">
        <p className="flex items-center gap-2 text-[13px] font-semibold text-accent">
          <Eye size={14} /> Preview — this is what a client sees for their own company, once shared.
        </p>
      </div>

      {organizations.length === 0 ? (
        <EmptyState icon={Building2} title="No companies yet" description="Add a company in CRM to preview their client portal." />
      ) : (
        <>
          <div className="flex flex-wrap gap-1.5">
            {organizations.map((o) => (
              <button
                key={o.id}
                onClick={() => setSelectedId(o.id)}
                className={`rounded-full border px-3 py-1.5 text-[12.5px] font-medium transition-colors ${
                  selectedId === o.id ? "border-accent bg-accent text-on-accent" : "border-line bg-surface text-ink-2 hover:bg-surface-raised"
                }`}
              >
                {o.name}
              </button>
            ))}
          </div>

          {selected ? (
            <div className="mt-6 flex flex-col gap-5">
              <h1 className="text-[20px] font-bold text-ink-1">{selected.name}</h1>

              <Card className="p-5">
                <p className="text-[15px] font-semibold text-ink-1">Shared documents</p>
                <div className="mt-3 flex flex-col gap-2">
                  {documents.length === 0 ? (
                    <p className="text-[13px] text-ink-3">
                      Nothing shared yet — mark a document "Shared with client" in Documents to have it show up here.
                    </p>
                  ) : (
                    documents.map((d) => (
                      <div key={d.id} className="flex items-center gap-2.5 rounded-[9px] border border-line bg-bg px-3 py-2 text-[13px] text-ink-2">
                        <FileText size={14} className="text-ink-3" /> {d.name}
                        <span className="ml-auto text-[11.5px] text-ink-3">{formatSize(d.sizeBytes)}</span>
                      </div>
                    ))
                  )}
                </div>
              </Card>

              <Card className="p-5">
                <p className="text-[15px] font-semibold text-ink-1">Engagements</p>
                <div className="mt-3 flex flex-col gap-2">
                  {deals.length === 0 ? (
                    <p className="text-[13px] text-ink-3">No deals linked to this company yet.</p>
                  ) : (
                    deals.map((d) => (
                      <div key={d.id} className="flex items-center justify-between rounded-[9px] border border-line bg-bg px-3 py-2">
                        <span className="text-[13px] text-ink-1">{d.title}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[12.5px] font-medium text-accent">{formatCurrency(d.value, { compact: true })}</span>
                          <Badge tone={d.stageKey === "won" ? "good" : d.stageKey === "lost" ? "critical" : "accent"}>{STAGE_LABEL[d.stageKey] ?? d.stageKey}</Badge>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Card>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
