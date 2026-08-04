import Stripe from "stripe";
import { db } from "@/server/db";
import { getPlanTier, monthlyPriceForSeats, wholesaleAnnualPrice, type PlanTier } from "@/config/pricing";
import { createNotification } from "@/server/services/notificationService";
import {
  AI_OVERAGE_PACK_ACTIONS,
  AI_OVERAGE_PACK_PRICE_CENTS,
  STORAGE_OVERAGE_PACK_GB,
  STORAGE_OVERAGE_PACK_PRICE_CENTS,
} from "@/config/usageCaps";
import type { WorkspacePlan } from "@/types";

// Lazy singleton, same reasoning as src/server/db.ts's Proxy-wrapped
// Prisma client: constructing this at module load time would throw
// during `next build`'s route collection for every route that imports
// this file, even ones never hit, on any environment without
// STRIPE_SECRET_KEY set (which is every environment today — no live
// keys exist yet, see docs/18-architecture-inventory.md).
let _stripe: Stripe | null = null;

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

function getStripeClient(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error(
        "STRIPE_SECRET_KEY is not set. Billing actions are unavailable until it is — see the Founder Integration Center."
      );
    }
    _stripe = new Stripe(key);
  }
  return _stripe;
}

async function ensureCustomer(workspaceId: string): Promise<string> {
  const stripe = getStripeClient();
  const [workspace, subscription] = await Promise.all([
    db.workspace.findUniqueOrThrow({ where: { id: workspaceId } }),
    db.subscription.findUnique({ where: { workspaceId } }),
  ]);

  if (subscription?.stripeCustomerId) {
    return subscription.stripeCustomerId;
  }

  const customer = await stripe.customers.create({
    name: workspace.name,
    metadata: { workspaceId },
  });
  await db.subscription.upsert({
    where: { workspaceId },
    update: { stripeCustomerId: customer.id },
    create: { workspaceId, stripeCustomerId: customer.id },
  });
  return customer.id;
}

// Looks up this tier's Price via its configured env var first; if unset,
// searches for a Product this app already created (by metadata, not by
// name — names can be edited in the dashboard, metadata can't drift the
// same way) and creates it if genuinely missing. The point: once
// STRIPE_SECRET_KEY exists, the founder never has to hand-create
// Products/Prices in the Stripe dashboard themselves.
export type BillingMode = "monthly" | "wholesale-annual";

async function ensurePriceForPlan(tier: PlanTier, billingMode: BillingMode, seatCount: number): Promise<string> {
  const stripe = getStripeClient();
  const envPriceId = process.env[tier.stripePriceEnvVar];
  const interval = billingMode === "wholesale-annual" ? "year" : "month";
  const unitAmount = billingMode === "wholesale-annual" ? wholesaleAnnualPrice(tier, seatCount) * 100 : monthlyPriceForSeats(tier, seatCount) * 100;
  if (envPriceId && billingMode === "monthly" && seatCount === 1) {
    const configuredPrice = await stripe.prices.retrieve(envPriceId);
    if (configuredPrice.active && configuredPrice.recurring?.interval === interval && configuredPrice.unit_amount === unitAmount) {
      return configuredPrice.id;
    }
  }

  const existingProducts = await stripe.products.search({
    query: `metadata['app']:'3stone-one' AND metadata['planKey']:'${tier.key}'`,
  });
  const existingProduct = existingProducts.data[0];
  if (existingProduct) {
    const prices = await stripe.prices.list({ product: existingProduct.id, active: true, limit: 100 });
    const matchingPrice = prices.data.find((price) => price.recurring?.interval === interval && price.unit_amount === unitAmount && Number(price.metadata.seatCount ?? "1") === seatCount);
    if (matchingPrice) return matchingPrice.id;
  }

  const product =
    existingProduct ??
    (await stripe.products.create({
      name: `3Stone One — ${tier.label}`,
      metadata: { app: "3stone-one", planKey: tier.key },
    }));
  const price = await stripe.prices.create({
    product: product.id,
    currency: "usd",
    unit_amount: unitAmount,
    recurring: { interval },
    metadata: { app: "3stone-one", planKey: tier.key, billingMode, seatCount: String(seatCount) },
  });
  return price.id;
}

