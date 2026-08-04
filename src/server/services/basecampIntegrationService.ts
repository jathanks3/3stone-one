import { db } from "@/server/db";
import { encryptToken, decryptToken } from "@/lib/tokenEncryption";

// Real Basecamp 3 OAuth2 - same shape as googleIntegrationService.ts, but
// genuinely blocked on one thing no code can produce: Basecamp requires a
// real registered OAuth app (a client_id/client_secret pair from
// https://launchpad.37signals.com/integrations), unlike Wild Apricot's
// simple account-level API key. This file is real and ready; connecting
// will fail with "not configured" until BASECAMP_CLIENT_ID/
// BASECAMP_CLIENT_SECRET are set - see docs/15-company-platform-vision.md's
// Phase D notes on this same blocker for other providers.
function isConfigured(): boolean {
  return Boolean(process.env.BASECAMP_CLIENT_ID && process.env.BASECAMP_CLIENT_SECRET);
}

function requireConfig(): { clientId: string; clientSecret: string } {
  const clientId = process.env.BASECAMP_CLIENT_ID;
  const clientSecret = process.env.BASECAMP_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error("BASECAMP_CLIENT_ID / BASECAMP_CLIENT_SECRET are not set.");
  return { clientId, clientSecret };
}

export { isConfigured as isBasecampIntegrationConfigured };

export async function createBasecampAuthState(workspaceId: string, userId: string): Promise<string> {
  const state = await db.oAuthState.create({
    data: { provider: "basecamp", workspaceId, userId, expiresAt: new Date(Date.now() + 10 * 60 * 1000) },
  });
  return state.id;
}

export function buildBasecampAuthUrl(state: string, redirectUri: string): string {
  const { clientId } = requireConfig();
  const params = new URLSearchParams({
    type: "web_server",
    client_id: clientId,
    redirect_uri: redirectUri,
    state,
  });
  return `https://launchpad.37signals.com/authorization/new?${params.toString()}`;
}

interface BasecampTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

async function exchangeCodeForTokens(code: string, redirectUri: string): Promise<BasecampTokenResponse> {
  const { clientId, clientSecret } = requireConfig();
  const params = new URLSearchParams({
    type: "web_server",
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    code,
  });
  const res = await fetch(`https://launchpad.37signals.com/authorization/token?${params.toString()}`, { method: "POST" });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Basecamp token exchange failed: ${res.status} ${body}`);
  }
  return res.json();
}

async function refreshAccessToken(refreshTokenPlain: string): Promise<{ accessToken: string; refreshToken: string | null; expiresAt: Date }> {
  const { clientId, clientSecret } = requireConfig();
  const params = new URLSearchParams({
    type: "refresh",
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshTokenPlain,
  });
  const res = await fetch(`https://launchpad.37signals.com/authorization/token?${params.toString()}`, { method: "POST" });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Basecamp token refresh failed: ${res.status} ${body}`);
  }
  const data: BasecampTokenResponse = await res.json();
  return { accessToken: data.access_token, refreshToken: data.refresh_token ?? null, expiresAt: new Date(Date.now() + data.expires_in * 1000) };
}

/** Consumes a state token (single-use) - throws if missing/expired/already used. */
export async function consumeBasecampAuthState(state: string): Promise<{ workspaceId: string; userId: string }> {
  const record = await db.oAuthState.findUnique({ where: { id: state } });
  if (!record || record.provider !== "basecamp" || record.usedAt || record.expiresAt < new Date()) {
    throw new Error("This connection request is invalid or has expired. Try connecting again.");
  }
  await db.oAuthState.update({ where: { id: state }, data: { usedAt: new Date() } });
  return { workspaceId: record.workspaceId, userId: record.userId };
}

