// One-time/occasional operator script — sets or changes a real User's
// password. Deliberately not a web UI yet (no email/reset-token
// infrastructure exists): run locally, pointed at whichever DATABASE_URL
// you intend (see docs/16-database-operations.md for which one that is).
//
// The password is never a CLI argument (shell history, process list) —
// read from an environment variable instead, same convention as
// FOUNDER_EMAIL in prisma/seed.ts. Nobody but the person running this
// (typing it into their own shell session) ever sees the plaintext.
//
//   SET_PASSWORD_EMAIL=you@3stoneai.com SET_PASSWORD_VALUE='...' \
//     npx tsx prisma/scripts/set-password.ts

import { config as loadEnv } from "dotenv";
// Same fix as prisma.config.ts: bare `dotenv/config` only loads `.env`,
// but `vercel env pull` writes `.env.local` (Next.js's convention).
loadEnv({ path: ".env" });
loadEnv({ path: ".env.local", override: true });

import { PrismaClient } from "../../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hashPassword } from "../../src/lib/password";

async function main() {
  const email = process.env.SET_PASSWORD_EMAIL;
  const password = process.env.SET_PASSWORD_VALUE;
  if (!email || !password) {
    console.error("Usage: SET_PASSWORD_EMAIL=... SET_PASSWORD_VALUE=... npx tsx prisma/scripts/set-password.ts");
    process.exit(1);
  }
  if (password.length < 12) {
    console.error("Refusing a password under 12 characters.");
    process.exit(1);
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("DATABASE_URL is not set.");
    process.exit(1);
  }
  const db = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

  const user = await db.user.findUnique({ where: { email } });
  if (!user) {
    console.error(`No user found for ${email}. Create the user first (e.g. via prisma db seed for the founder).`);
    process.exit(1);
  }

  const passwordHash = await hashPassword(password);
  await db.user.update({ where: { email }, data: { passwordHash } });
  console.log(`Password set for ${email}.`);
  await db.$disconnect();
}

main();
