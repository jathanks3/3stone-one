"use client";

import { Sparkles } from "lucide-react";
import { useToast } from "@/lib/toast";
import { useIndustry } from "@/lib/industry";
import { getIndustryDataset } from "@/server/mock-data/industries";
import { generateMorningBriefing, getBusinessHealthScoreForDataset } from "@/server/mock-data";
import { HealthMeter } from "@/ui/HealthMeter";

export function BriefingCard() {
  const { showToast } = useToast();
  const { profile } = useIndustry();
  const dataset = getIndustryDataset(profile.key);
  const health = getBusinessHealthScoreForDataset(dataset);
  const briefing = generateMorningBriefing(dataset);
  const topOverdue = dataset.jobs.find((j) => j.overdue);

  function scrollToAttention() {
    document.getElementById("attention")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="rounded-2xl border border-accent-wash-strong bg-accent-wash p-5 sm:p-6">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 text-accent">
            <Sparkles size={16} strokeWidth={2.25} />
            <p className="text-[12px] font-semibold uppercase tracking-wide">Your morning briefing</p>
          </div>
          <p className="mt-3 max-w-[640px] text-[15px] leading-relaxed text-ink-1">{briefing}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={() =>
                showToast({
                  title: `Drafting a follow-up to ${topOverdue?.client ?? dataset.organizations[0]?.name ?? "your client"}`,
                  description: "Email drafts ship with a real backend — this is a convincing preview today.",
                })
              }
              className="rounded-[9px] bg-accent px-3.5 py-2 text-[13px] font-semibold text-on-accent hover:opacity-90"
            >
              Draft a follow-up
            </button>
            <button
              onClick={scrollToAttention}
              className="rounded-[9px] border border-accent-wash-strong bg-surface px-3.5 py-2 text-[13px] font-semibold text-accent hover:bg-accent-wash-strong"
            >
              See what needs attention
            </button>
          </div>
        </div>

        <div className="flex flex-shrink-0 items-center gap-4 border-t border-accent-wash-strong pt-5 sm:border-t-0 sm:border-l sm:pl-6 sm:pt-0">
          <HealthMeter score={health.score} label={health.label} tone={health.tone} />
          <div className="max-w-[168px]">
            <p className="text-[12px] font-semibold uppercase tracking-wide text-ink-3">Business health</p>
            <p className="mt-1 text-[13px] leading-snug text-ink-2">{health.explanation}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
