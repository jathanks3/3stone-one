import { db } from "@/server/db";
import { encryptToken, decryptToken } from "@/lib/tokenEncryption";

export function isSalesforceIntegrationConfigured(): boolean {
  return Boolean(process.env.SALESFORCE_CLIENT_ID && process.env.SALESFORCE_CLIENT_SECRET);
}

function requireConfig() {
  const clientId = process.env.SALESFORCE_CLIENT_ID;
  const clientSecret = process.env.SALESFORCE_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error("Salesforce OAuth is not configured.");
  return { clientId, clientSecret };
}

export async function createSalesforceAuthState(workspaceId: string, userId: string) {
  return (await db.oAuthState.create({ data: { provider: "salesforce", workspaceId, userId, expiresAt: new Date(Date.now() + 10 * 60 * 1000) } })).id;
}

export function buildSalesforceAuthUrl(state: string, redirectUri: string) {
  const { clientId } = requireConfig();
  return `https://login.salesforce.com/services/oauth2/authorize?${new URLSearchParams({ response_type: "code", client_id: clientId, redirect_uri: redirectUri, state, scope: "api refresh_token" }).toString()}`;
}

export async function consumeSalesforceAuthState(state: string) {
  const record = await db.oAuthState.findUnique({ where: { id: state } });
  if (!record || record.provider !== "salesforce" || record.usedAt || record.expiresAt < new Date()) throw new Error("This Salesforce connection request is invalid or expired.");
  await db.oAuthState.update({ where: { id: state }, data: { usedAt: new Date() } });
  return { workspaceId: record.workspaceId, userId: record.userId };
}

export async function completeSalesforceConnection(workspaceId: string, userId: string, code: string, redirectUri: string) {
  const { clientId, clientSecret } = requireConfig();
  const response = await fetch("https://login.salesforce.com/services/oauth2/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ grant_type: "authorization_code", client_id: clientId, client_secret: clientSecret, redirect_uri: redirectUri, code }) });
  const data = await response.json();
  if (!response.ok || !data.access_token || !data.instance_url) throw new Error(`Salesforce token exchange failed (${response.status}).`);
  await db.integration.upsert({
    where: { workspaceId_provider: { workspaceId, provider: "salesforce" } },
    update: { status: "connected", connectedAt: new Date(), connectedByUserId: userId, accessTokenEncrypted: encryptToken(data.access_token), refreshTokenEncrypted: data.refresh_token ? encryptToken(data.refresh_token) : null, scope: data.scope ?? "api refresh_token", config: { instanceUrl: data.instance_url } },
    create: { workspaceId, provider: "salesforce", status: "connected", connectedAt: new Date(), connectedByUserId: userId, accessTokenEncrypted: encryptToken(data.access_token), refreshTokenEncrypted: data.refresh_token ? encryptToken(data.refresh_token) : null, scope: data.scope ?? "api refresh_token", config: { instanceUrl: data.instance_url } },
  });
}

async function salesforceQuery<T>(workspaceId: string, soql: string): Promise<T[]> {
  const integration = await db.integration.findUnique({ where: { workspaceId_provider: { workspaceId, provider: "salesforce" } } });
  const instanceUrl = (integration?.config as { instanceUrl?: string } | null)?.instanceUrl;
  if (!integration?.accessTokenEncrypted || integration.status !== "connected" || !instanceUrl) throw new Error("Salesforce isn't connected.");
  const query = (accessToken: string, baseUrl = instanceUrl) => fetch(`${baseUrl}/services/data/v65.0/query?${new URLSearchParams({ q: soql })}`, { headers: { Authorization: `Bearer ${accessToken}` }, cache: "no-store" });
  let response = await query(decryptToken(integration.accessTokenEncrypted));

  if (response.status === 401 && integration.refreshTokenEncrypted) {
    const { clientId, clientSecret } = requireConfig();
    const refreshResponse = await fetch("https://login.salesforce.com/services/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ grant_type: "refresh_token", client_id: clientId, client_secret: clientSecret, refresh_token: decryptToken(integration.refreshTokenEncrypted) }),
      cache: "no-store",
    });
    const refreshed = await refreshResponse.json();
    if (!refreshResponse.ok || !refreshed.access_token) throw new Error(`Salesforce session refresh failed (${refreshResponse.status}).`);
    const refreshedInstanceUrl = refreshed.instance_url ?? instanceUrl;
    await db.integration.update({
      where: { id: integration.id },
      data: {
        accessTokenEncrypted: encryptToken(refreshed.access_token),
        refreshTokenEncrypted: refreshed.refresh_token ? encryptToken(refreshed.refresh_token) : integration.refreshTokenEncrypted,
        config: { instanceUrl: refreshedInstanceUrl },
      },
    });
    response = await query(refreshed.access_token, refreshedInstanceUrl);
  }

  const data = await response.json();
  if (!response.ok) throw new Error(`Salesforce sync failed (${response.status}).`);
  return (data.records ?? []) as T[];
}

export interface SalesforceAccount { Id: string; Name: string; Industry?: string | null; Website?: string | null }
export interface SalesforceContact { Id: string; Name: string; Email?: string | null; Phone?: string | null; Account?: { Name?: string } | null }
export interface SalesforceOpportunity { Id: string; Name: string; StageName: string; Amount?: number | null; CloseDate?: string | null; Account?: { Name?: string } | null }
export const listSalesforceAccounts = (workspaceId: string) => salesforceQuery<SalesforceAccount>(workspaceId, "SELECT Id,Name,Industry,Website FROM Account ORDER BY LastModifiedDate DESC LIMIT 100");
export const listSalesforceContacts = (workspaceId: string) => salesforceQuery<SalesforceContact>(workspaceId, "SELECT Id,Name,Email,Phone,Account.Name FROM Contact ORDER BY LastModifiedDate DESC LIMIT 100");
export const listSalesforceOpportunities = (workspaceId: string) => salesforceQuery<SalesforceOpportunity>(workspaceId, "SELECT Id,Name,StageName,Amount,CloseDate,Account.Name FROM Opportunity ORDER BY LastModifiedDate DESC LIMIT 100");

export async function disconnectSalesforce(workspaceId: string) {
  await db.integration.upsert({ where: { workspaceId_provider: { workspaceId, provider: "salesforce" } }, update: { status: "not_connected", connectedAt: null, connectedByUserId: null, accessTokenEncrypted: null, refreshTokenEncrypted: null, tokenExpiresAt: null, scope: null, config: {} }, create: { workspaceId, provider: "salesforce", status: "not_connected" } });
}
