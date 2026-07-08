import type { ApiKeyRecord } from "@/types";

export const DEMO_API_KEYS: ApiKeyRecord[] = [
  { id: "key_1", label: "Production", lastFour: "8f2a", createdAt: "2026-03-12", lastUsedAt: "2 hours ago" },
  { id: "key_2", label: "QuickBooks Sync", lastFour: "c910", createdAt: "2026-05-01", lastUsedAt: "12 minutes ago" },
  { id: "key_3", label: "Zapier (legacy)", lastFour: "441d", createdAt: "2025-11-20", lastUsedAt: null },
];

export const COMPANY_PROFILE = {
  name: "Acme Construction",
  legalName: "Acme Construction LLC",
  address: "1420 Industrial Pkwy, Suite 200, Riverside, CA 92501",
  phone: "(555) 200-1000",
  website: "acmeconstruction.com",
  founded: "2014",
};

export const BILLING = {
  plan: "Pro",
  price: 299,
  seatCount: 9,
  nextInvoiceDate: "2026-08-01",
  paymentMethod: "Visa •••• 4242",
  history: [
    { id: "inv_b1", date: "2026-07-01", amount: 299, status: "Paid" },
    { id: "inv_b2", date: "2026-06-01", amount: 299, status: "Paid" },
    { id: "inv_b3", date: "2026-05-01", amount: 299, status: "Paid" },
  ],
};
