import type { LucideIcon } from "lucide-react";

export function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-line py-14 text-center">
      <Icon size={28} strokeWidth={1.5} className="text-ink-3" />
      <p className="text-[14px] font-semibold text-ink-1">{title}</p>
      <p className="max-w-[280px] text-[13px] text-ink-3">{description}</p>
    </div>
  );
}
