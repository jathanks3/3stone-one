"use client";

import { useActionState } from "react";
import { submitProblemReport, type ProblemReportState } from "./reportProblemActions";

const initialState: ProblemReportState = {};
const PRODUCT_AREAS = ["3Stone One", "Workspace", "Student", "3Stone Admin", "3Stone AI website", "3Stone Picks", "3Stone Counsel", "Other"];

export function ReportProblemForm({ sourceUrl = "", productArea = "3Stone One", compact = false }: { sourceUrl?: string; productArea?: string; compact?: boolean }) {
  const [state, action, pending] = useActionState(submitProblemReport, initialState);
  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="sourceUrl" value={sourceUrl} />
      <div className="hidden" aria-hidden="true">
        <label>Company<input name="company" tabIndex={-1} autoComplete="off" /></label>
      </div>
      <label className="flex flex-col gap-1 text-[12.5px] font-medium text-ink-2">
        Product or area
        <select name="productArea" defaultValue={PRODUCT_AREAS.includes(productArea) ? productArea : "Other"} className="h-10 rounded-[9px] border border-line-strong bg-surface px-3 text-[13.5px] text-ink-1 outline-none focus:border-accent">
          {PRODUCT_AREAS.map((area) => <option key={area} value={area}>{area}</option>)}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-[12.5px] font-medium text-ink-2">
        Email
        <input name="email" type="email" autoComplete="email" placeholder="you@example.com" className="h-10 rounded-[9px] border border-line-strong bg-surface px-3 text-[13.5px] text-ink-1 outline-none placeholder:text-ink-3 focus:border-accent" />
        <span className="font-normal text-ink-3">Signed-in reports automatically use your account email.</span>
      </label>
      <label className="flex flex-col gap-1 text-[12.5px] font-medium text-ink-2">
        What went wrong?
        <input name="subject" required maxLength={160} placeholder="Short description" className="h-10 rounded-[9px] border border-line-strong bg-surface px-3 text-[13.5px] text-ink-1 outline-none placeholder:text-ink-3 focus:border-accent" />
      </label>
      <label className="flex flex-col gap-1 text-[12.5px] font-medium text-ink-2">
        Details
        <textarea name="details" required maxLength={5000} rows={compact ? 4 : 6} placeholder="What happened, what did you expect, and what were you doing right before it happened?" className="resize-y rounded-[9px] border border-line-strong bg-surface px-3 py-2.5 text-[13.5px] text-ink-1 outline-none placeholder:text-ink-3 focus:border-accent" />
      </label>
      {state.error ? <p role="alert" className="text-[12.5px] text-critical">{state.error}</p> : null}
      {state.success ? <p role="status" className="rounded-[9px] bg-positive-wash px-3 py-2 text-[12.5px] text-positive">{state.success}</p> : null}
      <button type="submit" disabled={pending} className="h-10 rounded-[9px] bg-accent px-4 text-[13.5px] font-semibold text-on-accent hover:opacity-90 disabled:opacity-60">
        {pending ? "Sending…" : "Send report"}
      </button>
    </form>
  );
}
