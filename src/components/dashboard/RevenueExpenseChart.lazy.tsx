"use client";

import dynamic from "next/dynamic";
import { ChartSkeleton } from "@/ui/ChartSkeleton";

export const RevenueExpenseChartLazy = dynamic(
  () => import("./RevenueExpenseChart").then((m) => m.RevenueExpenseChart),
  { ssr: false, loading: () => <ChartSkeleton /> }
);
