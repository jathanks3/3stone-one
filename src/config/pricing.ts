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

export const WHOLESALE_DISCOUNT = 0.25;
export const ADDITIONAL_SEAT_PRICE = 5;

export function monthlyPriceForSeats(tier: PlanTier, seatCount: number): number {
  const seats = Math.max(1, Math.min(tier.maxEmployees, Math.trunc(seatCount) || 1));
  return tier.priceMonthly + (seats - 1) * ADDITIONAL_SEAT_PRICE;
}

export function wholesaleAnnualPrice(tier: PlanTier, seatCount = 1): number {
  return Math.round(monthlyPriceForSeats(tier, seatCount) * (1 - WHOLESALE_DISCOUNT) * 12);
}

export const PLAN_TIERS: PlanTier[] = [
  {
    key: "hub",
    label: "Plug-In",
    priceMonthly: 80,
    maxEmployees: 5,
    blurb: "Standard self-serve access with automated login and connections to the apps your business already uses.",
    stripePriceEnvVar: "STRIPE_PRICE_HUB",
  },
];

// Retained for existing subscriptions and stored workspace records. New
// customers choose Plug-In above; personalized configurations are priced
// through Build Your Stack instead of these retired fixed bundles.
const LEGACY_BUSINESS_PLAN_TIERS: PlanTier[] = [
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

// Workspace edition (editionKey "workspace") - day-to-day workers, CEOs,
// and managers. No finance/accounting, inventory, automation, or
// analytics. Priced with a lighter support-cost assumption than Original
// (this edition is simpler, more self-serve) - run through the same
// cost-model formula as Original, hand-computed against
// 3stone-website/src/pricing/internal/ (not yet published there - see
// PR notes), margins verified 77-83%, all above the 75% floor.
export const WORKSPACE_PLAN_TIERS: PlanTier[] = [
  {
    key: "workspace_starter",
    label: "Plug-In",
    priceMonthly: 60,
    maxEmployees: 9,
    blurb: "Standard self-serve access with automated login and connections for everyday workplace tools.",
    stripePriceEnvVar: "STRIPE_PRICE_WORKSPACE_STARTER",
  },
];

const LEGACY_WORKSPACE_PLAN_TIERS: PlanTier[] = [
  {
    key: "workspace_team",
    label: "Team",
    priceMonthly: 119,
    maxEmployees: 29,
    blurb: "Adds CRM, projects, and meetings - track work and customers without touching accounting.",
    stripePriceEnvVar: "STRIPE_PRICE_WORKSPACE_TEAM",
  },
  {
    key: "workspace_pro",
    label: "Pro",
    priceMonthly: 149,
    maxEmployees: 44,
    blurb: "Everything in Team plus approvals, for managers who need light sign-off flows.",
    stripePriceEnvVar: "STRIPE_PRICE_WORKSPACE_PRO",
  },
];

// Student edition (editionKey "student") - same philosophy as Workspace,
// lighter still: no CRM, client portal, or team directory. Real AI is
// included on every tier (no separate add-on) - see
// src/config/usageCaps.ts for the included allowance and overage pricing.
export const STUDENT_PLAN_TIERS: PlanTier[] = [
  {
    key: "student_starter",
    label: "Plug-In",
    priceMonthly: 40,
    maxEmployees: 2,
    blurb: "Standard self-serve access with automated login and connections for school and study tools.",
    stripePriceEnvVar: "STRIPE_PRICE_STUDENT_STARTER",
  },
];

const LEGACY_STUDENT_PLAN_TIERS: PlanTier[] = [
  {
    key: "student_plus",
    label: "Plus",
    priceMonthly: 79,
    maxEmployees: 10,
    blurb: "Adds project and meeting tracking - coursework, group projects, and deadlines in one place.",
    stripePriceEnvVar: "STRIPE_PRICE_STUDENT_PLUS",
  },
  {
    key: "student_premium",
    label: "Premium",
    priceMonthly: 99,
    maxEmployees: 18,
    blurb: "Everything in Plus plus reporting - track progress across a semester or a whole program.",
    stripePriceEnvVar: "STRIPE_PRICE_STUDENT_PREMIUM",
  },
];

// Enterprise has no fixed price on the marketing site (TierQuote.tierKey
// is null for it — "price is a discovery-call conversation"), so it
// deliberately has no PlanTier entry / no Stripe Price above. Checkout
// must never run for it. Applies to every edition, not just Original.
export const ENTERPRISE_LABEL = "Enterprise";

const ALL_PLAN_TIERS: PlanTier[] = [
  ...PLAN_TIERS,
  ...WORKSPACE_PLAN_TIERS,
  ...STUDENT_PLAN_TIERS,
  ...LEGACY_BUSINESS_PLAN_TIERS,
  ...LEGACY_WORKSPACE_PLAN_TIERS,
  ...LEGACY_STUDENT_PLAN_TIERS,
];

export function getPlanTier(key: string): PlanTier | undefined {
  return ALL_PLAN_TIERS.find((t) => t.key === key);
}

export function getPlanTiersForEdition(editionKey: string): PlanTier[] {
  if (editionKey === "workspace") return WORKSPACE_PLAN_TIERS;
  if (editionKey === "student") return STUDENT_PLAN_TIERS;
  return PLAN_TIERS;
}
