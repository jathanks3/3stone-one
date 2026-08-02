"use client";

import { useState } from "react";
import { Bug, X } from "lucide-react";
import { ReportProblemForm } from "./ReportProblemForm";

export function ReportProblemButton() {
  const [open, setOpen] = useState(false);
  const [sourceUrl, setSourceUrl] = useState("");
  const openReport = () => {
    setSourceUrl(window.location.href);
    setOpen(true);
  };

  return (
    <>
      <button type="button" onClick={openReport} className="fixed bottom-4 right-4 z-[80] inline-flex h-10 items-center gap-2 rounded-full border border-line-strong bg-surface px-4 text-[12.5px] font-semibold text-ink-1 shadow-lg hover:bg-surface-raised" aria-label="Report a problem">
        <Bug size={15} /> Report a problem
      </button>
      {open ? (
        <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/55 p-3 sm:items-center" role="dialog" aria-modal="true" aria-labelledby="problem-report-title" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }}>
          <div className="max-h-[92vh] w-full max-w-[520px] overflow-y-auto rounded-2xl border border-line-strong bg-bg p-5 shadow-2xl">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div><h2 id="problem-report-title" className="text-[17px] font-bold text-ink-1">Report a problem</h2><p className="mt-1 text-[12.5px] text-ink-3">Your report goes directly to the 3Stone AI support dashboard.</p></div>
              <button type="button" onClick={() => setOpen(false)} className="rounded-lg p-1.5 text-ink-3 hover:bg-surface-raised hover:text-ink-1" aria-label="Close problem report"><X size={17} /></button>
            </div>
            <ReportProblemForm sourceUrl={sourceUrl} compact />
          </div>
        </div>
      ) : null}
    </>
  );
}
