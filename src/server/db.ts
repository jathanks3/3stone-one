import { PrismaClient } from "../../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Prisma 7's client generator requires an explicit driver adapter — it no
// longer reads DATABASE_URL implicitly. One shared instance, reused across
// hot-reloads in dev (a fresh PrismaClient per reload would exhaust the
// connection pool), same pattern every Next.js + Prisma app uses.
//
// Lazy on purpose: Next.js evaluates route modules during `next build`'s
// page-data collection, so anything at module scope runs even when no
// route is ever hit. Constructing PrismaClient (and reading DATABASE_URL)
// eagerly here breaks the entire build the moment DATABASE_URL is unset —
// which it is for every route that doesn't touch the database, in every
// environment that doesn't have one configured yet. A Proxy defers actual
// client construction until the first real property access, i.e. the
// first real query, not import time.

declare global {
  var __prisma: PrismaClient | undefined;
}

function createClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set — see prisma.config.ts and docs/16-database-operations.md.");
  }
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}

function getClient(): PrismaClient {
  if (!globalThis.__prisma) {
    globalThis.__prisma = createClient();
  }
  return globalThis.__prisma;
}

export const db = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    return Reflect.get(getClient(), prop, receiver);
  },
});
