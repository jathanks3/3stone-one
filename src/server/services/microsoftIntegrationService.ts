import { db } from "@/server/db";
import { encryptToken, decryptToken } from "@/lib/tokenEncryption";

// Request only scopes backed by live product features: Outlook mailbox reading
// and sending, Calendar changes, selected OneDrive files, and Teams meetings.
const FULL_MICROSOFT_SCOPES = [
  "Calendars.ReadWrite",
  // Reading and sending are separate Graph permissions. The app does not edit,
  // move, or delete mailbox messages, so Mail.ReadWrite is unnecessary.
  "Mail.Read",
  "Mail.Send",
  "Files.Read",
  "OnlineMeetings.ReadWrite",
  // Low-impact, no-admin-consent scope - lets calendar events come back
  // expressed in the mailbox's own configured timezone instead of forced
  // UTC (see getUpcomingOutlookEvents), so a wall-clock read of the
  // returned dateTime is actually correct.
  "MailboxSettings.Read",
  "User.Read",
  "offline_access",
  "openid",
  "email",
].join(" ");
function microsoftScopesForEdition(editionKey: string): string {
  // Mail.Read (not the write/send scopes above) is enough for Student's
  // read-through Emails module - same reasoning as Gmail's read-only
  // scope right above in googleIntegrationService.ts.
  if (editionKey === "student") return ["Files.Read", "Mail.Read", "User.Read", "offline_access", "openid", "email"].join(" ");
  return FULL_MICROSOFT_SCOPES;
}
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

