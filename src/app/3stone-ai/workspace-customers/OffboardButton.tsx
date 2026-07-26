"use client";

import { useState, useTransition } from "react";
import { offboardWorkspaceClientAction } from "./actions";

export function OffboardButton({ clientId, clientName }: { clientId: string; clientName: string }) {
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (done) return <span className="text-[12.5px] text-ink-3">Offboarded</span>;

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="h-8 rounded-[8px] border border-line-strong px-3 text-[12.5px] font-medium text-critical hover:bg-critical-wash"
      >
        Offboard
      </button>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1.5 rounded-[10px] border border-critical bg-critical-wash p-3">
      <p className="text-[12px] text-ink-1">
        This permanently deletes <strong>{clientName}</strong> and everything tied to it (invoices, documents,
        messages, projects). Cannot be undone. Type the name exactly to confirm:
      </p>
      <input
        type="text"
        value={confirmText}
        onChange={(e) => setConfirmText(e.target.value)}
        placeholder={clientName}
        className="h-8 w-full rounded-[6px] border border-line-strong bg-bg px-2 text-[13px] text-ink-1 outline-none focus:border-critical"
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setConfirmText("");
            setError(null);
          }}
          className="h-8 rounded-[8px] border border-line-strong px-3 text-[12.5px] font-medium text-ink-2"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={isPending || !confirmText}
          onClick={() =>
            startTransition(async () => {
              const result = await offboardWorkspaceClientAction(clientId, confirmText);
              if (result.error) setError(result.error);
              else setDone(true);
            })
          }
          className="h-8 rounded-[8px] bg-critical px-3 text-[12.5px] font-semibold text-white disabled:opacity-60"
        >
          {isPending ? "Offboarding…" : "Permanently Offboard"}
        </button>
      </div>
      {error ? <span className="text-[11.5px] text-critical">{error}</span> : null}
    </div>
  );
}
