import type { Metadata } from "next";
import { PortfolioClient } from "@/features/portfolio/PortfolioClient";
import { getSession } from "@/lib/session";
import { NotYetConnected } from "@/components/shell/NotYetConnected";

export const metadata: Metadata = { title: "Executive Overview — 3Stone One" };

export default async function PortfolioPage() {
  const session = await getSession();
  if (session && !session.isDemo) {
    return <NotYetConnected moduleName="Executive Overview" />;
  }
  return <PortfolioClient />;
}
