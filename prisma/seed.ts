// Foundational reference data — run once against a real database via
// `npx prisma migrate dev` (which invokes this automatically) or
// `npx prisma db seed`. Nothing here is customer/demo data; it's the fixed
// vocabulary the schema itself depends on (products, editions, lifecycle
// stages, system roles) plus the founder's own staff access.
//
// Safe to re-run: every upsert is keyed so this never duplicates rows.

import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { industryProfileList } from "../src/config/industry-profiles";
import type { Prisma } from "../generated/prisma/client";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL must be set to run the seed script.");
}
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

async function main() {
  // --- Products & editions (docs/15-company-platform-vision.md) ---
  // 3Stone One is real today; every other row here is a placeholder so
  // Phase 3/4 (Bet AI, additional editions) is a feature build, not a
  // schema migration or a first-time data-entry step.
  await prisma.product.upsert({
    where: { key: "3stone_one" },
    update: {},
    create: { key: "3stone_one", name: "3Stone One" },
  });
  await prisma.product.upsert({
    where: { key: "bet_ai" },
    update: {},
    create: { key: "bet_ai", name: "Bet AI" },
  });

  const editions: { key: string; productKey: string; name: string }[] = [
    { key: "business", productKey: "3stone_one", name: "Business" },
    { key: "student", productKey: "3stone_one", name: "Student" },
    { key: "employee", productKey: "3stone_one", name: "Employee" },
    { key: "healthcare", productKey: "3stone_one", name: "Healthcare" },
    { key: "nonprofit", productKey: "3stone_one", name: "Nonprofit" },
    { key: "standard", productKey: "bet_ai", name: "Standard" },
  ];
  for (const edition of editions) {
    await prisma.edition.upsert({
      where: { key: edition.key },
      update: {},
      create: edition,
    });
  }

  // --- Customer lifecycle stages (docs/15) — data, not an enum, so adding
  // a stage later never requires a migration. ---
  const lifecycleStages: { key: string; label: string; sortOrder: number; isTerminal: boolean }[] = [
    { key: "lead", label: "Lead", sortOrder: 0, isTerminal: false },
    { key: "demo_scheduled", label: "Demo Scheduled", sortOrder: 1, isTerminal: false },
    { key: "trial", label: "Trial", sortOrder: 2, isTerminal: false },
    { key: "active", label: "Active", sortOrder: 3, isTerminal: false },
    { key: "power_user", label: "Power User", sortOrder: 4, isTerminal: false },
    { key: "at_risk", label: "At Risk", sortOrder: 5, isTerminal: false },
    { key: "cancelled", label: "Cancelled", sortOrder: 6, isTerminal: true },
    { key: "former_customer", label: "Former Customer", sortOrder: 7, isTerminal: true },
  ];
  for (const stage of lifecycleStages) {
    await prisma.customerLifecycleStage.upsert({
      where: { key: stage.key },
      update: { label: stage.label, sortOrder: stage.sortOrder, isTerminal: stage.isTerminal },
      create: stage,
    });
  }

  // --- Industry profiles — real, sourced from the app's own existing
  // src/config/industry-profiles/*.ts, not invented. Workspace.industryProfileKey
  // has a real foreign-key constraint against this table (caught by
  // actually trying to onboard a workspace before this existed — the
  // schema correctly refused to let a workspace reference a
  // non-existent industry). moduleVisibility/customFieldSchemas/
  // pipelineStages are genuinely empty JSON, not fabricated — nothing in
  // the app reads them yet (industry behavior beyond terminology is a
  // later conversion, see docs/13-self-critique.md #1), so an empty
  // object is the truthful state, not a placeholder pretending to be more. ---
  for (const profile of industryProfileList) {
    await prisma.industryProfile.upsert({
      where: { key: profile.key },
      update: { label: profile.label, terminologyMap: profile.terms as unknown as Prisma.InputJsonValue },
      create: {
        key: profile.key,
        label: profile.label,
        terminologyMap: profile.terms as unknown as Prisma.InputJsonValue,
        moduleVisibility: {},
        customFieldSchemas: {},
        pipelineStages: [],
      },
    });
  }

  // --- System workspace roles (docs/05-roles-and-permissions.md) — five
  // roles, Owner/Admin kept distinct per the founder's explicit decision. ---
  const systemRoles = ["Owner", "Admin", "Manager", "Member", "Client"];
  for (const name of systemRoles) {
    const existing = await prisma.role.findFirst({ where: { name, workspaceId: null, isSystemRole: true } });
    if (!existing) {
      await prisma.role.create({ data: { name, workspaceId: null, isSystemRole: true } });
    }
  }

  // --- Founder staff access ---
  // FOUNDER_EMAIL must be set in the environment — deliberately not
  // hardcoded into a committed file. Safe to re-run; does nothing if unset.
  const founderEmail = process.env.FOUNDER_EMAIL;
  if (founderEmail) {
    const founder = await prisma.user.upsert({
      where: { email: founderEmail },
      update: {},
      create: { email: founderEmail, name: "Founder" },
    });
    await prisma.staffMembership.upsert({
      where: { userId: founder.id },
      update: { role: "founder", status: "active" },
      create: { userId: founder.id, role: "founder", status: "active" },
    });
    console.log(`Seeded founder StaffMembership for ${founderEmail}`);
  } else {
    console.log("FOUNDER_EMAIL not set — skipping founder StaffMembership seed. Set it and re-run when ready.");
  }

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
