import type { HealthTone } from "@/server/mock-data";

const TONE_VARS: Record<HealthTone, { fill: string; track: string }> = {
  good: { fill: "var(--good)", track: "var(--good-wash)" },
  warning: { fill: "var(--warning)", track: "var(--warning-wash)" },
  critical: { fill: "var(--critical)", track: "var(--critical-wash)" },
};

export function HealthMeter({
  score,
  label,
  tone,
  size = 96,
}: {
  score: number;
  label: string;
  tone: HealthTone;
  size?: number;
}) {
  const stroke = 8;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dash = circumference * Math.max(0, Math.min(100, score)) / 100;
  const colors = TONE_VARS[tone];

  return (
    <div className="relative flex flex-shrink-0 items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={colors.track} strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={colors.fill}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-[30px] font-extrabold leading-none tracking-tight text-ink-1 tabular-nums">
          {score}
        </span>
        <span className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-ink-3">{label}</span>
      </div>
    </div>
  );
}
