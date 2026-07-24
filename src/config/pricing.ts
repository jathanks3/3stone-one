import type { WorkspacePlan } from "@/types";

// Mirrors 3stone-website/src/pricing/data/tiers.ts (module composition,
// blurbs) and published-pricing.ts (prices), generated there on 2026-07-13
// by the internal cost-model engine. That page is the source of truth per
// the founder's stack-reconciliation charter — this file is a hand-kept
// copy for the two repos are separate deployments with no shared package.
// If the marketing site republishes new prices, update this file to match;
// never invent a number here that isn't on the live pricing page.
export interface PlanTier {
  key: Exclude<WorkspacePlan, "free" | "enterprise">;
  label: string;
  priceMonthly: number;
  maxEmployees: number;
  blurb: string;
  // Env var holding this tier's Stripe Price ID once provisioned. Not
  // required to exist yet — stripeService creates the Product/Price
  // itself on first real checkout if STRIPE_SECRET_KEY is configured but
  // no matching Price is found, specifically to avoid the founder ever
  // needing to hand-create Products/Prices in the Stripe dashboard.
  stripePriceEnvVar: string;
}

export const PLAN_TIERS: PlanTier[] = [
  {
    key: "hub",
    label: "Hub",
    priceMonthly: 99,
    maxEmployees: 16,
    blurb: "One place to see the business. Keep every tool you have — 3Stone One connects them, adds your client portal, documents, and scheduling.",
    stripePriceEnvVar: "STRIPE_PRICE_HUB",
  },
  {
    key: "growth",
    label: "Growth",
    priceMonthly: 179,
    maxEmployees: 46,
    blurb: "The working core: customers, jobs, invoices, approvals, and reporting join the hub — most replaced tools land here.",
    stripePriceEnvVar: "STRIPE_PRICE_GROWTH",
  },
  {
    key: "business_os",
    label: "Business OS",
    priceMonthly: 279,
    maxEmployees: 26,
    blurb: "The whole operating system: everything in Growth plus AI assistance, automation, and meetings.",
    stripePriceEnvVar: "STRIPE_PRICE_BUSINESS_OS",
  },
];

// Enterprise has no fixed price on the marketing site (TierQuote.tierKey
// is null for it — "price is a discovery-call conversation"), so it
// deliberately has no PlanTier entry / no Stripe Price above. Checkout
// must never run for it.
export const ENTERPRISE_LABEL = "Enterprise";

export function getPlanTier(key: string): PlanTier | undefined {
  return PLAN_TIERS.find((t) => t.key === key);
}
