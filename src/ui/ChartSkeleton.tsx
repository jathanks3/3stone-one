export function ChartSkeleton({ height = 220 }: { height?: number }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-5">
      <div className="h-4 w-40 animate-pulse rounded bg-surface-raised" />
      <div className="mt-4 animate-pulse rounded-xl bg-surface-raised" style={{ height }} />
    </div>
  );
}
