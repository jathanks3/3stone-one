import { Card } from "@/ui/Card";
import type { ActivityItem } from "@/types";

export function ChangedTodayCard({ activity }: { activity: ActivityItem[] }) {
  return (
    <Card className="p-5">
      <h2 className="text-[13px] font-semibold text-ink-2">What changed today</h2>
      <ul className="mt-3.5 flex flex-col gap-3.5">
        {activity.map((item) => (
          <li key={item.id} className="flex items-start justify-between gap-3">
            <span className="text-[14px] text-ink-1">{item.message}</span>
            <span className="flex-shrink-0 whitespace-nowrap text-[12px] text-ink-3">{item.timestamp}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
