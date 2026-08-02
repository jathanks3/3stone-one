import { db } from "@/server/db";
import { encryptToken, decryptToken } from "@/lib/tokenEncryption";

// Real Google OAuth - the first real third-party integration after
// Integration/ApiKey sat schema-only for a long time. One Google Cloud
// OAuth client covers every 3Stone One edition (they're all the same
// app/domain) - see the founder's own setup notes.
//
// Every requested scope below is backed by a real destination in the
// product: Calendar, Gmail in Communications, Drive in Documents, and
// Sheets exports from Analytics. Gmail/Drive scopes require Google review.
function googleScopesForEdition(editionKey: string): string {
  const identity = ["openid", "email"];
  if (editionKey === "student") return ["https://www.googleapis.com/auth/drive.readonly", ...identity].join(" ");
  if (editionKey === "workspace") return [
    "https://www.googleapis.com/auth/calendar.readonly",
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/gmail.send",
    ...identity,
  ].join(" ");
  return [
    "https://www.googleapis.com/auth/calendar.readonly",
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/gmail.send",
    "https://www.googleapis.com/auth/drive.readonly",
    "https://www.googleapis.com/auth/spreadsheets",
    ...identity,
  ].join(" ");
}

function isConfigured(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

function requireConfig(): { clientId: string; clientSecret: string } {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET are not set.");
  }
  return { clientId, clientSecret };
}

export { isConfigured as isGoogleIntegrationConfigured };

/** The consent-screen URL to send a user to. `state` carries the
 * workspace/user pair through Google's redirect so the callback knows
 * whose tokens these are, signed by being an opaque DB-issued id rather
 * than a raw workspaceId a client could tamper with. */
export async function createGoogleAuthState(workspaceId: string, userId: string): Promise<string> {
  const state = await db.oAuthState.create({
    data: { provider: "google", workspaceId, userId, expiresAt: new Date(Date.now() + 10 * 60 * 1000) },
  });
  return state.id;
}

export function buildGoogleAuthUrl(state: string, redirectUri: string, editionKey = "business"): string {
  const { clientId } = requireConfig();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: googleScopesForEdition(editionKey),
    access_type: "offline",
    prompt: "consent",
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

interface GoogleTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope: string;
  token_type: string;
}

async function exchangeCodeForTokens(code: string, redirectUri: string): Promise<GoogleTokenResponse> {
  const { clientId, clientSecret } = requireConfig();
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Google token exchange failed: ${res.status} ${body}`);
  }
  return res.json();
}

/** Consumes a state token (single-use) - throws if missing/expired/already used. */
export async function consumeGoogleAuthState(state: string): Promise<{ workspaceId: string; userId: string }> {
  const record = await db.oAuthState.findUnique({ where: { id: state } });
  if (!record || record.provider !== "google" || record.usedAt || record.expiresAt < new Date()) {
    throw new Error("This connection request is invalid or has expired. Try connecting again.");
  }
  await db.oAuthState.update({ where: { id: state }, data: { usedAt: new Date() } });
  return { workspaceId: record.workspaceId, userId: record.userId };
}

export async function completeGoogleConnection(
  workspaceId: string,
  userId: string,
  code: string,
  redirectUri: string
): Promise<void> {
  const tokens = await exchangeCodeForTokens(code, redirectUri);
  if (!tokens.refresh_token) {
    // Google only returns a refresh_token on the FIRST consent for a
    // given account - a reconnect without one means we already have a
    // real refresh token stored from before; keep it rather than wiping
    // it out with nothing.
    const existing = await db.integration.findUnique({ where: { workspaceId_provider: { workspaceId, provider: "google" } } });
    if (!existing?.refreshTokenEncrypted) {
      throw new Error(
        "Google didn't return a long-lived connection. Try disconnecting any existing 3Stone One access at myaccount.google.com/permissions, then connect again."
      );
    }
  }

  await db.integration.upsert({
    where: { workspaceId_provider: { workspaceId, provider: "google" } },
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
      provider: "google",
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

async function refreshAccessToken(refreshTokenPlain: string): Promise<{ accessToken: string; expiresAt: Date }> {
  const { clientId, clientSecret } = requireConfig();
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshTokenPlain,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Google token refresh failed: ${res.status} ${body}`);
  }
  const data: GoogleTokenResponse = await res.json();
  return { accessToken: data.access_token, expiresAt: new Date(Date.now() + data.expires_in * 1000) };
}

