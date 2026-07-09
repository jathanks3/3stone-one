import { cn } from "@/lib/utils";
import { Sparkline } from "./Sparkline";

type Tone = "positive" | "negative" | "neutral";

const toneText: Record<Tone, string> = {
  positive: "text-good",
  negative: "text-critical",
  neutral: "text-ink-3",
};

const sparklineTone: Record<Tone, "good" | "warning" | "critical" | "accent"> = {
  positive: "good",
  negative: "critical",
  neutral: "accent",
};

export function KpiTile({
  label,
  value,
  deltaLabel,
  tone = "neutral",
  trend,
  className,
}: {
  label: string;
  value: string;
  deltaLabel?: string;
  tone?: Tone;
  trend?: number[];
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-2 rounded-2xl border border-line bg-surface p-4", className)}>
      <p className="text-[12.5px] font-medium text-ink-3">{label}</p>
      <div className="flex items-end justify-between gap-3">
        <p className="text-[26px] font-bold tracking-tight text-ink-1">{value}</p>
        {trend ? <Sparkline data={trend} tone={sparklineTone[tone]} /> : null}
      </div>
      {deltaLabel ? <p className={cn("text-[12px] font-medium leading-snug", toneText[tone])}>{deltaLabel}</p> : null}
    </div>
  );
}
