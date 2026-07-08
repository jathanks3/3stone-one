"use client";

import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";

export function DetailPanel({
  open,
  onClose,
  title,
  subtitle,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden />
      <div className="relative flex h-full w-full max-w-[480px] flex-col overflow-y-auto border-l border-line bg-surface p-6 shadow-[var(--shadow)]">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-[18px] font-bold text-ink-1">{title}</h2>
            {subtitle ? <p className="mt-0.5 truncate text-[13px] text-ink-3">{subtitle}</p> : null}
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[8px] text-ink-2 hover:bg-surface-raised"
            aria-label="Close"
          >
            <X size={17} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
