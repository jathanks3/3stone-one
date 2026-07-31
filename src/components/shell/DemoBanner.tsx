"use client";

import { ArrowLeft } from "lucide-react";
import { useIndustry } from "@/lib/industry";

const EDITION_LABEL: Record<string, string> = {
  business: "3Stone One",
  workspace: "3Stone One Workspace",
  student: "3Stone One Student",
};

// Demo-only - there was previously no way back to the marketing site
// short of the browser's back button once someone landed in a demo
// session. Links to the real marketing page every edition's "Try the
// Demo"/"Learn more" links point back from (www.3stoneai.com/workspace),
// not just "/" - that's the page the founder treats as 3Stone One's home.
export function DemoBanner() {
  const { isDemo, editionKey } = useIndustry();
  if (!isDemo) return null;

  return (
    <div className="flex h-9 flex-shrink-0 items-center justify-center gap-3 bg-accent-wash px-4 text-center text-[12.5px] font-medium text-accent">
      <span className="truncate">You&rsquo;re viewing a live demo of {EDITION_LABEL[editionKey] ?? "3Stone One"}</span>
      <a
        href="https://www.3stoneai.com/workspace"
        className="flex flex-shrink-0 items-center gap-1 font-semibold underline underline-offset-2 hover:opacity-80"
      >
        <ArrowLeft size={12} />
        Back to 3Stone One
      </a>
    </div>
  );
}
