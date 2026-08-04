import { db } from "@/server/db";
import { encryptToken, decryptToken } from "@/lib/tokenEncryption";

const MONDAY_SCOPES = ["me:read", "boards:read", "docs:read", "workspaces:read", "users:read", "account:read", "updates:read", "assets:read"].join(" ");

export function isMondayIntegrationConfigured(): boolean {
  return Boolean(process.env.MONDAY_CLIENT_ID && process.env.MONDAY_CLIENT_SECRET);
}

function requireConfig() {
  const clientId = process.env.MONDAY_CLIENT_ID;
  const clientSecret = process.env.MONDAY_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error("MONDAY_CLIENT_ID / MONDAY_CLIENT_SECRET are not set.");
  return { clientId, clientSecret };
}

export async function createMondayAuthState(workspaceId: string, userId: string): Promise<string> {
  const state = await db.oAuthState.create({ data: { provider: "monday", workspaceId, userId, expiresAt: new Date(Date.now() + 10 * 60 * 1000) } });
  return state.id;
}

export function buildMondayAuthUrl(state: string, redirectUri: string): string {
  const { clientId } = requireConfig();
  return `https://auth.monday.com/oauth2/authorize?${new URLSearchParams({ client_id: clientId, redirect_uri: redirectUri, scope: MONDAY_SCOPES, state }).toString()}`;
}

export async function consumeMondayAuthState(state: string): Promise<{ workspaceId: string; userId: string }> {
  const record = await db.oAuthState.findUnique({ where: { id: state } });
  if (!record || record.provider !== "monday" || record.usedAt || record.expiresAt < new Date()) throw new Error("This Monday connection request is invalid or expired.");
  await db.oAuthState.update({ where: { id: state }, data: { usedAt: new Date() } });
  return { workspaceId: record.workspaceId, userId: record.userId };
}

export async function completeMondayConnection(workspaceId: string, userId: string, code: string, redirectUri: string): Promise<void> {
  const { clientId, clientSecret } = requireConfig();
  const res = await fetch("https://auth.monday.com/oauth2/token", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code, redirect_uri: redirectUri }) });
  const data = await res.json();
  if (!res.ok || !data.access_token) throw new Error(`Monday token exchange failed (${res.status}).`);
  await db.integration.upsert({
    where: { workspaceId_provider: { workspaceId, provider: "monday" } },
    update: { status: "connected", connectedAt: new Date(), connectedByUserId: userId, accessTokenEncrypted: encryptToken(data.access_token), scope: data.scope ?? MONDAY_SCOPES, config: {} },
    create: { workspaceId, provider: "monday", status: "connected", connectedAt: new Date(), connectedByUserId: userId, accessTokenEncrypted: encryptToken(data.access_token), scope: data.scope ?? MONDAY_SCOPES, config: {} },
  });
}

async function mondayQuery<T>(workspaceId: string, query: string): Promise<T> {
  const integration = await db.integration.findUnique({ where: { workspaceId_provider: { workspaceId, provider: "monday" } } });
  if (!integration?.accessTokenEncrypted || integration.status !== "connected") throw new Error("Monday.com isn't connected for this workspace.");
  const res = await fetch("https://api.monday.com/v2", { method: "POST", headers: { Authorization: decryptToken(integration.accessTokenEncrypted), "Content-Type": "application/json", "API-Version": "2026-04" }, body: JSON.stringify({ query }), cache: "no-store" });
  const data = await res.json();
  if (!res.ok || data.errors) throw new Error(`Monday sync failed (${res.status}).`);
  return data.data as T;
}

export interface MondayBoard { id: string; name: string; description: string | null; workspaceName: string | null }

export async function listMondayBoards(workspaceId: string): Promise<MondayBoard[]> {
  const data = await mondayQuery<{ boards?: Array<{ id?: string; name?: string; description?: string; workspace?: { name?: string } }> }>(workspaceId, `query { boards(limit: 100) { id name description workspace { name } } }`);
  return (data.boards ?? []).map((board) => ({ id: String(board.id ?? ""), name: board.name ?? "Untitled board", description: board.description || null, workspaceName: board.workspace?.name ?? null })).filter((board) => board.id);
}

export async function disconnectMonday(workspaceId: string): Promise<void> {
  await db.integration.upsert({ where: { workspaceId_provider: { workspaceId, provider: "monday" } }, update: { status: "not_connected", connectedAt: null, connectedByUserId: null, accessTokenEncrypted: null, refreshTokenEncrypted: null, tokenExpiresAt: null, scope: null, config: {} }, create: { workspaceId, provider: "monday", status: "not_connected" } });
}
