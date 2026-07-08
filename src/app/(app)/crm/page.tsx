import type { Metadata } from "next";
import { CrmClient } from "@/features/crm/CrmClient";

export const metadata: Metadata = { title: "CRM — 3Stone One" };

export default function CrmPage() {
  return <CrmClient />;
}