export async function createCheckoutSession(
  workspaceId: string,
  planKey: Exclude<WorkspacePlan, "free" | "enterprise">,
  urls: { successUrl: string; cancelUrl: string },
  options?: { trialDays?: number; billingMode?: BillingMode; seatCount?: number }
): Promise<{ url: string }> {
  const tier = getPlanTier(planKey);
  if (!tier) throw new Error(`Unknown plan "${planKey}".`);
  const billingMode = options?.billingMode ?? "monthly";
  const seatCount = Math.max(1, Math.min(tier.maxEmployees, Math.trunc(options?.seatCount ?? 1)));

  const stripe = getStripeClient();
  const customerId = await ensureCustomer(workspaceId);
  const subscription = await db.subscription.findUnique({ where: { workspaceId } });
  if (subscription?.stripeSubscriptionId && ["active", "trialing"].includes(subscription.status)) {
    throw new Error("This workspace already has a subscription. Use Manage billing to change it.");
  }

  // Founder pricing override (Subscription.isFounderPricing +
  // priceOverrideCents — real fields, no admin UI to set them yet, so
  // this only ever fires for a workspace someone already set directly in
  // the database): an ad-hoc price_data line instead of the tier's
  // normal shared Price, so a founder-negotiated rate never touches the
  // public Price object other customers check out against.
  const lineItem =
    billingMode === "monthly" && subscription?.isFounderPricing && subscription.priceOverrideCents
      ? {
          price_data: {
            currency: "usd",
            unit_amount: subscription.priceOverrideCents,
            recurring: { interval: "month" as const },
            product_data: { name: `3Stone One — ${tier.label} (founder pricing)` },
          },
          quantity: 1,
        }
      : { price: await ensurePriceForPlan(tier, billingMode, seatCount), quantity: 1 };

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [lineItem],
    success_url: urls.successUrl,
    cancel_url: urls.cancelUrl,
    metadata: { workspaceId, planKey, billingMode, seatCount: String(seatCount) },
    subscription_data: {
      metadata: { workspaceId, planKey, billingMode, seatCount: String(seatCount) },
      ...(options?.trialDays ? { trial_period_days: options.trialDays } : {}),
    },
  });

  if (!session.url) throw new Error("Stripe did not return a checkout URL.");
  return { url: session.url };
}

// Usage-cap overage packs (usageCapService.ts) - one-time purchases, not
// subscriptions. Same auto-create-Product-if-missing pattern as
// ensurePriceForPlan, so these never need hand-creating in the Stripe
// dashboard either.
const OVERAGE_PACKS = {
  ai_overage: {
    name: "3Stone One — +100 AI actions this cycle",
    priceCents: AI_OVERAGE_PACK_PRICE_CENTS,
    envVar: "STRIPE_PRICE_AI_OVERAGE_PACK",
  },
  storage_overage: {
    name: "3Stone One — +5GB storage",
    priceCents: STORAGE_OVERAGE_PACK_PRICE_CENTS,
    envVar: "STRIPE_PRICE_STORAGE_OVERAGE_PACK",
  },
} as const;
export type OveragePackKey = keyof typeof OVERAGE_PACKS;

async function ensurePriceForOveragePack(packKey: OveragePackKey): Promise<string> {
  const stripe = getStripeClient();
  const pack = OVERAGE_PACKS[packKey];
  const envPriceId = process.env[pack.envVar];
  if (envPriceId) return envPriceId;

  const existingProducts = await stripe.products.search({
    query: `metadata['app']:'3stone-one' AND metadata['packKey']:'${packKey}'`,
  });
  const existingProduct = existingProducts.data[0];
  if (existingProduct) {
    const prices = await stripe.prices.list({ product: existingProduct.id, active: true, limit: 1 });
    if (prices.data[0]) return prices.data[0].id;
  }

  const product =
    existingProduct ??
    (await stripe.products.create({ name: pack.name, metadata: { app: "3stone-one", packKey } }));
  const price = await stripe.prices.create({
    product: product.id,
    currency: "usd",
    unit_amount: pack.priceCents,
    metadata: { app: "3stone-one", packKey },
  });
  return price.id;
}

