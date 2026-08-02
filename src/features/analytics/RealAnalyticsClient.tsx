"use client";

import { useActionState } from "react";
import { Sheet } from "lucide-react";
import { Card } from "@/ui/Card";
import { Button } from "@/ui/Button";
import { exportWorkspaceSnapshotToSheetsAction, type AnalyticsActionState } from "@/app/(app)/analytics/actions";

const initial: AnalyticsActionState = {};

export function RealAnalyticsClient({ counts, googleConnected }: { counts: { projects: number; people: number; organizations: number }; googleConnected: boolean }) {
  const [state, action, pending] = useActionState(exportWorkspaceSnapshotToSheetsAction, initial);
  return <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
    <h1 className="text-[22px] font-bold text-ink-1">Analytics &amp; Reports</h1>
    <p className="mt-1 text-[14px] text-ink-2">Live workspace totals and export pathways.</p>
    <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">{Object.entries(counts).map(([label, value]) => <Card key={label} className="p-4"><p className="text-[12px] font-semibold uppercase tracking-wide text-ink-3">{label}</p><p className="mt-2 text-[26px] font-bold text-ink-1">{value}</p></Card>)}</div>
    <Card className="mt-6 p-5"><div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-[14px] font-semibold text-ink-1">Google Sheets</p><p className="mt-1 text-[12.5px] text-ink-2">Create a live workspace snapshot containing projects, people and organizations.</p></div><form action={action}><Button type="submit" variant="primary" disabled={!googleConnected || pending}><Sheet size={14} />{pending ? "Creating…" : "Create Google Sheet"}</Button></form></div>{!googleConnected ? <p className="mt-3 text-[12px] text-ink-3">Connect Google Workspace in Integrations first.</p> : null}{state.error ? <p className="mt-3 text-[12px] text-critical">{state.error}</p> : null}{state.url ? <a href={state.url} target="_blank" rel="noreferrer" className="mt-3 inline-flex text-[13px] font-semibold text-accent hover:underline">Open created Google Sheet</a> : null}</Card>
  </div>;
}
