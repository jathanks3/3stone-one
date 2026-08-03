import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { db } from "@/server/db";
import type { UploadedFileKind } from "../../../generated/prisma/client";

// Supabase, storage only — deliberately never Supabase Auth or Supabase
// Postgres (see docs/18-architecture-inventory.md's "Conflicts" section:
// Neon + this app's custom auth are the source of truth; Supabase Auth
// only exists in the separate, unmerged client1-production worktree).
// `auth: { persistSession: false }` is not a stylistic default — it's
// what keeps this client from ever touching Supabase's own session
// machinery, even by accident.

// Two buckets, not one: avatars/logos are low-sensitivity, always-visible
// images referenced by a permanent URL stored directly in
// User.avatarUrl/Workspace.logoUrl (same plain-string shape those fields
// already had) — a public bucket serves those with no signing needed and
// no expiry to manage. Documents are the opposite: private bucket, every
// access goes through createSignedDownloadUrl's tenant check below, and
// the signed URL itself expires.
// Internal infra identifiers (never user-facing), deliberately kept
// distinct from "3stone-workspace" — that string is already the name of
// the *other* product's real Vercel project, and reusing it here for a
// bucket in a shared Supabase project would be a confusing collision in
// dashboards/logs later.
const PUBLIC_BUCKET = "3stone-one-public";
const PRIVATE_BUCKET = "3stone-one-private";

function bucketFor(kind: UploadedFileKind): string {
  return kind === "document" ? PRIVATE_BUCKET : PUBLIC_BUCKET;
}

let _supabase: SupabaseClient | null = null;

export function isStorageConfigured(): boolean {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

function getSupabaseClient(): SupabaseClient {
  if (!_supabase) {
    const url = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceRoleKey) {
      throw new Error(
        "SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are not set. File uploads are unavailable until they are — see the Founder Integration Center."
      );
    }
    // Service-role key, server-only — never sent to the browser. Every
    // signed URL this service hands out is scoped to one object path,
    // generated only after this app's own tenant-isolation check below,
    // which is what makes it safe to use the all-access key here at all.
    _supabase = createClient(url, serviceRoleKey, { auth: { persistSession: false } });
  }
  return _supabase;
}

const ensuredBuckets = new Set<string>();
async function ensureBucket(name: string, isPublic: boolean): Promise<void> {
  if (ensuredBuckets.has(name)) return;
  const supabase = getSupabaseClient();
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();
  if (listError) throw listError;
  if (!buckets?.some((b) => b.name === name)) {
    const { error: createError } = await supabase.storage.createBucket(name, { public: isPublic });
    // A concurrent request may have created it a moment earlier — only a
    // real error (not "already exists") should stop the caller.
    if (createError && !/already exists/i.test(createError.message)) throw createError;
  }
  ensuredBuckets.add(name);
}

function buildStoragePath(workspaceId: string, kind: UploadedFileKind, filename: string): string {
  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-100);
  const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  // Tenant isolation starts in the path itself: every object lives under
  // its owning workspace's id, so a signed URL for one workspace's file
  // can never be constructed from another workspace's session context.
  return `${kind}/${workspaceId}/${unique}-${safeName}`;
}

export interface SignedUpload {
  storagePath: string;
  uploadUrl: string;
  token: string;
  bucket: string;
}

// Direct-to-storage upload: the browser PUTs bytes straight to Supabase
// using this signed URL, never through a Next.js server function (which
// would otherwise impose a request-body size limit and burn serverless
// compute on file bytes it doesn't need to touch). recordUpload below is
// called by the client *after* a successful upload, to write the Neon
// metadata row — the one place this app's own tenant/permission checks
// live, since Supabase's own RLS is deliberately not in play here.
export async function createSignedUploadUrl(
  workspaceId: string,
  kind: UploadedFileKind,
  filename: string
): Promise<SignedUpload> {
  const bucket = bucketFor(kind);
  await ensureBucket(bucket, bucket === PUBLIC_BUCKET);
  const supabase = getSupabaseClient();
  const storagePath = buildStoragePath(workspaceId, kind, filename);
  const { data, error } = await supabase.storage.from(bucket).createSignedUploadUrl(storagePath);
  if (error) throw error;
  return { storagePath, uploadUrl: data.signedUrl, token: data.token, bucket };
}

