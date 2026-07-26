import { Pool } from "pg";

// A second, separate database connection — deliberately not the `db`
// (Prisma/Neon) client used everywhere else in this app. This one reaches
// the REAL Workspace product's own Postgres (Supabase), a completely
// different database owned by a different codebase
// (/Users/jathan/3stone-workspace). Read-only by construction: every
// query in this file is a SELECT, nothing here ever writes to another
// product's database. Reuses the same Supabase project this app's
// Storage integration already connects to (see storageService.ts) — same
// credentials, different purpose.
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
