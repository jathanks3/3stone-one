import { db } from "@/server/db";

export interface BillingSummary {
  plan: string;
  status: string;
  mrrCents: number;
  isFounderPricing: boolean;
  trialEndsAt: Date | null;
  currentPeriodEnd: Date | null;
  invoices: { id: string; amountCents: number; status: string; dueDate: Date | null; paidAt: Date | null }[];
}

// Real data model, no live Stripe calls — this workspace's Subscription
// row is created by onboardingService.selectPlan during signup (today,
// only "free" is reachable) and is otherwise exactly what a real Stripe
// webhook would update once that integration exists. Never fabricates a
// payment, a plan, or an invoice: PlatformInvoice is genuinely empty
// today because nothing has billed yet, so invoices comes back empty,
// not filled with sample rows.
export async function getBillingSummary(workspaceId: string): Promise<BillingSummary> {
  const [subscription, invoices] = await Promise.all([
    db.subscription.findUnique({ where: { workspaceId } }),
    db.platformInvoice.findMany({ where: { workspaceId }, orderBy: { createdAt: "desc" } }),
  ]);

  return {
    plan: subscription?.plan ?? "free",
    status: subscription?.status ?? "trialing",
    mrrCents: subscription?.mrrCents ?? 0,
    isFounderPricing: subscription?.isFounderPricing ?? false,
    trialEndsAt: subscription?.trialEndsAt ?? null,
    currentPeriodEnd: subscription?.currentPeriodEnd ?? null,
    invoices: invoices.map((i) => ({
      id: i.id,
      amountCents: i.amountCents,
      status: i.status,
      dueDate: i.dueDate,
      paidAt: i.paidAt,
    })),
  };
}
