import type { PortfolioCompany } from "@/types";

export const DEMO_PORTFOLIO: PortfolioCompany[] = [
  {
    id: "co_acme",
    name: "Acme Construction",
    industryKey: "construction",
    industryLabel: "Construction",
    revenue: 184000,
    revenueDeltaPct: 12,
    overdueCount: 2,
    isCurrent: true,
  },
  {
    id: "co_downtown_bistro",
    name: "Downtown Bistro Group",
    industryKey: "restaurant",
    industryLabel: "Restaurant",
    revenue: 92000,
    revenueDeltaPct: 3,
    overdueCount: 0,
    isCurrent: false,
  },
  {
    id: "co_sterling_security",
    name: "Sterling Security Partners",
    industryKey: "security",
    industryLabel: "Security",
    revenue: 61000,
    revenueDeltaPct: -2,
    overdueCount: 1,
    isCurrent: false,
  },
];