export async function createOveragePackCheckoutSession(
  workspaceId: string,
  packKey: OveragePackKey,
  urls: { successUrl: string; cancelUrl: string }
): Promise<{ url: string }> {
  const stripe = getStripeClient();
  const customerId = await ensureCustomer(workspaceId);
  const priceId = await ensurePriceForOveragePack(packKey);

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: urls.successUrl,
    cancel_url: urls.cancelUrl,
    metadata: { workspaceId, packKey },
  });

  if (!session.url) throw new Error("Stripe did not return a checkout URL.");
  return { url: session.url };
}

export async function createBillingPortalSession(workspaceId: string, returnUrl: string): Promise<{ url: string }> {
  const stripe = getStripeClient();
  const subscription = await db.subscription.findUnique({ where: { workspaceId } });
  if (!subscription?.stripeCustomerId) {
    throw new Error("No billing account yet — start a checkout first.");
  }
  const session = await stripe.billingPortal.sessions.create({
    customer: subscription.stripeCustomerId,
    return_url: returnUrl,
  });
  return { url: session.url };
}

export function verifyWebhookEvent(payload: string, signature: string): Stripe.Event {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error("STRIPE_WEBHOOK_SECRET is not set.");
  }
  return getStripeClient().webhooks.constructEvent(payload, signature, secret);
}

function planKeyFromMetadata(metadata: Stripe.Metadata | null | undefined): WorkspacePlan | null {
  const key = metadata?.planKey;
  if (key && getPlanTier(key)) return key as WorkspacePlan;
  return null;
}

async function notifyPaymentFailed(workspaceId: string): Promise<void> {
  const owner = await db.workspaceMember.findFirst({
    where: { workspaceId, status: "active" },
    orderBy: { joinedAt: "asc" },
  });
  if (owner) {
    // Reuses the generic notification framework rather than a
    // billing-specific side channel — "workspace events" already covers
    // this category (src/server/services/notificationService.ts).
    await createNotification(workspaceId, owner.userId, "payment_failed", {});
  }
}

// The one entry point the webhook route calls — every Stripe event this
// app currently cares about, real sync only (never fabricates a status
// Stripe didn't actually report).
export async function handleWebhookEvent(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const workspaceId = session.metadata?.workspaceId;
      if (!workspaceId) break;

      const packKey = session.metadata?.packKey as "ai_overage" | "storage_overage" | undefined;
      if (packKey) {
        // One-time overage-pack purchase, not a plan change - increments
        // the cap, doesn't touch plan/status. AI actions are a per-cycle
        // top-up (reset alongside the cycle below); storage is permanent.
        await db.subscription.update({
          where: { workspaceId },
          data:
            packKey === "ai_overage"
              ? { aiActionsPurchased: { increment: AI_OVERAGE_PACK_ACTIONS } }
              : { storageGbPurchased: { increment: STORAGE_OVERAGE_PACK_GB } },
        });
        break;
      }

      const planKey = planKeyFromMetadata(session.metadata);
      if (!planKey) break;
      await db.workspace.update({ where: { id: workspaceId }, data: { plan: planKey } });
      await db.subscription.update({
        where: { workspaceId },
        data: {
          plan: planKey,
          stripeSubscriptionId: typeof session.subscription === "string" ? session.subscription : undefined,
        },
      });
      break;
    }
    case "customer.subscription.updated":
    case "customer.subscription.created": {
      const sub = event.data.object as Stripe.Subscription;
      const workspaceId = sub.metadata?.workspaceId;
      if (!workspaceId) break;
      const item = sub.items.data[0];
      const statusMap: Record<string, string> = {
        active: "active",
        trialing: "trialing",
        past_due: "past_due",
        canceled: "canceled",
        unpaid: "past_due",
        paused: "paused",
        incomplete: "past_due",
        incomplete_expired: "canceled",
      };
      const newPeriodStart = item?.current_period_start ? new Date(item.current_period_start * 1000) : undefined;

      // A new billing cycle starting is what resets the AI overage top-up
      // - it was only ever a top-up for the cycle it was bought in, per
      // usageCapService.ts. Compare against what's already stored so this
      // doesn't fire on every unrelated subscription.updated event.
      const existing = await db.subscription.findUnique({ where: { workspaceId } });
      const isNewCycle =
        newPeriodStart && (!existing?.currentPeriodStart || existing.currentPeriodStart.getTime() !== newPeriodStart.getTime());

      await db.subscription.update({
        where: { workspaceId },
        data: {
          status: (statusMap[sub.status] ?? "active") as never,
          stripeSubscriptionId: sub.id,
          stripePriceId: item?.price.id,
          mrrCents: item?.price.unit_amount ?? undefined,
          cancelAtPeriodEnd: sub.cancel_at_period_end,
          currentPeriodStart: newPeriodStart,
          currentPeriodEnd: item?.current_period_end ? new Date(item.current_period_end * 1000) : undefined,
          ...(isNewCycle ? { aiActionsPurchased: 0 } : {}),
        },
      });
      break;
    }
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const workspaceId = sub.metadata?.workspaceId;
      if (!workspaceId) break;
      await db.workspace.update({ where: { id: workspaceId }, data: { plan: "free" } });
      await db.subscription.update({
        where: { workspaceId },
        data: { status: "canceled", plan: "free", mrrCents: 0 },
      });
      break;
    }
    case "invoice.paid": {
      const invoice = event.data.object as Stripe.Invoice;
      const subscriptionId =
        typeof invoice.parent?.subscription_details?.subscription === "string"
          ? invoice.parent.subscription_details.subscription
          : undefined;
      const subscription = subscriptionId
        ? await db.subscription.findFirst({ where: { stripeSubscriptionId: subscriptionId } })
        : null;
      if (!subscription) break;
      await db.platformInvoice.upsert({
        where: { stripeInvoiceId: invoice.id },
        update: { status: "paid", paidAt: new Date() },
        create: {
          workspaceId: subscription.workspaceId,
          stripeInvoiceId: invoice.id,
          amountCents: invoice.amount_paid,
          status: "paid",
          paidAt: new Date(),
        },
      });
      break;
    }
    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const subscriptionId =
        typeof invoice.parent?.subscription_details?.subscription === "string"
          ? invoice.parent.subscription_details.subscription
          : undefined;
      const subscription = subscriptionId
        ? await db.subscription.findFirst({ where: { stripeSubscriptionId: subscriptionId } })
        : null;
      if (!subscription) break;
      await db.subscription.update({ where: { workspaceId: subscription.workspaceId }, data: { status: "past_due" } });
      await db.platformInvoice.upsert({
        where: { stripeInvoiceId: invoice.id },
        update: { status: "open" },
        create: {
          workspaceId: subscription.workspaceId,
          stripeInvoiceId: invoice.id,
          amountCents: invoice.amount_due,
          status: "open",
          dueDate: invoice.due_date ? new Date(invoice.due_date * 1000) : undefined,
        },
      });
      await notifyPaymentFailed(subscription.workspaceId);
      break;
    }
    default:
      break;
  }
}

