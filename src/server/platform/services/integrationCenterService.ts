import { db } from "@/server/db";
import { isStripeConfigured, verifyStripeConnection } from "@/server/services/stripeService";
import { isStorageConfigured, verifyStorageConnection } from "@/server/services/storageService";
import { isEmailConfigured, verifyEmailConnection } from "@/server/services/emailService";
import { isAiProviderConfigured } from "@/server/ai/aiProvider";

export type IntegrationStatus =
  | "connected"
  | "setup_required"
  | "missing_credentials"
  | "needs_dns"
  | "authorization_expired"
  | "error"
  | "disabled";

export interface IntegrationEntry {
  key: string;
  label: string;
  category: string;
  status: IntegrationStatus;
  requiredEnvVars: string[];
  lastSuccessAt: Date | null;
  lastErrorAt: Date | null;
  lastErrorMessage: string | null;
  canTest: boolean;
  note: string;
}

interface ServiceDefinition {
  key: string;
  label: string;
  category: string;
  requiredEnvVars: string[];
  isConfigured: () => boolean;
  note: string;
  test?: () => Promise<{ ok: boolean; message: string }>;
}

// One definition per external service this app actually integrates
// with (docs/18-architecture-inventory.md is the authoritative written
// record; this is the same list, made queryable/testable from inside the
// app itself — the whole point of this page per the founder's charter:
// "the founder should manage integrations from the application instead
// of reading documentation or checking Vercel manually").
const SERVICES: ServiceDefinition[] = [
  {
    key: "neon",
    label: "Neon (Postgres)",
    category: "Database",
    requiredEnvVars: ["DATABASE_URL", "DATABASE_URL_UNPOOLED"],
    isConfigured: () => Boolean(process.env.DATABASE_URL),
    note: "The primary database — every real read/write in this app goes through it.",
    test: async () => {
      await db.$queryRaw`SELECT 1`;
      return { ok: true, message: "Query succeeded." };
    },
  },
  {
    key: "vercel",
    label: "Vercel",
    category: "Hosting",
    requiredEnvVars: [],
    isConfigured: () => true,
    note: "Hosting platform — this page running at all confirms it's connected. No credential to check from inside the app.",
  },
  {
    key: "stripe",
    label: "Stripe",
    category: "Payments",
    requiredEnvVars: ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET"],
    isConfigured: () => isStripeConfigured(),
    note: "Subscription billing — checkout, billing portal, webhooks. Products/Prices self-provision once the secret key exists.",
    test: async () => {
      const { livemode } = await verifyStripeConnection();
      return { ok: true, message: `Connected (${livemode ? "live" : "test"} mode).` };
    },
  },
  {
    key: "supabase_storage",
    label: "Supabase (Storage only)",
    category: "Storage",
    requiredEnvVars: ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"],
    isConfigured: () => isStorageConfigured(),
    note: "Avatars, workspace logos, document uploads. Storage only — never auth or the primary database.",
    test: async () => {
      const { buckets } = await verifyStorageConnection();
      return { ok: true, message: `Buckets ready: ${buckets.join(", ")}.` };
    },
  },
  {
    key: "google_workspace_email",
    label: "Google Workspace (Email)",
    category: "Email",
    requiredEnvVars: ["GOOGLE_WORKSPACE_SMTP_USER", "GOOGLE_WORKSPACE_SMTP_APP_PASSWORD"],
    isConfigured: () => isEmailConfigured(),
    note: "DNS is already verified for 3stoneai.com (MX + DKIM confirmed) — only an App Password for the sending mailbox is missing.",
    test: async () => {
      await verifyEmailConnection();
      return { ok: true, message: "SMTP login succeeded." };
    },
  },
  {
    key: "ai_provider",
    label: "AI provider (Anthropic)",
    category: "AI",
    requiredEnvVars: ["ANTHROPIC_API_KEY"],
    isConfigured: () => isAiProviderConfigured(),
    note: "Abstraction only — no capability calls a real model yet even once a key is set. See src/server/ai/aiProvider.ts.",
  },
];

export async function listIntegrations(): Promise<IntegrationEntry[]> {
  const verifications = await db.integrationVerification.findMany();
  const byKey = new Map(verifications.map((v) => [v.serviceKey, v]));

  return SERVICES.map((service) => {
    const verification = byKey.get(service.key);
    const configured = service.isConfigured();
    let status: IntegrationStatus;
    if (!service.requiredEnvVars.length) {
      status = "connected";
    } else if (!configured) {
      status = "missing_credentials";
    } else if (verification?.lastErrorAt && (!verification.lastSuccessAt || verification.lastErrorAt > verification.lastSuccessAt)) {
      status = "error";
    } else {
      status = "connected";
    }

    return {
      key: service.key,
      label: service.label,
      category: service.category,
      status,
      requiredEnvVars: service.requiredEnvVars,
      lastSuccessAt: verification?.lastSuccessAt ?? null,
      lastErrorAt: verification?.lastErrorAt ?? null,
      lastErrorMessage: verification?.lastErrorMessage ?? null,
      canTest: Boolean(service.test) && configured,
      note: service.note,
    };
  });
}

export async function testIntegration(key: string): Promise<{ ok: boolean; message: string }> {
  const service = SERVICES.find((s) => s.key === key);
  if (!service?.test) {
    return { ok: false, message: "No test available for this service." };
  }
  try {
    const result = await service.test();
    await db.integrationVerification.upsert({
      where: { serviceKey: key },
      update: { lastSuccessAt: new Date() },
      create: { serviceKey: key, lastSuccessAt: new Date() },
    });
    return result;
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error.";
    await db.integrationVerification.upsert({
      where: { serviceKey: key },
      update: { lastErrorAt: new Date(), lastErrorMessage: message },
      create: { serviceKey: key, lastErrorAt: new Date(), lastErrorMessage: message },
    });
    return { ok: false, message };
  }
}
