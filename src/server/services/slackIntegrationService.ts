import { db } from "@/server/db";
import { encryptToken, decryptToken } from "@/lib/tokenEncryption";

const SLACK_SCOPES = ["channels:read", "channels:history", "chat:write"].join(",");

export function isSlackIntegrationConfigured(): boolean {
  return Boolean(process.env.SLACK_CLIENT_ID && process.env.SLACK_CLIENT_SECRET);
}

function requireConfig() {
  const clientId = process.env.SLACK_CLIENT_ID;
  const clientSecret = process.env.SLACK_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error("SLACK_CLIENT_ID / SLACK_CLIENT_SECRET are not set.");
  return { clientId, clientSecret };
}

export async function createSlackAuthState(workspaceId: string, userId: string): Promise<string> {
  const state = await db.oAuthState.create({ data: { provider: "slack", workspaceId, userId, expiresAt: new Date(Date.now() + 10 * 60 * 1000) } });
  return state.id;
}

export function buildSlackAuthUrl(state: string, redirectUri: string): string {
  const { clientId } = requireConfig();
  const params = new URLSearchParams({ client_id: clientId, scope: SLACK_SCOPES, redirect_uri: redirectUri, state });
  return `https://slack.com/oauth/v2/authorize?${params.toString()}`;
}

export async function consumeSlackAuthState(state: string): Promise<{ workspaceId: string; userId: string }> {
  const record = await db.oAuthState.findUnique({ where: { id: state } });
  if (!record || record.provider !== "slack" || record.usedAt || record.expiresAt < new Date()) throw new Error("This Slack connection request is invalid or expired.");
  await db.oAuthState.update({ where: { id: state }, data: { usedAt: new Date() } });
  return { workspaceId: record.workspaceId, userId: record.userId };
}

export async function completeSlackConnection(workspaceId: string, userId: string, code: string, redirectUri: string): Promise<void> {
  const { clientId, clientSecret } = requireConfig();
  const res = await fetch("https://slack.com/api/oauth.v2.access", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, code, redirect_uri: redirectUri }),
  });
  const data = await res.json();
  if (!res.ok || !data.ok || !data.access_token) throw new Error(`Slack token exchange failed: ${data.error ?? res.status}`);
  await db.integration.upsert({
    where: { workspaceId_provider: { workspaceId, provider: "slack" } },
    update: { status: "connected", connectedAt: new Date(), connectedByUserId: userId, accessTokenEncrypted: encryptToken(data.access_token), scope: SLACK_SCOPES, config: { teamId: data.team?.id ?? null, teamName: data.team?.name ?? null, botUserId: data.bot_user_id ?? null } },
    create: { workspaceId, provider: "slack", status: "connected", connectedAt: new Date(), connectedByUserId: userId, accessTokenEncrypted: encryptToken(data.access_token), scope: SLACK_SCOPES, config: { teamId: data.team?.id ?? null, teamName: data.team?.name ?? null, botUserId: data.bot_user_id ?? null } },
  });
}

async function token(workspaceId: string): Promise<string> {
  const integration = await db.integration.findUnique({ where: { workspaceId_provider: { workspaceId, provider: "slack" } } });
  if (!integration || integration.status !== "connected" || !integration.accessTokenEncrypted) throw new Error("Slack isn't connected for this workspace.");
  return decryptToken(integration.accessTokenEncrypted);
}

async function slackCall(workspaceId: string, method: string, init?: RequestInit): Promise<Record<string, unknown>> {
  const accessToken = await token(workspaceId);
  const res = await fetch(`https://slack.com/api/${method}`, { ...init, headers: { Authorization: `Bearer ${accessToken}`, ...(init?.headers ?? {}) }, cache: "no-store" });
  const data = await res.json();
  if (!res.ok || !data.ok) {
    if (data.error === "not_in_channel") {
      throw new Error("Invite @3Stone One to that Slack channel, then try again.");
    }
    throw new Error(`Slack request failed: ${data.error ?? res.status}`);
  }
  return data;
}

export interface SlackChannel { id: string; name: string }
export interface SlackMessage { id: string; channelId: string; author: string; body: string; sentAt: string }

export async function listSlackChannels(workspaceId: string): Promise<SlackChannel[]> {
  const data = await slackCall(workspaceId, "conversations.list?types=public_channel&exclude_archived=true&limit=100");
  return (Array.isArray(data.channels) ? data.channels : []).map((c: { id?: string; name?: string }) => ({ id: c.id ?? "", name: c.name ?? "channel" })).filter((c: SlackChannel) => c.id);
}

export async function listSlackMessages(workspaceId: string, channelId: string, limit = 30): Promise<SlackMessage[]> {
  const params = new URLSearchParams({ channel: channelId, limit: String(limit) });
  const data = await slackCall(workspaceId, `conversations.history?${params.toString()}`);
  return (Array.isArray(data.messages) ? data.messages : []).map((m: { ts?: string; user?: string; bot_id?: string; text?: string }) => ({ id: m.ts ?? "", channelId, author: m.user ?? m.bot_id ?? "Slack", body: m.text ?? "", sentAt: m.ts ? new Date(Number(m.ts) * 1000).toISOString() : "" })).filter((m: SlackMessage) => m.id).reverse();
}

export async function sendSlackMessage(workspaceId: string, channelId: string, body: string): Promise<void> {
  const text = body.trim();
  if (!channelId) throw new Error("Choose a Slack channel.");
  if (!text) throw new Error("Enter a message.");
  await slackCall(workspaceId, "chat.postMessage", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ channel: channelId, text }) });
}

export async function disconnectSlack(workspaceId: string): Promise<void> {
  await db.integration.upsert({ where: { workspaceId_provider: { workspaceId, provider: "slack" } }, update: { status: "not_connected", connectedAt: null, connectedByUserId: null, accessTokenEncrypted: null, refreshTokenEncrypted: null, tokenExpiresAt: null, scope: null, config: {} }, create: { workspaceId, provider: "slack", status: "not_connected" } });
}
