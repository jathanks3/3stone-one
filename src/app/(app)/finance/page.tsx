import type { Metadata } from "next";
import { FinanceClient } from "@/features/finance/FinanceClient";

export const metadata: Metadata = { title: "Finance — 3Stone One" };

export default function FinancePage() {
  return <FinanceClient />;
}
