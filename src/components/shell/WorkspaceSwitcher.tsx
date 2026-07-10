"use client";

import { useCallback, useRef, useState } from "react";
import { Check, ChevronDown, ChevronsUpDown } from "lucide-react";
import { useIndustry } from "@/lib/industry";
import { industryProfileList } from "@/config/industry-profiles";
import { DEMO_BUSINESSES, getBusinessName } from "@/server/mock-data/businesses";
import { useOnClickOutside } from "@/lib/useOnClickOutside";
import { useEscapeKey } from "@/lib/useEscapeKey";
import { cn } from "@/lib/utils";

export function WorkspaceSwitcher() {
  const { profile, currentBusinessId, setBusinessId, setIndustryKey } = useIndustry();
  const [open, setOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useOnClickOutside(ref, close);
  useEscapeKey(open, close);

  const currentName = getBusinessName(
    DEMO_BUSINESSES.find((b) => b.id === currentBusinessId) ?? DEMO_BUSINESSES[0]
  );

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-[10px] px-2 py-1.5 hover:bg-surface-raised"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-[8px] bg-accent-wash text-[12px] font-bold text-accent">
          {currentName.slice(0, 2).toUpperCase()}
        </span>
        <span className="hidden flex-col items-start leading-tight sm:flex">
          <span className="text-[13.5px] font-semibold text-ink-1">{currentName}</span>
          <span className="text-[11px] text-ink-3">{profile.label}</span>
        </span>
        <ChevronsUpDown size={14} className="text-ink-3" />
      </button>
      {open ? (
        <div className="absolute left-0 top-[calc(100%+6px)] z-50 w-80 rounded-[14px] border border-line bg-surface p-1.5 shadow-[var(--shadow)]">
          <div className="px-2.5 pb-2 pt-1.5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-3">Your businesses</p>
            <p className="mt-1 text-[12px] leading-snug text-ink-3">
              One login, every business you own — switching changes the dashboard, CRM, finance, team,
              and AI, all at once.
            </p>
          </div>
          {DEMO_BUSINESSES.map((business) => {
            const name = getBusinessName(business);
            const businessProfile = industryProfileList.find((p) => p.key === business.industryProfileKey);
            return (
              <button
                key={business.id}
                onClick={() => {
                  setBusinessId(business.id);
                  setOpen(false);
                }}
                className="flex w-full items-center justify-between gap-2 rounded-[8px] px-2.5 py-2 text-left hover:bg-surface-raised"
              >
                <span className="min-w-0">
                  <span className="block truncate text-[13.5px] text-ink-1">{name}</span>
                  <span className="block text-[11.5px] text-ink-3">{businessProfile?.label}</span>
                </span>
                {business.id === currentBusinessId ? (
                  <Check size={15} className="flex-shrink-0 text-accent" />
                ) : null}
              </button>
            );
          })}

          <div className="my-1.5 h-px bg-line" />

          <button
            onClick={() => setPreviewOpen((v) => !v)}
            className="flex w-full items-center justify-between rounded-[8px] px-2.5 py-2 text-left text-[12.5px] font-medium text-ink-3 hover:bg-surface-raised"
          >
            Preview an industry pack (demo only)
            <ChevronDown size={14} className={cn("transition-transform", previewOpen && "rotate-180")} />
          </button>
          {previewOpen ? (
            <div className="mt-1 max-h-56 overflow-y-auto rounded-[10px] bg-bg p-1">
              <p className="px-2 pb-1.5 pt-1 text-[11.5px] leading-snug text-ink-3">
                Relabels this screen&rsquo;s terminology only — it doesn&rsquo;t change your business.
              </p>
              {industryProfileList.map((p) => (
                <button
                  key={p.key}
                  onClick={() => {
                    setIndustryKey(p.key);
                    setOpen(false);
                  }}
                  className="flex w-full items-center justify-between rounded-[8px] px-2.5 py-1.5 text-left text-[13px] text-ink-2 hover:bg-surface-raised"
                >
                  {p.label}
                  {p.key === profile.key ? <Check size={13} className="text-accent" /> : null}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
