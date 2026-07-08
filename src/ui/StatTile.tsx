import { ArrowDown, ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Sparkline } from "./Sparkline";

type DeltaTone = "good" | "warning" | "critical";

const deltaClasses: Record<DeltaTone, string> = {
  good: "text-good",
  warning: "text-warning-ink",
  critical: "text-critical",
};

const sparklineTone: Record<DeltaTone, "good" | "warning" | "critical" | "accent"> = {
  good: "good",
  warning: "accent",
  critical: "critical",
};

export function StatTile({
  label,
  value,
  deltaPct,
  direction = "up",
  deltaTone = "good",
  trend,
  className,
}: {
  label: string;
  value: string;
  deltaPct?: number;
  direction?: "up" | "down";
  deltaTone?: DeltaTone;
  trend?: number[];
  className?: string;
}) {
  const ArrowIcon = direction === "up" ? ArrowUp : ArrowDown;

  return (
    <div className={cn("flex flex-col gap-2 rounded-2xl border border-line bg-surface p-4", className)}>
      <p className="text-[12.5px] font-medium text-ink-3">{label}</p>
      <div className="flex items-end justify-between gap-3">
        <div className="flex items-baseline gap-2">
          <p className="text-[26px] font-bold tracking-tight text-ink-1">{value}</p>
          {deltaPct !== undefined ? (
            <span
              className={cn(
                "flex items-center gap-0.5 text-[12.5px] font-semibold",
                deltaClasses[deltaTone]
              )}
            >
              <ArrowIcon size={12} strokeWidth={2.5} />
              {deltaPct}%
            </span>
          ) : null}
        </div>
        {trend ? <Sparkline data={trend} tone={sparklineTone[deltaTone]} /> : null}
      </div>
    </div>
  );
}
