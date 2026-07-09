import type { Metadata } from "next";
import { DashboardClient } from "@/features/dashboard/DashboardClient";

export const metadata: Metadata = {
  title: "Dashboard — 3Stone One",
};

export default function DashboardPage() {
  return <DashboardClient />;
}