// Basecamp accounts (a person can belong to more than one) come from the
// /authorization.json identity endpoint, not the main API - fetched once
// at connect time and stored, the same way Wild Apricot's accountId is.
async function fetchPrimaryAccountId(accessToken: string): Promise<number> {
  const res = await fetch("https://launchpad.37signals.com/authorization.json", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`Couldn't read Basecamp account details (${res.status}).`);
  const data = await res.json();
  const accounts = Array.isArray(data?.accounts) ? data.accounts : [];
  const bc3 = accounts.find((a: Record<string, unknown>) => a.product === "bc3") ?? accounts[0];
  if (!bc3 || typeof bc3.id !== "number") throw new Error("No Basecamp account found for this connection.");
  return bc3.id;
}

export async function completeBasecampConnection(workspaceId: string, userId: string, code: string, redirectUri: string): Promise<void> {
  const tokens = await exchangeCodeForTokens(code, redirectUri);
  const accountId = await fetchPrimaryAccountId(tokens.access_token);

  await db.integration.upsert({
    where: { workspaceId_provider: { workspaceId, provider: "basecamp" } },
    update: {
      status: "connected",
      connectedAt: new Date(),
      connectedByUserId: userId,
      accessTokenEncrypted: encryptToken(tokens.access_token),
      refreshTokenEncrypted: encryptToken(tokens.refresh_token),
      tokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
      config: { accountId },
    },
    create: {
      workspaceId,
      provider: "basecamp",
      status: "connected",
      connectedAt: new Date(),
      connectedByUserId: userId,
      accessTokenEncrypted: encryptToken(tokens.access_token),
      refreshTokenEncrypted: encryptToken(tokens.refresh_token),
      tokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
      config: { accountId },
    },
  });
}

async function getValidAccessToken(workspaceId: string): Promise<{ accessToken: string; accountId: number } | null> {
  const integration = await db.integration.findUnique({ where: { workspaceId_provider: { workspaceId, provider: "basecamp" } } });
  if (!integration || integration.status !== "connected" || !integration.accessTokenEncrypted) return null;
  const config = (integration.config ?? {}) as { accountId?: number };
  if (!config.accountId) return null;

  const bufferMs = 60_000;
  if (integration.tokenExpiresAt && integration.tokenExpiresAt.getTime() > Date.now() + bufferMs) {
    return { accessToken: decryptToken(integration.accessTokenEncrypted), accountId: config.accountId };
  }
  if (!integration.refreshTokenEncrypted) return null;
  const { accessToken, refreshToken, expiresAt } = await refreshAccessToken(decryptToken(integration.refreshTokenEncrypted));
  await db.integration.update({
    where: { workspaceId_provider: { workspaceId, provider: "basecamp" } },
    data: { accessTokenEncrypted: encryptToken(accessToken), tokenExpiresAt: expiresAt, ...(refreshToken ? { refreshTokenEncrypted: encryptToken(refreshToken) } : {}) },
  });
  return { accessToken, accountId: config.accountId };
}

export async function disconnectBasecamp(workspaceId: string): Promise<void> {
  await db.integration.upsert({
    where: { workspaceId_provider: { workspaceId, provider: "basecamp" } },
    update: { status: "not_connected", connectedAt: null, connectedByUserId: null, accessTokenEncrypted: null, refreshTokenEncrypted: null, tokenExpiresAt: null, config: {} },
    create: { workspaceId, provider: "basecamp", status: "not_connected" },
  });
}

export interface BasecampProject {
  id: string;
  name: string;
  description: string | null;
  url: string;
}

export async function listBasecampProjects(workspaceId: string): Promise<BasecampProject[]> {
  const auth = await getValidAccessToken(workspaceId);
  if (!auth) throw new Error("Basecamp needs to be reconnected.");
  const res = await fetch(`https://3.basecampapi.com/${auth.accountId}/projects.json`, {
    headers: { Authorization: `Bearer ${auth.accessToken}` },
  });
  if (!res.ok) throw new Error(`Basecamp project sync failed (${res.status}).`);
  const projects = await res.json();
  if (!Array.isArray(projects)) return [];
  return projects.map((p: Record<string, unknown>) => ({
    id: String(p.id ?? ""),
    name: typeof p.name === "string" ? p.name : "Untitled project",
    description: typeof p.description === "string" && p.description ? p.description : null,
    url: typeof p.app_url === "string" ? p.app_url : "",
  }));
}
