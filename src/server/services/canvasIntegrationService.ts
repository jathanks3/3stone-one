import { db } from "@/server/db";
import { decryptToken, encryptToken } from "@/lib/tokenEncryption";

type CanvasConfig = { baseUrl?: string; userName?: string };

function normalizeBaseUrl(value: string): string {
  const url = new URL(value.trim());
  if (url.protocol !== "https:") throw new Error("Canvas URL must use https://.");
  return url.origin;
}

async function canvasRequest(baseUrl: string, accessToken: string, path: string) {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Canvas rejected the connection (${response.status}). Check the school URL and access token.`);
  return response.json();
}

export async function connectCanvas(workspaceId: string, userId: string, baseUrlInput: string, accessTokenInput: string): Promise<void> {
  const baseUrl = normalizeBaseUrl(baseUrlInput);
  const accessToken = accessTokenInput.trim();
  if (!accessToken) throw new Error("Canvas access token is required.");
  const profile = await canvasRequest(baseUrl, accessToken, "/api/v1/users/self/profile");
  await db.integration.upsert({
    where: { workspaceId_provider: { workspaceId, provider: "canvas" } },
    update: { status: "connected", connectedAt: new Date(), connectedByUserId: userId, accessTokenEncrypted: encryptToken(accessToken), scope: "personal_access_token", config: { baseUrl, userName: profile?.name ?? null } },
    create: { workspaceId, provider: "canvas", status: "connected", connectedAt: new Date(), connectedByUserId: userId, accessTokenEncrypted: encryptToken(accessToken), scope: "personal_access_token", config: { baseUrl, userName: profile?.name ?? null } },
  });
}

export async function disconnectCanvas(workspaceId: string): Promise<void> {
  await db.integration.upsert({
    where: { workspaceId_provider: { workspaceId, provider: "canvas" } },
    update: { status: "not_connected", connectedAt: null, connectedByUserId: null, accessTokenEncrypted: null, scope: null, config: {} },
    create: { workspaceId, provider: "canvas", status: "not_connected" },
  });
}

export interface CanvasAssignment { id: string; title: string; dueAt: string; url?: string }

export async function listCanvasAssignments(workspaceId: string): Promise<CanvasAssignment[]> {
  const integration = await db.integration.findUnique({ where: { workspaceId_provider: { workspaceId, provider: "canvas" } } });
  if (!integration || integration.status !== "connected" || !integration.accessTokenEncrypted) return [];
  const config = (integration.config ?? {}) as CanvasConfig;
  if (!config.baseUrl) return [];
  const token = decryptToken(integration.accessTokenEncrypted);
  const events = await canvasRequest(config.baseUrl, token, "/api/v1/users/self/upcoming_events?per_page=100");
  if (!Array.isArray(events)) return [];
  return events.map((event: Record<string, unknown>) => {
    const assignment = event.assignment && typeof event.assignment === "object" ? event.assignment as Record<string, unknown> : {};
    return {
      id: String(assignment.id ?? event.id ?? ""),
      title: String(assignment.name ?? event.title ?? "Canvas assignment"),
      dueAt: String(assignment.due_at ?? event.start_at ?? ""),
      url: typeof assignment.html_url === "string" ? assignment.html_url : typeof event.html_url === "string" ? event.html_url : undefined,
    };
  }).filter((item: CanvasAssignment) => item.id && item.dueAt);
}
