import { Card } from "@/ui/Card";
import { Avatar } from "@/ui/Avatar";
import { Badge } from "@/ui/Badge";
import type { Employee } from "@/types";

export function WhosBehindCard({ employees }: { employees: Employee[] }) {
  return (
    <Card className="p-5">
      <h2 className="text-[13px] font-semibold text-ink-2">Who&rsquo;s behind</h2>
      <ul className="mt-3.5 flex flex-col gap-3">
        {employees.map((employee) => (
          <li key={employee.id} className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Avatar initials={employee.initials} size={28} />
              <div>
                <p className="text-[13.5px] font-medium leading-tight text-ink-1">{employee.name}</p>
                <p className="text-[11.5px] text-ink-3">{employee.title}</p>
              </div>
            </div>
            <Badge tone="critical">{employee.overdueCount} overdue</Badge>
          </li>
        ))}
        {employees.length === 0 ? (
          <p className="text-[13.5px] text-ink-3">Everyone&rsquo;s caught up.</p>
        ) : null}
      </ul>
    </Card>
  );
}