/** Returns a valid access token for real API calls, refreshing (and
 * persisting the refresh) if the stored one is expired or about to be. */
export async function getValidGoogleAccessToken(workspaceId: string): Promise<string> {
  const integration = await db.integration.findUnique({ where: { workspaceId_provider: { workspaceId, provider: "google" } } });
  if (!integration || integration.status !== "connected" || !integration.accessTokenEncrypted) {
    throw new Error("Google isn't connected for this workspace.");
  }

  const bufferMs = 60_000;
  if (integration.tokenExpiresAt && integration.tokenExpiresAt.getTime() > Date.now() + bufferMs) {
    return decryptToken(integration.accessTokenEncrypted);
  }

  if (!integration.refreshTokenEncrypted) {
    throw new Error("Google connection expired and can't be refreshed - reconnect in Integrations.");
  }
  const { accessToken, expiresAt } = await refreshAccessToken(decryptToken(integration.refreshTokenEncrypted));
  await db.integration.update({
    where: { workspaceId_provider: { workspaceId, provider: "google" } },
    data: { accessTokenEncrypted: encryptToken(accessToken), tokenExpiresAt: expiresAt },
  });
  return accessToken;
}

export async function disconnectGoogle(workspaceId: string): Promise<void> {
  const integration = await db.integration.findUnique({ where: { workspaceId_provider: { workspaceId, provider: "google" } } });
  if (integration?.refreshTokenEncrypted) {
    // Best-effort revoke with Google - a customer disconnecting should
    // actually revoke 3Stone One's access, not just stop using it locally.
    try {
      await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(decryptToken(integration.refreshTokenEncrypted))}`, {
        method: "POST",
      });
    } catch (e) {
      console.error("[googleIntegrationService] revoke failed (continuing to clear local state):", e);
    }
  }
  await db.integration.upsert({
    where: { workspaceId_provider: { workspaceId, provider: "google" } },
    update: {
      status: "not_connected",
      connectedAt: null,
      connectedByUserId: null,
      accessTokenEncrypted: null,
      refreshTokenEncrypted: null,
      tokenExpiresAt: null,
      scope: null,
    },
    create: { workspaceId, provider: "google", status: "not_connected" },
  });
}

export interface UpcomingCalendarEvent {
  summary: string;
  start: string;
}

/** The real "proof it works" call - next few real Calendar events, not a
 * mock. Used on the Integrations page right after connecting. */
export async function getUpcomingGoogleCalendarEvents(workspaceId: string, limit = 5): Promise<UpcomingCalendarEvent[]> {
  const accessToken = await getValidGoogleAccessToken(workspaceId);
  const params = new URLSearchParams({
    timeMin: new Date().toISOString(),
    maxResults: String(limit),
    singleEvents: "true",
    orderBy: "startTime",
  });
  const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?${params.toString()}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Google Calendar request failed: ${res.status} ${body}`);
  }
  const data = await res.json();
  const items = Array.isArray(data.items) ? data.items : [];
  return items.map((item: { summary?: string; start?: { dateTime?: string; date?: string } }) => ({
    summary: item.summary ?? "(no title)",
    start: item.start?.dateTime ?? item.start?.date ?? "",
  }));
}

export interface GmailMessage {
  id: string;
  subject: string;
  from: string;
  receivedAt: string;
  preview: string;
}

function decodeHeader(value: string | undefined): string {
  return value?.trim() || "";
}

