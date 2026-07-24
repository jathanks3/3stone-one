import { PrismaClient } from "../../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Prisma 7's client generator requires an explicit driver adapter — it no
// longer reads DATABASE_URL implicitly. One shared instance, reused across
// hot-reloads in dev (a fresh PrismaClient per reload would exhaust the
// connection pool), same pattern every Next.js + Prisma app uses.

declare global {
  var __prisma: PrismaClient | undefined;
}

function createClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set — see prisma.config.ts and docs/03-database-schema.md.");
  }
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}

export const db = globalThis.__prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.__prisma = db;
}
