"use client";

import { useCallback, useRef, useState } from "react";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { useIndustry } from "@/lib/industry";
import { industryProfileList } from "@/config/industry-profiles";
import { useOnClickOutside } from "@/lib/useOnClickOutside";
import { useEscapeKey } from "@/lib/useEscapeKey";
import { useToast } from "@/lib/toast";
import type { Workspace } from "@/types";

export function WorkspaceSwitcher({ workspace }: { workspace: Workspace }) {
  const { profile, setIndustryKey } = useIndustry();
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useOnClickOutside(ref, close);
  useEscapeKey(open, close);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-[10px] px-2 py-1.5 hover:bg-surface-raised"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-[8px] bg-accent-wash text-[12px] font-bold text-accent">
          {workspace.name.slice(0, 2).toUpperCase()}
        </span>
        <span className="hidden flex-col items-start leading-tight sm:flex">
          <span className="text-[13.5px] font-semibold text-ink-1">{workspace.name}</span>
          <span className="text-[11px] text-ink-3">{profile.label}</span>
        </span>
        <ChevronsUpDown size={14} className="text-ink-3" />
      </button>
      {open ? (
        <div className="absolute left-0 top-[calc(100%+6px)] z-50 w-72 rounded-[14px] border border-line bg-surface p-1.5 shadow-[var(--shadow)]">
          <div className="px-2.5 pb-2 pt-1.5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-3">
              Try another industry
            </p>
            <p className="mt-1 text-[12px] leading-snug text-ink-3">
              This demo relabels itself instantly for the industry you pick — same product, your
              terminology.
            </p>
          </div>
          {industryProfileList.map((p) => (
            <button
              key={p.key}
              onClick={() => {
                setIndustryKey(p.key);
                setOpen(false);
              }}
              className="flex w-full items-center justify-between rounded-[8px] px-2.5 py-2 text-left text-[13.5px] text-ink-1 hover:bg-surface-raised"
            >
              {p.label}
              {p.key === profile.key ? <Check size={15} className="text-accent" /> : null}
            </button>
          ))}
          <div className="my-1 h-px bg-line" />
          <button
            onClick={() => {
              setOpen(false);
              showToast({
                title: "Multi-company portfolio is coming",
                description: "Owning more than one company? That rollup view ships in Phase 10.",
              });
            }}
            className="flex w-full items-center gap-2 rounded-[8px] px-2.5 py-2 text-left text-[13.5px] text-ink-3 hover:bg-surface-raised"
          >
            <Plus size={15} />
            Add another company
          </button>
        </div>
      ) : null}
    </div>
  );
}
