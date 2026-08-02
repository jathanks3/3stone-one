import { db } from "@/server/db";
import { encryptToken, decryptToken } from "@/lib/tokenEncryption";

// Request only scopes backed by live product features: calendar plus Outlook
// mailbox reading and sending. Files and Teams remain out until implemented.
const MICROSOFT_SCOPES = [
  "Calendars.ReadWrite",
  "Mail.ReadWrite",
  "Mail.Send",
  "User.Read",
  "offline_access",
  "openid",
  "email",
].join(" ");
const AUTHORITY = "https://login.microsoftonline.com/common/oauth2/v2.0";

function isConfigured(): boolean {
  return Boolean(process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET);
}

function requireConfig(): { clientId: string; clientSecret: string } {
  const clientId = process.env.MICROSOFT_CLIENT_ID;
  const clientSecret = process.env.MICROSOFT_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("MICROSOFT_CLIENT_ID / MICROSOFT_CLIENT_SECRET are not set.");
  }
  return { clientId, clientSecret };
}

export { isConfigured as isMicrosoftIntegrationConfigured };

export async function createMicrosoftAuthState(workspaceId: string, userId: string): Promise<string> {
  const state = await db.oAuthState.create({
    data: { provider: "microsoft", workspaceId, userId, expiresAt: new Date(Date.now() + 10 * 60 * 1000) },
  });
  return state.id;
}

export function buildMicrosoftAuthUrl(state: string, redirectUri: string): string {
  const { clientId } = requireConfig();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: MICROSOFT_SCOPES,
    response_mode: "query",
    state,
  });
  return `${AUTHORITY}/authorize?${params.toString()}`;
}

interface MicrosoftTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope: string;
  token_type: string;
}

async function exchangeCodeForTokens(code: string, redirectUri: string): Promise<MicrosoftTokenResponse> {
  const { clientId, clientSecret } = requireConfig();
  const res = await fetch(`${AUTHORITY}/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
      scope: MICROSOFT_SCOPES,
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Microsoft token exchange failed: ${res.status} ${body}`);
  }
  return res.json();
}

export async function consumeMicrosoftAuthState(state: string): Promise<{ workspaceId: string; userId: string }> {
  const record = await db.oAuthState.findUnique({ where: { id: state } });
  if (!record || record.provider !== "microsoft" || record.usedAt || record.expiresAt < new Date()) {
    throw new Error("This connection request is invalid or has expired. Try connecting again.");
  }
  await db.oAuthState.update({ where: { id: state }, data: { usedAt: new Date() } });
  return { workspaceId: record.workspaceId, userId: record.userId };
}

export async function completeMicrosoftConnection(
  workspaceId: string,
  userId: string,
  code: string,
  redirectUri: string
): Promise<void> {
  const tokens = await exchangeCodeForTokens(code, redirectUri);
  await db.integration.upsert({
    where: { workspaceId_provider: { workspaceId, provider: "microsoft" } },
    update: {
      status: "connected",
      connectedAt: new Date(),
      connectedByUserId: userId,
      accessTokenEncrypted: encryptToken(tokens.access_token),
      ...(tokens.refresh_token ? { refreshTokenEncrypted: encryptToken(tokens.refresh_token) } : {}),
      tokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
      scope: tokens.scope,
    },
    create: {
      workspaceId,
      provider: "microsoft",
      status: "connected",
      connectedAt: new Date(),
      connectedByUserId: userId,
      accessTokenEncrypted: encryptToken(tokens.access_token),
      refreshTokenEncrypted: tokens.refresh_token ? encryptToken(tokens.refresh_token) : null,
      tokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
      scope: tokens.scope,
    },
  });
}

async function refreshAccessToken(refreshTokenPlain: string): Promise<{ accessToken: string; refreshToken: string | null; expiresAt: Date }> {
  const { clientId, clientSecret } = requireConfig();
  const res = await fetch(`${AUTHORITY}/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshTokenPlain,
      grant_type: "refresh_token",
      scope: MICROSOFT_SCOPES,
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Microsoft token refresh failed: ${res.status} ${body}`);
  }
  const data: MicrosoftTokenResponse = await res.json();
  // Microsoft rotates refresh tokens on every use (unlike Google, which
  // keeps issuing against the same one) - the new one must be saved or
  // the next refresh silently breaks with the now-stale token.
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? null,
    expiresAt: new Date(Date.now() + data.expires_in * 1000),
  };
}

export async function getValidMicrosoftAccessToken(workspaceId: string): Promise<string> {
  const integration = await db.integration.findUnique({ where: { workspaceId_provider: { workspaceId, provider: "microsoft" } } });
  if (!integration || integration.status !== "connected" || !integration.accessTokenEncrypted) {
    throw new Error("Microsoft isn't connected for this workspace.");
  }

  const bufferMs = 60_000;
  if (integration.tokenExpiresAt && integration.tokenExpiresAt.getTime() > Date.now() + bufferMs) {
    return decryptToken(integration.accessTokenEncrypted);
  }

  if (!integration.refreshTokenEncrypted) {
    throw new Error("Microsoft connection expired and can't be refreshed - reconnect in Integrations.");
  }
  const { accessToken, refreshToken, expiresAt } = await refreshAccessToken(decryptToken(integration.refreshTokenEncrypted));
  await db.integration.update({
    where: { workspaceId_provider: { workspaceId, provider: "microsoft" } },
    data: {
      accessTokenEncrypted: encryptToken(accessToken),
      tokenExpiresAt: expiresAt,
      ...(refreshToken ? { refreshTokenEncrypted: encryptToken(refreshToken) } : {}),
    },
  });
  return accessToken;
}

