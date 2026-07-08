type SparklineTone = "accent" | "good" | "warning" | "critical";

export function Sparkline({
  data,
  tone = "accent",
  width = 88,
  height = 32,
}: {
  data: number[];
  tone?: SparklineTone;
  width?: number;
  height?: number;
}) {
  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const stepX = width / (data.length - 1);
  const pad = 4;
  const plotHeight = height - pad * 2;

  const points = data.map((d, i) => {
    const x = i * stepX;
    const y = pad + plotHeight - ((d - min) / range) * plotHeight;
    return [x, y] as const;
  });

  const path = `M${points.map(([x, y]) => `${x},${y}`).join(" L")}`;
  const [lastX, lastY] = points[points.length - 1];
  const color = `var(--${tone})`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="flex-shrink-0 overflow-visible">
      <path d={path} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={lastX} cy={lastY} r={4} fill={color} stroke="var(--surface)" strokeWidth={2} />
    </svg>
  );
}
