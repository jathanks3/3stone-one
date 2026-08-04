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
export interface MondayItem { id: string; name: string; boardId: string; boardName: string; groupName: string | null; status: string | null; dueDate: string | null; assignees: string[] }

export async function listMondayBoards(workspaceId: string): Promise<MondayBoard[]> {
  const data = await mondayQuery<{ boards?: Array<{ id?: string; name?: string; description?: string; workspace?: { name?: string } }> }>(workspaceId, `query { boards(limit: 100) { id name description workspace { name } } }`);
  return (data.boards ?? []).map((board) => ({ id: String(board.id ?? ""), name: board.name ?? "Untitled board", description: board.description || null, workspaceName: board.workspace?.name ?? null })).filter((board) => board.id);
}

export async function listMondayItems(workspaceId: string): Promise<MondayItem[]> {
  const data = await mondayQuery<{ boards?: Array<{ id?: string; name?: string; items_page?: { items?: Array<{ id?: string; name?: string; group?: { title?: string }; column_values?: Array<{ type?: string; text?: string }> }> } }> }>(workspaceId, `query { boards(limit: 50) { id name items_page(limit: 100) { items { id name group { title } column_values { type text } } } } }`);
  const rows: MondayItem[] = [];
  for (const board of data.boards ?? []) {
    for (const item of board.items_page?.items ?? []) {
      const columns = item.column_values ?? [];
      const dateText = columns.find((column) => column.type === "date")?.text?.trim() ?? "";
      const peopleText = columns.filter((column) => column.type === "people").map((column) => column.text?.trim()).filter((value): value is string => Boolean(value));
      const statusText = columns.find((column) => column.type === "status")?.text?.trim() ?? "";
      if (!item.id || !item.name || !board.id) continue;
      rows.push({ id: item.id, name: item.name, boardId: board.id, boardName: board.name ?? "Monday board", groupName: item.group?.title ?? null, status: statusText || null, dueDate: /^\d{4}-\d{2}-\d{2}$/.test(dateText) ? dateText : null, assignees: peopleText });
    }
  }
  return rows;
}

export async function disconnectMonday(workspaceId: string): Promise<void> {
  await db.integration.upsert({ where: { workspaceId_provider: { workspaceId, provider: "monday" } }, update: { status: "not_connected", connectedAt: null, connectedByUserId: null, accessTokenEncrypted: null, refreshTokenEncrypted: null, tokenExpiresAt: null, scope: null, config: {} }, create: { workspaceId, provider: "monday", status: "not_connected" } });
}
