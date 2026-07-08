import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type BadgeTone = "good" | "warning" | "critical" | "neutral" | "accent";

const toneClasses: Record<BadgeTone, string> = {
  good: "bg-good-wash text-good",
  warning: "bg-warning-wash text-warning-ink",
  critical: "bg-critical-wash text-critical",
  neutral: "border border-line bg-surface-raised text-ink-2",
  accent: "bg-accent-wash text-accent",
};

export function Badge({
  tone = "neutral",
  children,
  className,
}: {
  tone?: BadgeTone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11.5px] font-semibold leading-normal",
        toneClasses[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