export async function getRecentGmailMessages(workspaceId: string, limit = 25): Promise<GmailMessage[]> {
  const accessToken = await getValidGoogleAccessToken(workspaceId);
  const listParams = new URLSearchParams({ maxResults: String(Math.min(Math.max(limit, 1), 50)), labelIds: "INBOX" });
  const listRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages?${listParams.toString()}`, { headers: { Authorization: `Bearer ${accessToken}` }, cache: "no-store" });
  if (!listRes.ok) throw new Error(`Gmail list failed: ${listRes.status} ${await listRes.text().catch(() => "")}`);
  const list = await listRes.json();
  const ids = (Array.isArray(list.messages) ? list.messages : []).map((m: { id?: string }) => m.id).filter(Boolean);
  const messages = await Promise.all(ids.map(async (id: string) => {
    const params = new URLSearchParams({ format: "metadata", metadataHeaders: "Subject" });
    params.append("metadataHeaders", "From");
    params.append("metadataHeaders", "Date");
    const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${encodeURIComponent(id)}?${params.toString()}`, { headers: { Authorization: `Bearer ${accessToken}` }, cache: "no-store" });
    if (!res.ok) return null;
    const data = await res.json();
    const headers = Array.isArray(data.payload?.headers) ? data.payload.headers : [];
    const header = (name: string) => decodeHeader(headers.find((h: { name?: string }) => h.name?.toLowerCase() === name.toLowerCase())?.value);
    return { id, subject: header("Subject") || "(no subject)", from: header("From") || "Unknown sender", receivedAt: header("Date"), preview: data.snippet ?? "" } satisfies GmailMessage;
  }));
  return messages.filter((message): message is GmailMessage => Boolean(message));
}

export async function sendGmail(workspaceId: string, input: { to: string; subject: string; body: string }): Promise<void> {
  const to = input.to.trim();
  const subject = input.subject.trim();
  const body = input.body.trim();
  if (!/^\S+@\S+\.\S+$/.test(to)) throw new Error("Enter a valid recipient email address.");
  if (!subject || !body) throw new Error("Subject and message are required.");
  const rawMessage = [`To: ${to}`, `Subject: ${subject.replace(/[\r\n]/g, " ")}`, "Content-Type: text/plain; charset=utf-8", "", body].join("\r\n");
  const raw = Buffer.from(rawMessage).toString("base64url");
  const accessToken = await getValidGoogleAccessToken(workspaceId);
  const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", { method: "POST", headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" }, body: JSON.stringify({ raw }) });
  if (!res.ok) throw new Error(`Gmail send failed: ${res.status} ${await res.text().catch(() => "")}`);
}

export interface GoogleDriveFile { id: string; name: string; mimeType: string; modifiedAt: string; webViewLink: string; sizeBytes: number }
export async function getRecentGoogleDriveFiles(workspaceId: string, limit = 50): Promise<GoogleDriveFile[]> {
  const accessToken = await getValidGoogleAccessToken(workspaceId);
  const params = new URLSearchParams({ pageSize: String(limit), orderBy: "modifiedTime desc", q: "trashed = false", fields: "files(id,name,mimeType,modifiedTime,webViewLink,size)" });
  const res = await fetch(`https://www.googleapis.com/drive/v3/files?${params.toString()}`, { headers: { Authorization: `Bearer ${accessToken}` }, cache: "no-store" });
  if (!res.ok) throw new Error(`Google Drive request failed: ${res.status} ${await res.text().catch(() => "")}`);
  const data = await res.json();
  return (Array.isArray(data.files) ? data.files : []).map((file: { id?: string; name?: string; mimeType?: string; modifiedTime?: string; webViewLink?: string; size?: string }) => ({ id: file.id ?? "", name: file.name ?? "Untitled", mimeType: file.mimeType ?? "application/octet-stream", modifiedAt: file.modifiedTime ?? "", webViewLink: file.webViewLink ?? "", sizeBytes: Number(file.size ?? 0) })).filter((file: GoogleDriveFile) => file.id && file.webViewLink);
}

export async function createGoogleSpreadsheet(workspaceId: string, title: string, values: (string | number | boolean)[][]): Promise<string> {
  const accessToken = await getValidGoogleAccessToken(workspaceId);
  const createRes = await fetch("https://sheets.googleapis.com/v4/spreadsheets", { method: "POST", headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" }, body: JSON.stringify({ properties: { title } }) });
  if (!createRes.ok) throw new Error(`Google Sheets creation failed: ${createRes.status} ${await createRes.text().catch(() => "")}`);
  const spreadsheet = await createRes.json();
  const id = spreadsheet.spreadsheetId;
  if (!id) throw new Error("Google created a spreadsheet without an ID.");
  const updateRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(id)}/values/A1?valueInputOption=RAW`, { method: "PUT", headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" }, body: JSON.stringify({ range: "A1", majorDimension: "ROWS", values }) });
  if (!updateRes.ok) throw new Error(`Google Sheets update failed: ${updateRes.status} ${await updateRes.text().catch(() => "")}`);
  return spreadsheet.spreadsheetUrl ?? `https://docs.google.com/spreadsheets/d/${id}`;
}