// Microsoft Graph has no simple token-revoke endpoint like Google's
// (revocation there happens via the user's own Microsoft account or org
// admin, not an API call we can make) - clearing our stored tokens is
// the real, correct action available here.
export async function disconnectMicrosoft(workspaceId: string): Promise<void> {
  await db.integration.upsert({
    where: { workspaceId_provider: { workspaceId, provider: "microsoft" } },
    update: {
      status: "not_connected",
      connectedAt: null,
      connectedByUserId: null,
      accessTokenEncrypted: null,
      refreshTokenEncrypted: null,
      tokenExpiresAt: null,
      scope: null,
    },
    create: { workspaceId, provider: "microsoft", status: "not_connected" },
  });
}

export interface UpcomingOutlookEvent {
  id: string;
  summary: string;
  start: string;
}

export async function getUpcomingOutlookEvents(workspaceId: string, limit = 5): Promise<UpcomingOutlookEvent[]> {
  const accessToken = await getValidMicrosoftAccessToken(workspaceId);
  const params = new URLSearchParams({
    startDateTime: new Date().toISOString(),
    endDateTime: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    $top: String(limit),
    $orderby: "start/dateTime",
    $select: "id,subject,start",
  });
  const res = await fetch(`https://graph.microsoft.com/v1.0/me/calendarView?${params.toString()}`, {
    headers: { Authorization: `Bearer ${accessToken}`, Prefer: 'outlook.timezone="UTC"' },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Microsoft Graph request failed: ${res.status} ${body}`);
  }
  const data = await res.json();
  const items = Array.isArray(data.value) ? data.value : [];
  return items.slice(0, limit).map((item: { id?: string; subject?: string; start?: { dateTime?: string } }) => ({
    id: item.id ?? "",
    summary: item.subject ?? "(no title)",
    start: item.start?.dateTime ?? "",
  }));
}

// Calendars.ReadWrite is already part of MICROSOFT_SCOPES (Mail features
// need write too), so deleting a synced event is a real, in-scope Graph
// call - unlike Google, currently locked to calendar.readonly.
export async function deleteOutlookEvent(workspaceId: string, eventId: string): Promise<void> {
  const accessToken = await getValidMicrosoftAccessToken(workspaceId);
  const res = await fetch(`https://graph.microsoft.com/v1.0/me/events/${encodeURIComponent(eventId)}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok && res.status !== 404) {
    const body = await res.text().catch(() => "");
    throw new Error(`Microsoft couldn't delete that event: ${res.status} ${body}`);
  }
}

export interface OutlookMessage {
  id: string;
  subject: string;
  senderName: string;
  senderAddress: string;
  receivedAt: string;
  preview: string;
  isRead: boolean;
  webLink: string | null;
}

export async function getRecentOutlookMessages(workspaceId: string, limit = 25): Promise<OutlookMessage[]> {
  const accessToken = await getValidMicrosoftAccessToken(workspaceId);
  const params = new URLSearchParams({
    $top: String(Math.min(Math.max(limit, 1), 50)),
    $orderby: "receivedDateTime desc",
    $select: "id,subject,from,receivedDateTime,bodyPreview,isRead,webLink",
  });
  const res = await fetch(`https://graph.microsoft.com/v1.0/me/mailFolders/inbox/messages?${params.toString()}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Microsoft mailbox request failed: ${res.status} ${body}`);
  }
  const data = await res.json();
  const items = Array.isArray(data.value) ? data.value : [];
  return items.map((item: {
    id?: string;
    subject?: string;
    from?: { emailAddress?: { name?: string; address?: string } };
    receivedDateTime?: string;
    bodyPreview?: string;
    isRead?: boolean;
    webLink?: string;
  }) => ({
    id: item.id ?? "",
    subject: item.subject?.trim() || "(no subject)",
    senderName: item.from?.emailAddress?.name?.trim() || item.from?.emailAddress?.address || "Unknown sender",
    senderAddress: item.from?.emailAddress?.address ?? "",
    receivedAt: item.receivedDateTime ?? "",
    preview: item.bodyPreview?.trim() ?? "",
    isRead: Boolean(item.isRead),
    webLink: item.webLink ?? null,
  })).filter((item: OutlookMessage) => item.id);
}

export async function sendOutlookMail(
  workspaceId: string,
  input: { to: string; subject: string; body: string }
): Promise<void> {
  const to = input.to.trim();
  const subject = input.subject.trim();
  const body = input.body.trim();
  if (!/^\S+@\S+\.\S+$/.test(to)) throw new Error("Enter a valid recipient email address.");
  if (!subject) throw new Error("Enter a subject.");
  if (!body) throw new Error("Enter a message.");
  if (subject.length > 998 || body.length > 100_000) throw new Error("That email is too long.");

  const accessToken = await getValidMicrosoftAccessToken(workspaceId);
  const res = await fetch("https://graph.microsoft.com/v1.0/me/sendMail", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      message: {
        subject,
        body: { contentType: "Text", content: body },
        toRecipients: [{ emailAddress: { address: to } }],
      },
      saveToSentItems: true,
    }),
  });
  if (!res.ok) {
    const responseBody = await res.text().catch(() => "");
    throw new Error(`Microsoft couldn't send the email: ${res.status} ${responseBody}`);
  }
}
