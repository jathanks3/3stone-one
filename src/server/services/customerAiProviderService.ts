import { db } from "@/server/db";
import { decryptToken, encryptToken } from "@/lib/tokenEncryption";

export type CustomerAiProviderName = "openai" | "anthropic";

export interface CustomerAiProvider {
  provider: CustomerAiProviderName;
  apiKey: string;
  model: string;
}

const PROVIDER_KEY: Record<CustomerAiProviderName, string> = {
  openai: "ai_openai",
  anthropic: "ai_anthropic",
};

const DEFAULT_MODEL: Record<CustomerAiProviderName, string> = {
  openai: "gpt-5-mini",
  anthropic: "claude-sonnet-5",
};

async function validateApiKey(provider: CustomerAiProviderName, apiKey: string): Promise<void> {
  const response = provider === "openai"
    ? await fetch("https://api.openai.com/v1/models", {
        headers: { Authorization: `Bearer ${apiKey}` },
        cache: "no-store",
      })
    : await fetch("https://api.anthropic.com/v1/models?limit=1", {
        headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
        cache: "no-store",
      });
  if (!response.ok) throw new Error(`${provider === "openai" ? "OpenAI" : "Anthropic"} rejected that API key (${response.status}).`);
}

export async function connectCustomerAiProvider(
  workspaceId: string,
  userId: string,
  provider: CustomerAiProviderName,
  apiKeyInput: string
): Promise<void> {
  const apiKey = apiKeyInput.trim();
  if (!apiKey) throw new Error("API key is required.");
  await validateApiKey(provider, apiKey);
  const providerKey = PROVIDER_KEY[provider];
  await db.integration.upsert({
    where: { workspaceId_provider: { workspaceId, provider: providerKey } },
    update: {
      status: "connected",
      connectedAt: new Date(),
      connectedByUserId: userId,
      accessTokenEncrypted: encryptToken(apiKey),
      scope: "customer_api_key",
      config: { model: DEFAULT_MODEL[provider] },
    },
    create: {
      workspaceId,
      provider: providerKey,
      status: "connected",
      connectedAt: new Date(),
      connectedByUserId: userId,
      accessTokenEncrypted: encryptToken(apiKey),
      scope: "customer_api_key",
      config: { model: DEFAULT_MODEL[provider] },
    },
  });
}

export async function disconnectCustomerAiProvider(workspaceId: string, provider: CustomerAiProviderName): Promise<void> {
  const providerKey = PROVIDER_KEY[provider];
  await db.integration.upsert({
    where: { workspaceId_provider: { workspaceId, provider: providerKey } },
    update: { status: "not_connected", connectedAt: null, connectedByUserId: null, accessTokenEncrypted: null, scope: null, config: {} },
    create: { workspaceId, provider: providerKey, status: "not_connected" },
  });
}

export async function getPreferredCustomerAiProvider(workspaceId: string): Promise<CustomerAiProvider | null> {
  const rows = await db.integration.findMany({
    where: { workspaceId, provider: { in: Object.values(PROVIDER_KEY) }, status: "connected", accessTokenEncrypted: { not: null } },
    orderBy: { connectedAt: "desc" },
  });
  const row = rows[0];
  if (!row?.accessTokenEncrypted) return null;
  const provider = row.provider === PROVIDER_KEY.openai ? "openai" : "anthropic";
  const config = (row.config ?? {}) as { model?: string };
  return { provider, apiKey: decryptToken(row.accessTokenEncrypted), model: config.model ?? DEFAULT_MODEL[provider] };
}
