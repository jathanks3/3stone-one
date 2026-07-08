import type { Metadata } from "next";
import { AutomationClient } from "@/features/automation/AutomationClient";

export const metadata: Metadata = { title: "Automation — 3Stone One" };

export default function AutomationPage() {
  return <AutomationClient />;
}
