import { cookies } from "next/headers";

export const SESSION_COOKIE_NAME = "threestone_session";

// Mirrors prisma/schema.prisma's StaffRole enum — kept as a literal union
// here rather than importing from the generated client, since this file
// runs in proxy.ts's Edge middleware, which the Prisma client can't.
export type StaffRole = "founder" | "operations" | "support";
const STAFF_ROLES: readonly StaffRole[] = ["founder", "operations", "support"];

export interface SessionPayload {
  userId: string;
  // Optional: a pure-staff session (someone with only a StaffMembership,
  // no workspace of their own) has nothing meaningful to put here yet —
  // there's no self-serve "create your own workspace" flow in this app.
  workspaceId?: string;
  // Required, never inferred — every session must explicitly say which
  // world it belongs to. The default on any ambiguity is `true` (demo),
  // not `false` (real) — see parseSessionCookie: unknown must never be
  // trusted with real/staff access.
  isDemo: boolean;
  // Orthogonal to workspace membership (docs/15-company-platform-vision.md)
  // — set only for staff with an active StaffMembership, and only ever
  // meaningful when isDemo is false (see parseSessionCookie: a demo
  // session can never carry a staffRole, structurally, even if some other
  // bug tried to attach one). Gates the "3Stone AI" internal section; see
  // proxy.ts and (app)/3stone-ai/layout.tsx for the enforcement layers —
  // this field alone is never sufficient authorization on its own.
  staffRole?: StaffRole;
  // The User.sessionVersion this cookie was issued against. A password
  // change/reset increments the DB value, which makes every
  // previously-issued cookie's embedded number stale — that mismatch is
  // what "session revocation" means for a stateless-cookie session model
  // (there's no server-side session table to delete a row from). Demo
  // sessions never carry a meaningful value here (nothing to revoke).
  sessionVersion: number;
}

// --- Signing --------------------------------------------------------------
//
// The cookie used to be a plain JSON blob: `{"userId":"...","isDemo":false,
// "staffRole":"founder"}`, readable and, worse, WRITABLE by anyone who can
// send an HTTP request with that literal Cookie header — httpOnly only
// blocks browser-side JS from touching it, not a client crafting the
// request directly. That meant full account/staff impersonation for
// anyone who could guess or observe a userId (which are not secret: they
// appear in URLs like /3stone-ai/customers/[workspaceId]). This was found
// and confirmed exploitable during this milestone's own adversarial
// testing (a hand-built cookie granted real founder access, no password).
//
// Fixed by HMAC-signing the payload: the cookie is
// `${base64url(payload)}.${base64url(hmac-sha256(payload))}`, verified with
// Web Crypto's `crypto.subtle.verify` (constant-time internally — no
// hand-rolled comparison to get wrong) before the payload is ever trusted.
// Web Crypto (not `node:crypto`) specifically because this file is shared
// with proxy.ts's Edge middleware, which cannot import Node builtins.
const encoder = new TextEncoder();
const decoder = new TextDecoder();

function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error(
      "SESSION_SECRET is not set. Every environment that creates or verifies sessions needs one " +
        "(a long random string) — see .env.example."
    );
  }
  return secret;
}

async function getHmacKey(): Promise<CryptoKey> {
  return crypto.subtle.importKey("raw", encoder.encode(getSessionSecret()), { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
    "verify",
  ]);
}

function bufferToBase64Url(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlToBytes(b64url: string): Uint8Array {
  const padded = b64url.replace(/-/g, "+").replace(/_/g, "/");
  const withPadding = padded + "=".repeat((4 - (padded.length % 4)) % 4);
  const binary = atob(withPadding);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function signPayload(payloadB64: string): Promise<string> {
  const key = await getHmacKey();
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payloadB64));
  return bufferToBase64Url(signature);
}

async function verifySignature(payloadB64: string, signatureB64: string): Promise<boolean> {
  try {
    const key = await getHmacKey();
    const signatureBytes = base64UrlToBytes(signatureB64);
    return await crypto.subtle.verify("HMAC", key, signatureBytes as BufferSource, encoder.encode(payloadB64) as BufferSource);
  } catch {
    // A malformed signature (bad base64, wrong length) must fail closed,
    // not throw past the caller and crash the request.
    return false;
  }
}

export async function createSession(payload: SessionPayload) {
  const payloadB64 = bufferToBase64Url(encoder.encode(JSON.stringify(payload)).buffer as ArrayBuffer);
  const signature = await signPayload(payloadB64);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, `${payloadB64}.${signature}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

/**
 * The single source of truth for what counts as a valid session cookie —
 * signature-verified and shape-checked, not just present. Pure (no
 * `cookies()`/Node APIs, only Web Crypto) so it can run in proxy.ts's Edge
 * middleware as well as here.
 */
export async function parseSessionCookie(raw: string | undefined | null): Promise<SessionPayload | null> {
  if (!raw) return null;
  const dotIndex = raw.lastIndexOf(".");
  if (dotIndex === -1) return null;
  const payloadB64 = raw.slice(0, dotIndex);
  const signatureB64 = raw.slice(dotIndex + 1);

  const validSignature = await verifySignature(payloadB64, signatureB64);
  if (!validSignature) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(decoder.decode(base64UrlToBytes(payloadB64)));
  } catch {
    return null;
  }
  if (
    typeof parsed !== "object" ||
    parsed === null ||
    typeof (parsed as SessionPayload).userId !== "string" ||
    (parsed as SessionPayload).userId.length === 0
  ) {
    return null;
  }

  const raw2 = parsed as SessionPayload;

  // Demo-ness is never inferred from absence — but if the field is
  // missing or malformed, the only safe default is `true`. Treating an
  // ambiguous session as "real" would be the one bug in this file that
  // could actually let a demo session touch something it shouldn't.
  const isDemo = typeof raw2.isDemo === "boolean" ? raw2.isDemo : true;

  const workspaceId =
    typeof raw2.workspaceId === "string" && raw2.workspaceId.length > 0 ? raw2.workspaceId : undefined;

  // staffRole is a privilege claim, not a required field — if it's present
  // but doesn't parse to one of the three known roles, or the session is
  // demo, drop it rather than reject the whole session. A session must
  // never be invalidated by a malformed claim to a privilege it never
  // had; a staff claim that doesn't check out (or belongs to a demo
  // session) must never be trusted either. Fail closed on the sensitive
  // part, not the whole.
  const staffRole =
    !isDemo && typeof raw2.staffRole === "string" && STAFF_ROLES.includes(raw2.staffRole as StaffRole)
      ? (raw2.staffRole as StaffRole)
      : undefined;

  const sessionVersion = typeof raw2.sessionVersion === "number" ? raw2.sessionVersion : 0;

  return {
    userId: raw2.userId,
    ...(workspaceId ? { workspaceId } : {}),
    isDemo,
    ...(staffRole ? { staffRole } : {}),
    sessionVersion,
  };
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  return parseSessionCookie(cookieStore.get(SESSION_COOKIE_NAME)?.value);
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * True only for a session that is both authenticated as staff AND not a
 * demo session — the one check every layer of the "3Stone AI" section's
 * authorization (middleware, section layout, API, nav) must use. Never
 * check `staffRole` alone; parseSessionCookie already strips staffRole
 * from demo sessions, but this helper exists so every call site reads
 * the same intent instead of re-deriving it.
 */
export function hasStaffAccess(session: SessionPayload | null): session is SessionPayload & { staffRole: StaffRole } {
  return Boolean(session && !session.isDemo && session.staffRole);
}
