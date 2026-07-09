"use client";

import dynamic from "next/dynamic";
import { ChartSkeleton } from "@/ui/ChartSkeleton";

export const JobStatusChartLazy = dynamic(
  () => import("./JobStatusChart").then((m) => m.JobStatusChart),
  { ssr: false, loading: () => <ChartSkeleton /> }
);
