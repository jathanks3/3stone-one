// Today's entry point into workspaceOnboardingService — until a
// self-serve signup form exists, the founder runs this for each new real
// customer, typing their actual details in. The service function itself
// is what matters (it's what a future signup form calls too); this
// script is just today's caller of it.
//
//   ONBOARD_WORKSPACE_NAME="Carl's Cleats" \
//   ONBOARD_WORKSPACE_SLUG="carls-cleats" \
//   ONBOARD_OWNER_EMAIL="carl@example.com" \
//   ONBOARD_OWNER_NAME="Carl" \
//   ONBOARD_INDUSTRY_KEY="clothing_brand" \
//     npx tsx prisma/scripts/onboard-workspace.ts

import { config as loadEnv } from "dotenv";
// Same fix as prisma.config.ts: bare `dotenv/config` only loads `.env`,
// but `vercel env pull` writes `.env.local` (Next.js's convention).
loadEnv({ path: ".env" });
loadEnv({ path: ".env.local", override: true });

import { onboardWorkspace } from "../../src/server/services/workspaceOnboardingService";
import type { IndustryProfileKey } from "../../src/types";

async function main() {
  const workspaceName = process.env.ONBOARD_WORKSPACE_NAME;
  const slug = process.env.ONBOARD_WORKSPACE_SLUG;
  const ownerEmail = process.env.ONBOARD_OWNER_EMAIL;
  const ownerName = process.env.ONBOARD_OWNER_NAME;
  const industryProfileKey = process.env.ONBOARD_INDUSTRY_KEY as IndustryProfileKey | undefined;

  if (!workspaceName || !slug || !ownerEmail || !ownerName || !industryProfileKey) {
    console.error(
      "Usage: ONBOARD_WORKSPACE_NAME=... ONBOARD_WORKSPACE_SLUG=... ONBOARD_OWNER_EMAIL=... " +
        "ONBOARD_OWNER_NAME=... ONBOARD_INDUSTRY_KEY=... npx tsx prisma/scripts/onboard-workspace.ts"
    );
    process.exit(1);
  }

  const result = await onboardWorkspace({ workspaceName, slug, ownerEmail, ownerName, industryProfileKey });
  console.log(`Onboarded workspace ${result.workspaceId} for ${ownerEmail} (user ${result.ownerUserId}).`);
  console.log("Next: set a password for this user (see prisma/scripts/set-password.ts) so they can actually log in.");
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
