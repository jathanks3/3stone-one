import { cn } from "@/lib/utils";

export function Avatar({
  initials,
  size = 32,
  className,
}: {
  initials: string;
  size?: number;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "flex flex-shrink-0 items-center justify-center rounded-full bg-accent-wash font-semibold text-accent",
        className
      )}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.38) }}
    >
      {initials}
    </span>
  );
}
