import "dotenv/config";
import { defineConfig } from "prisma/config";

// Prisma 7 dropped the classic schema.prisma `url` + `directUrl` pair —
// connection URLs now live only here, and only the CLI (migrate, db pull,
// studio) reads this file. The deployed app's runtime PrismaClient never
// touches prisma.config.ts; it gets its connection from the adapter
// constructed explicitly in src/server/db.ts, using DATABASE_URL (pooled).
//
// So the two Neon connection strings split cleanly by *how* they're used,
// not by a schema field: CLI/migrations here use DIRECT_URL (unpooled —
// migrations need session-level features a pgbouncer pooled connection
// doesn't support), the running app uses DATABASE_URL (pooled) in
// src/server/db.ts. Never point this file at the pooled URL.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
  },
});
