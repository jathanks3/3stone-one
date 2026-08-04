import { db } from "@/server/db";
import { decryptToken, encryptToken } from "@/lib/tokenEncryption";

// Real Wild Apricot API v2 - no OAuth app registration needed (unlike
// Google/Microsoft/Slack/the Basecamp integration below): a customer
// generates their own account-level "API Key" from their own Wild
// Apricot account settings, which this exchanges for a short-lived
// Bearer access token via client_credentials grant. Same shape as
// Canvas's personal-access-token connection - a durable secret the
// customer controls, not a founder-registered OAuth client.
type WildApricotConfig = { accountId?: number };

async function getAccessToken(apiKey: string): Promise<string> {
  const res = await fetch("https://oauth.wildapricot.org/auth/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`APIKEY:${apiKey}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials&scope=auto",
  });
  if (!res.ok) throw new Error(`Wild Apricot rejected this API key (${res.status}). Check it was copied correctly.`);
  const data = await res.json();
  if (typeof data?.access_token !== "string") throw new Error("Wild Apricot didn't return an access token.");
  return data.access_token;
}

export async function connectWildApricot(workspaceId: string, userId: string, apiKeyInput: string): Promise<void> {
  const apiKey = apiKeyInput.trim();
  if (!apiKey) throw new Error("Wild Apricot API key is required.");

  const accessToken = await getAccessToken(apiKey);
  const accountsRes = await fetch("https://api.wildapricot.org/v2.1/accounts", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!accountsRes.ok) throw new Error(`Couldn't read Wild Apricot account details (${accountsRes.status}).`);
  const accounts = await accountsRes.json();
  const accountId = Array.isArray(accounts) ? accounts[0]?.Id : undefined;
  if (typeof accountId !== "number") throw new Error("No Wild Apricot account found for this API key.");

  const config: WildApricotConfig = { accountId };
  await db.integration.upsert({
    where: { workspaceId_provider: { workspaceId, provider: "wildapricot" } },
    update: {
      status: "connected",
      connectedAt: new Date(),
      connectedByUserId: userId,
      accessTokenEncrypted: encryptToken(apiKey),
      scope: "api_key",
      config,
    },
    create: {
      workspaceId,
      provider: "wildapricot",
      status: "connected",
      connectedAt: new Date(),
      connectedByUserId: userId,
      accessTokenEncrypted: encryptToken(apiKey),
      scope: "api_key",
      config,
    },
  });
}

export async function disconnectWildApricot(workspaceId: string): Promise<void> {
  await db.integration.upsert({
    where: { workspaceId_provider: { workspaceId, provider: "wildapricot" } },
    update: { status: "not_connected", connectedAt: null, connectedByUserId: null, accessTokenEncrypted: null, scope: null, config: {} },
    create: { workspaceId, provider: "wildapricot", status: "not_connected" },
  });
}

async function getConnectedWildApricot(workspaceId: string): Promise<{ apiKey: string; accountId: number } | null> {
  const integration = await db.integration.findUnique({ where: { workspaceId_provider: { workspaceId, provider: "wildapricot" } } });
  if (!integration || integration.status !== "connected" || !integration.accessTokenEncrypted) return null;
  const config = (integration.config ?? {}) as WildApricotConfig;
  if (!config.accountId) return null;
  return { apiKey: decryptToken(integration.accessTokenEncrypted), accountId: config.accountId };
}

export interface WildApricotContact {
  id: string;
  displayName: string;
  email: string | null;
  membershipLevel: string | null;
  status: string | null;
}

export async function listWildApricotContacts(workspaceId: string): Promise<WildApricotContact[]> {
  const wa = await getConnectedWildApricot(workspaceId);
  if (!wa) return [];
  const accessToken = await getAccessToken(wa.apiKey);
  const res = await fetch(`https://api.wildapricot.org/v2.1/accounts/${wa.accountId}/contacts?$async=false`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`Wild Apricot contact sync failed (${res.status}).`);
  const data = await res.json();
  const contacts = Array.isArray(data?.Contacts) ? (data.Contacts as Record<string, unknown>[]) : [];
  return contacts.slice(0, 100).map((c) => {
    const membership = c.MembershipLevel && typeof c.MembershipLevel === "object" ? (c.MembershipLevel as Record<string, unknown>) : null;
    const firstName = typeof c.FirstName === "string" ? c.FirstName : "";
    const lastName = typeof c.LastName === "string" ? c.LastName : "";
    return {
      id: String(c.Id ?? ""),
      displayName: typeof c.DisplayName === "string" && c.DisplayName ? c.DisplayName : `${firstName} ${lastName}`.trim() || "Unnamed contact",
      email: typeof c.Email === "string" ? c.Email : null,
      membershipLevel: membership && typeof membership.Name === "string" ? membership.Name : null,
      status: typeof c.Status === "string" ? c.Status : null,
    };
  });
}