// Exported for the Founder Integration Center's "Test connection" — a
// cheap, side-effect-free call that either succeeds (proving the key is
// valid) or throws with Stripe's own error message. balance.retrieve()
// rather than accounts.retrieve() — the latter requires an explicit
// account ID (Connect-platform shaped), which this app isn't.
export async function verifyStripeConnection(): Promise<{ livemode: boolean }> {
  const stripe = getStripeClient();
  const balance = await stripe.balance.retrieve();
  return { livemode: balance.livemode };
}

// Idempotent — safe to call every time the founder adds/rotates
// STRIPE_SECRET_KEY. Registers this deployment's webhook URL if it
// doesn't already have one, so the founder never has to click through
// the Stripe Dashboard's webhook UI by hand. Returns the signing secret
// ONLY on first creation (Stripe never exposes it again afterward) —
// the caller (Founder Integration Center) is responsible for telling the
// founder to save it as STRIPE_WEBHOOK_SECRET.
export async function ensureWebhookEndpoint(appUrl: string): Promise<{ created: boolean; secret?: string; id: string }> {
  const stripe = getStripeClient();
  const webhookUrl = `${appUrl.replace(/\/$/, "")}/api/webhooks/stripe`;
  const existing = await stripe.webhookEndpoints.list({ limit: 100 });
  const match = existing.data.find((w) => w.url === webhookUrl);
  if (match) return { created: false, id: match.id };

  const endpoint = await stripe.webhookEndpoints.create({
    url: webhookUrl,
    enabled_events: [
      "checkout.session.completed",
      "customer.subscription.created",
      "customer.subscription.updated",
      "customer.subscription.deleted",
      "invoice.paid",
      "invoice.payment_failed",
    ],
  });
  return { created: true, secret: endpoint.secret, id: endpoint.id };
}
