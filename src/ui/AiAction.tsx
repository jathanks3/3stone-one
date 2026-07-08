"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export function AiAction({
  label,
  run,
  className,
}: {
  label: string;
  run: () => string;
  className?: string;
}) {
  const [output, setOutput] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function handleClick() {
    setLoading(true);
    setOutput(null);
    window.setTimeout(
      () => {
        setOutput(run());
        setLoading(false);
      },
      450 + Math.random() * 400
    );
  }

  return (
    <div className={className}>
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="inline-flex items-center gap-1.5 rounded-[8px] border border-accent-wash-strong bg-accent-wash px-2.5 py-1.5 text-[12.5px] font-semibold text-accent transition-colors hover:bg-accent-wash-strong disabled:cursor-wait disabled:opacity-70"
      >
        <Sparkles size={13} strokeWidth={2.25} className={loading ? "animate-pulse" : undefined} />
        {loading ? "Thinking…" : label}
      </button>
      {output ? (
        <div className="mt-2 rounded-[10px] border border-line bg-bg p-3 text-[13px] leading-relaxed text-ink-2">
          {output}
        </div>
      ) : null}
    </div>
  );
}

export function AiActionRow({ children }: { children: React.ReactNode }) {
  return <div className={cn("flex flex-wrap gap-2")}>{children}</div>;
}
