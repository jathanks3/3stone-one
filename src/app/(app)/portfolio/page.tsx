import type { Metadata } from "next";
import { PortfolioClient } from "@/features/portfolio/PortfolioClient";

export const metadata: Metadata = { title: "Executive Overview — 3Stone One" };

export default function PortfolioPage() {
  return <PortfolioClient />;
}