export function buildMicrosoftAuthUrl(state: string, redirectUri: string, editionKey = "business"): string {
  const { clientId } = requireConfig();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: microsoftScopesForEdition(editionKey),
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

// Graph always returns event times in UTC unless told otherwise via this
// header - falls back to "UTC" itself if the lookup fails, same
// (correct, just unlocalized) behavior as before this existed.
async function getMailboxTimeZone(accessToken: string): Promise<string> {
  const res = await fetch("https://graph.microsoft.com/v1.0/me/mailboxSettings", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) return "UTC";
  const data = await res.json().catch(() => null);
  return typeof data?.timeZone === "string" && data.timeZone ? data.timeZone : "UTC";
}

export async function getUpcomingOutlookEvents(workspaceId: string, limit = 5): Promise<UpcomingOutlookEvent[]> {
  const accessToken = await getValidMicrosoftAccessToken(workspaceId);
  const timeZone = await getMailboxTimeZone(accessToken);
  const params = new URLSearchParams({
    startDateTime: new Date().toISOString(),
    endDateTime: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    $top: String(limit),
    $orderby: "start/dateTime",
    $select: "id,subject,start",
  });
  const res = await fetch(`https://graph.microsoft.com/v1.0/me/calendarView?${params.toString()}`, {
    headers: { Authorization: `Bearer ${accessToken}`, Prefer: `outlook.timezone="${timeZone}"` },
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

export interface OutlookAttachment {
  id: string;
  name: string;
  contentType: string;
  sizeBytes: number;
  // "link" = a Graph referenceAttachment (a share link to a file living in
  // OneDrive/SharePoint, common in OneDrive's own digest emails) - there's
  // no contentBytes to fetch for these at all, only a URL, so the UI opens
  // it directly instead of offering Preview/Save to Documents.
  kind: "file" | "link";
  url: string | null;
}

// A bare Content-ID GUID (curly braces optional) is what Graph gives an
// embedded image that never had a real filename - never something to
// show a person as if it were a file they attached.
const RAW_ID_NAME_RE = /^\{?[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\}?$/i;

export interface OutlookMessageDetail {
  id: string;
  subject: string;
  senderName: string;
  senderAddress: string;
  receivedAt: string;
  bodyText: string;
  attachments: OutlookAttachment[];
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

/** Full detail (body + attachment list) for one message - heavier than
 * getRecentOutlookMessages above, only ever called for a single message
 * the user opened. */
export async function getOutlookMessageDetail(workspaceId: string, messageId: string): Promise<OutlookMessageDetail> {
  const accessToken = await getValidMicrosoftAccessToken(workspaceId);
  const params = new URLSearchParams({ $select: "id,subject,from,receivedDateTime,body" });
  const [messageRes, attachmentsRes] = await Promise.all([
    fetch(`https://graph.microsoft.com/v1.0/me/messages/${encodeURIComponent(messageId)}?${params.toString()}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    }),
    // No $select here on purpose: Graph's attachments collection is
    // polymorphic (fileAttachment / referenceAttachment / itemAttachment)
    // and the type-specific fields below (@odata.type, sourceUrl) are what
    // tells a referenceAttachment (a link, no bytes to fetch) apart from a
    // real file - restricting $select risks Graph dropping exactly the
    // field this needs.
    fetch(`https://graph.microsoft.com/v1.0/me/messages/${encodeURIComponent(messageId)}/attachments`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    }),
  ]);
  if (!messageRes.ok) throw new Error(`Microsoft message request failed: ${messageRes.status} ${await messageRes.text().catch(() => "")}`);
  const data = await messageRes.json();
  const attachmentsData = attachmentsRes.ok ? await attachmentsRes.json() : { value: [] };
  type RawAttachment = {
    "@odata.type"?: string;
    id?: string;
    name?: string;
    contentType?: string;
    size?: number;
    isInline?: boolean;
    sourceUrl?: string;
  };
  const attachments: OutlookAttachment[] = (Array.isArray(attachmentsData.value) ? (attachmentsData.value as RawAttachment[]) : [])
    // Inline attachments (isInline: true) are the images/logos embedded in
    // the HTML body itself, referenced by Content-ID - not something a
    // person ever meant to attach.
    .filter((a) => !a.isInline)
    // Embedded Outlook items (a forwarded email, a contact card) have no
    // bytes or URL to do anything useful with here.
    .filter((a) => a["@odata.type"] !== "#microsoft.graph.itemAttachment")
    .map((a): OutlookAttachment | null => {
      const isLink = a["@odata.type"] === "#microsoft.graph.referenceAttachment";
      if (isLink) {
        if (!a.sourceUrl) return null;
        return { id: a.id ?? "", name: a.name || "Shared link", contentType: a.contentType ?? "text/uri-list", sizeBytes: a.size ?? 0, kind: "link", url: a.sourceUrl };
      }
      // A real file attachment whose only "name" Graph has is a raw
      // Content-ID GUID isn't a file a person meant to attach either -
      // show it, or exclude it, never a GUID standing in for a filename.
      if (!a.name || RAW_ID_NAME_RE.test(a.name)) return null;
      return { id: a.id ?? "", name: a.name, contentType: a.contentType ?? "application/octet-stream", sizeBytes: a.size ?? 0, kind: "file", url: null };
    })
    .filter((a): a is OutlookAttachment => a !== null && !!a.id);

  const bodyRaw: string = data.body?.content ?? "";
  const bodyText = data.body?.contentType === "html" ? stripHtml(bodyRaw) : bodyRaw;

  return {
    id: messageId,
    subject: data.subject?.trim() || "(no subject)",
    senderName: data.from?.emailAddress?.name?.trim() || data.from?.emailAddress?.address || "Unknown sender",
    senderAddress: data.from?.emailAddress?.address ?? "",
    receivedAt: data.receivedDateTime ?? "",
    bodyText,
    attachments,
  };
}

export async function getOutlookAttachmentBytes(workspaceId: string, messageId: string, attachmentId: string): Promise<Buffer> {
  const accessToken = await getValidMicrosoftAccessToken(workspaceId);
  const res = await fetch(
    `https://graph.microsoft.com/v1.0/me/messages/${encodeURIComponent(messageId)}/attachments/${encodeURIComponent(attachmentId)}?$select=contentBytes`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!res.ok) throw new Error(`Microsoft attachment request failed: ${res.status} ${await res.text().catch(() => "")}`);
  const data = await res.json();
  if (!data.contentBytes) throw new Error("This attachment can't be downloaded (not a file attachment).");
  return Buffer.from(data.contentBytes, "base64");
}

export interface OneDriveFile {
  id: string;
  name: string;
  sizeBytes: number;
  mimeType: string;
  modifiedAt: string;
  webUrl: string;
}

export async function getRecentOneDriveFiles(workspaceId: string, limit = 50): Promise<OneDriveFile[]> {
  const accessToken = await getValidMicrosoftAccessToken(workspaceId);
  const params = new URLSearchParams({
    $top: String(Math.min(Math.max(limit, 1), 100)),
    $orderby: "lastModifiedDateTime desc",
    $select: "id,name,size,file,lastModifiedDateTime,webUrl",
  });
  const res = await fetch(`https://graph.microsoft.com/v1.0/me/drive/root/children?${params.toString()}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Microsoft OneDrive request failed: ${res.status} ${body}`);
  }
  const data = await res.json();
  return (Array.isArray(data.value) ? data.value : [])
    .filter((item: { file?: unknown }) => Boolean(item.file))
    .map((item: { id?: string; name?: string; size?: number; file?: { mimeType?: string }; lastModifiedDateTime?: string; webUrl?: string }) => ({
      id: item.id ?? "",
      name: item.name?.trim() || "Untitled file",
      sizeBytes: item.size ?? 0,
      mimeType: item.file?.mimeType ?? "application/octet-stream",
      modifiedAt: item.lastModifiedDateTime ?? "",
      webUrl: item.webUrl ?? "",
    }))
    .filter((item: OneDriveFile) => item.id && item.webUrl);
}

/** Graph's embeddable-preview action (POST /drive/items/{id}/preview) -
 * returns a short-lived iframe-able URL so a OneDrive file can be viewed
 * inside 3Stone One itself instead of only ever opening a new tab. Unlike
 * Google Drive's plain `/preview` URL pattern, this genuinely requires a
 * server-side call with our access token - there's no equivalent public
 * URL scheme to build client-side. */
export async function getOneDrivePreviewUrl(workspaceId: string, itemId: string): Promise<string> {
  const accessToken = await getValidMicrosoftAccessToken(workspaceId);
  const res = await fetch(`https://graph.microsoft.com/v1.0/me/drive/items/${encodeURIComponent(itemId)}/preview`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  if (!res.ok) throw new Error(`Microsoft couldn't generate a preview: ${res.status} ${await res.text().catch(() => "")}`);
  const data = await res.json();
  if (!data.getUrl) throw new Error("Microsoft didn't return a preview URL for this file.");
  return String(data.getUrl);
}

export interface TeamsMeetingResult {
  id: string;
  joinUrl: string;
}

export async function createTeamsMeeting(
  workspaceId: string,
  input: { subject: string; startsAt: Date; endsAt: Date }
): Promise<TeamsMeetingResult> {
  const accessToken = await getValidMicrosoftAccessToken(workspaceId);
  const res = await fetch("https://graph.microsoft.com/v1.0/me/onlineMeetings", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      subject: input.subject,
      startDateTime: input.startsAt.toISOString(),
      endDateTime: input.endsAt.toISOString(),
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Microsoft couldn't create the Teams meeting: ${res.status} ${body}`);
  }
  const data = await res.json();
  if (!data.id || !data.joinWebUrl) throw new Error("Microsoft created a meeting without a join link.");
  return { id: String(data.id), joinUrl: String(data.joinWebUrl) };
}
