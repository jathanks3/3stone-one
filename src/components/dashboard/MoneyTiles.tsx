import { StatTile } from "@/ui/StatTile";
import { formatCurrency } from "@/lib/utils";

export function RevenueTile({
  revenue,
  deltaPct,
  trend,
}: {
  revenue: number;
  deltaPct: number;
  trend: number[];
}) {
  return (
    <StatTile
      label="Making money"
      value={formatCurrency(revenue, { compact: true })}
      deltaPct={deltaPct}
      direction="up"
      deltaTone="good"
      trend={trend}
    />
  );
}

export function ExpensesTile({
  expenses,
  deltaPct,
  trend,
}: {
  expenses: number;
  deltaPct: number;
  trend: number[];
}) {
  return (
    <StatTile
      label="Costing money"
      value={formatCurrency(expenses, { compact: true })}
      deltaPct={deltaPct}
      direction="up"
      deltaTone="warning"
      trend={trend}
    />
  );
}
