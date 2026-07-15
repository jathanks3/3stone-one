import type { Metadata } from "next";
import { InventoryClient } from "@/features/inventory/InventoryClient";
export const metadata: Metadata = { title: "Inventory — 3Stone One" };
export default function InventoryPage(){ return <InventoryClient/> }
