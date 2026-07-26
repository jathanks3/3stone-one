import { Pool } from "pg";

// A second, separate database connection — deliberately not the `db`
// (Prisma/Neon) client used everywhere else in this app. This one reaches
// the REAL Workspace product's own Postgres (Supabase), a completely
// different database owned by a different codebase
// (/Users/jathan/3stone-workspace). Every query in this file is a SELECT
// except offboardWorkspaceClient below, which is the one deliberate,
// explicit write — and even that never touches a table directly; it
// calls that product's own offboard_client(uuid) Postgres function
// (SECURITY DEFINER), the same dependency-ordered, audited offboarding
// path that product's own admin would use. Reuses the same Supabase
// project this app's Storage integration already connects to (see
// storageService.ts) — same credentials, different purpose.
let _pool: Pool | null = null;

function getPool(): Pool {
  if (!_pool) {
    const url = new URL(process.env.SUPABASE_URL!);
    const projectRef = url.hostname.split(".")[0];
    const password = process.env.SUPABASE_DB_PASSWORD;
    if (!password) {
      throw new Error("SUPABASE_DB_PASSWORD is not set — real Workspace customer data is unavailable until it is.");
    }
    _pool = new Pool({
      connectionString: `postgresql://postgres:${encodeURIComponent(password)}@db.${projectRef}.supabase.co:5432/postgres`,
      ssl: { rejectUnauthorized: false },
      max: 2,
    });
  }
  return _pool;
}

export function isWorkspaceDbConfigured(): boolean {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_DB_PASSWORD);
}

export interface WorkspaceCustomer {
  id: string;
  name: string;
  industry: string | null;
  status: string;
  lifecycleStage: string | null;
  createdAt: Date;
  activatedAt: Date | null;
}

// Only non-sensitive summary fields — deliberately excludes
// billing_email, billing_contact_name, phone, website, internal_notes,
// and settings (jsonb), none of which a customer-list view needs.
export async function listWorkspaceCustomers(): Promise<WorkspaceCustomer[]> {
  const pool = getPool();
  const result = await pool.query<{
    id: string;
    name: string;
    industry: string | null;
    status: string;
    lifecycle_stage: string | null;
    created_at: Date;
    activated_at: Date | null;
  }>(
    `select id, name, industry, status, lifecycle_stage, created_at, activated_at
     from clients
     order by created_at desc`
  );
  return result.rows.map((r) => ({
    id: r.id,
    name: r.name,
    industry: r.industry,
    status: r.status,
    lifecycleStage: r.lifecycle_stage,
    createdAt: r.created_at,
    activatedAt: r.activated_at,
  }));
}

export interface WorkspaceMetrics {
  revenueCollectedCents: number;
  invoiceCount: number;
  activeProjectCount: number;
  openLeadCount: number;
}

// Real aggregate reads only — no estimates, no projections. Revenue is
// sum(amount) where status='paid', not sum(amount_paid): verified
// against real data first and found amount_paid is 0.00 even on invoices
// with status='paid' in this schema, so it's not the reliable signal it
// looks like. "Open" leads excludes won/lost/archived, same definition
// this app's own salesPipelineService.ts already uses for its own
// (unrelated) sales pipeline.
export async function getWorkspaceMetrics(): Promise<WorkspaceMetrics> {
  const pool = getPool();
  const [revenue, projects, leads] = await Promise.all([
    pool.query<{ total_cents: string | null; invoice_count: string }>(
      `select coalesce(sum(amount), 0) as total_cents, count(*) as invoice_count from invoices where status = 'paid'`
    ),
    pool.query<{ count: string }>(`select count(*) from projects where status not in ('completed', 'cancelled')`),
    pool.query<{ count: string }>(
      `select count(*) from leads where stage not in ('won', 'lost') and archived_at is null`
    ),
  ]);
  return {
    revenueCollectedCents: Math.round(Number(revenue.rows[0]?.total_cents ?? 0) * 100),
    invoiceCount: Number(revenue.rows[0]?.invoice_count ?? 0),
    activeProjectCount: Number(projects.rows[0]?.count ?? 0),
    openLeadCount: Number(leads.rows[0]?.count ?? 0),
  };
}

// Irreversible — calls the real product's own offboard_client(uuid)
// function, which dependency-orders deletes across every table that
// references this client (invoices, documents, messages, projects,
// etc.) before removing the client row itself, and writes its own
// audit_log row on that side too. The caller (the actions.ts file that
// calls this) is responsible for requiring the founder to type the
// client's exact name before this ever runs — there is no undo.
export async function offboardWorkspaceClient(clientId: string): Promise<void> {
  const pool = getPool();
  await pool.query("select offboard_client($1)", [clientId]);
}
