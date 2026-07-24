import { config as loadEnv } from "dotenv";
import { defineConfig } from "prisma/config";

// Plain `dotenv/config` only auto-loads `.env` — but `vercel env pull`
// (which `vercel integration add` runs automatically after provisioning)
// writes `.env.local`, following Next.js's own convention, not dotenv's.
// Load both explicitly; `.env.local` wins on any overlapping key.
loadEnv({ path: ".env" });
loadEnv({ path: ".env.local", override: true });

// Prisma 7 dropped the classic schema.prisma `url` + `directUrl` pair —
// connection URLs now live only here, and only the CLI (migrate, db pull,
// studio) reads this file. The deployed app's runtime PrismaClient never
// touches prisma.config.ts; it gets its connection from the adapter
// constructed explicitly in src/server/db.ts, using DATABASE_URL (pooled).
//
// So the two Neon connection strings split cleanly by *how* they're used,
// not by a schema field: CLI/migrations here use the unpooled connection
// (migrations need session-level features a pgbouncer pooled connection
// doesn't support), the running app uses DATABASE_URL (pooled) in
// src/server/db.ts. Never point this file at the pooled URL.
//
// Vercel's Neon marketplace integration names the unpooled variable
// DATABASE_URL_UNPOOLED, not DIRECT_URL — this reads DIRECT_URL first in
// case that name is ever set explicitly (e.g. a non-Vercel Postgres),
// falling back to what Neon's integration actually provides.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL,
  },
});
