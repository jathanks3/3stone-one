import { db } from "@/server/db";
import { encryptToken, decryptToken } from "@/lib/tokenEncryption";

// Real Google OAuth - the first real third-party integration after
// Integration/ApiKey sat schema-only for a long time. One Google Cloud
// OAuth client covers every 3Stone One edition (they're all the same
// app/domain) - see the founder's own setup notes.
//
// Scope list deliberately requests ONLY Calendar right now, even though
// the Google Cloud project has Gmail/Drive/Sheets APIs enabled too.
// Google requires verification (including a demo video) per *restricted*
// scope (Gmail, broad Drive access) proving it's actually used - we'd
// have been requesting access this app doesn't do anything with yet,
// which Google correctly blocked ("hasn't completed verification").
// Real, honest order: build the Gmail/Drive/Sheets feature first, THEN
// add its scope here and go through verification with a true demo of
// that feature - never request a scope before the feature exists.
const GOOGLE_SCOPES = ["https://www.googleapis.com/auth/calendar.readonly", "openid", "email"].join(" ");

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

export function buildGoogleAuthUrl(state: string, redirectUri: string): string {
  const { clientId } = requireConfig();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: GOOGLE_SCOPES,
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