export async function recordUpload(input: {
  workspaceId: string;
  uploadedByUserId: string;
  kind: UploadedFileKind;
  storagePath: string;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
}): Promise<{ id: string; publicUrl: string | null }> {
  const file = await db.uploadedFile.create({ data: input });
  await db.activityLogEntry.create({
    data: {
      workspaceId: input.workspaceId,
      actorId: input.uploadedByUserId,
      action: `uploaded_${input.kind}`,
      entityType: "UploadedFile",
      entityId: file.id,
      metadata: { originalFilename: input.originalFilename, sizeBytes: input.sizeBytes },
    },
  });

  let publicUrl: string | null = null;
  if (input.kind !== "document") {
    const supabase = getSupabaseClient();
    publicUrl = supabase.storage.from(PUBLIC_BUCKET).getPublicUrl(input.storagePath).data.publicUrl;
  }
  return { id: file.id, publicUrl };
}

// The server-side counterpart to createSignedUploadUrl/recordUpload above:
// those two exist to let a browser PUT bytes directly to Supabase without
// routing a file body through this app's own compute. This one is for
// bytes this server already has in memory (an email attachment fetched
// from Gmail/Outlook, not a browser upload) - one call that both puts the
// bytes in Supabase and writes the same UploadedFile row recordUpload
// would, so the rest of the app (createDocument, etc.) never has to know
// which path a given upload came from.
export async function uploadBufferAndRecord(input: {
  workspaceId: string;
  uploadedByUserId: string;
  kind: UploadedFileKind;
  filename: string;
  buffer: Buffer;
  mimeType: string;
}): Promise<{ id: string; publicUrl: string | null }> {
  const bucket = bucketFor(input.kind);
  await ensureBucket(bucket, bucket === PUBLIC_BUCKET);
  const supabase = getSupabaseClient();
  const storagePath = buildStoragePath(input.workspaceId, input.kind, input.filename);
  const { error } = await supabase.storage.from(bucket).upload(storagePath, input.buffer, { contentType: input.mimeType, upsert: false });
  if (error) throw error;
  return recordUpload({
    workspaceId: input.workspaceId,
    uploadedByUserId: input.uploadedByUserId,
    kind: input.kind,
    storagePath,
    originalFilename: input.filename,
    mimeType: input.mimeType,
    sizeBytes: input.buffer.byteLength,
  });
}

// Tenant isolation enforced here, not in Supabase: the file row must
// belong to the workspaceId the caller is authorized for, or this
// throws before ever asking Supabase for a signed URL.
export async function createSignedDownloadUrl(fileId: string, workspaceId: string, expiresInSeconds = 600): Promise<string> {
  const file = await db.uploadedFile.findFirst({ where: { id: fileId, workspaceId } });
  if (!file) throw new Error("File not found.");
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.storage.from(bucketFor(file.kind)).createSignedUrl(file.storagePath, expiresInSeconds);
  if (error) throw error;
  return data.signedUrl;
}

export async function deleteUpload(fileId: string, workspaceId: string, actorUserId: string): Promise<void> {
  const file = await db.uploadedFile.findFirst({ where: { id: fileId, workspaceId } });
  if (!file) throw new Error("File not found.");
  const supabase = getSupabaseClient();
  const { error } = await supabase.storage.from(bucketFor(file.kind)).remove([file.storagePath]);
  if (error) throw error;
  await db.uploadedFile.delete({ where: { id: fileId } });
  await db.activityLogEntry.create({
    data: { workspaceId, actorId: actorUserId, action: `deleted_${file.kind}`, entityType: "UploadedFile", entityId: fileId },
  });
}

export async function listUploads(workspaceId: string, kind?: UploadedFileKind) {
  return db.uploadedFile.findMany({
    where: { workspaceId, ...(kind ? { kind } : {}) },
    orderBy: { createdAt: "desc" },
  });
}

// Founder Integration Center's "Test connection" for Storage.
export async function verifyStorageConnection(): Promise<{ buckets: string[] }> {
  await ensureBucket(PUBLIC_BUCKET, true);
  await ensureBucket(PRIVATE_BUCKET, false);
  return { buckets: [PUBLIC_BUCKET, PRIVATE_BUCKET] };
}
