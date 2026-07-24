// The founder's *secondary* administrative path — exceptional
// circumstances, imports, enterprise onboarding, or support only. The
// primary way any real customer (Carl included) gets a workspace is the
// self-service signup wizard at /signup; this script exists for the
// cases the onboarding charter explicitly carves out as still needing
// manual founder capability.
//
//   ONBOARD_WORKSPACE_NAME="Carl's Cleats" \
//   ONBOARD_WORKSPACE_SLUG="carls-cleats" \
//   ONBOARD_OWNER_EMAIL="carl@example.com" \
//   ONBOARD_OWNER_NAME="Carl" \
//   ONBOARD_OWNER_PASSWORD="..." \
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
  const ownerPassword = process.env.ONBOARD_OWNER_PASSWORD;
  const industryProfileKey = process.env.ONBOARD_INDUSTRY_KEY as IndustryProfileKey | undefined;

  if (!workspaceName || !slug || !ownerEmail || !ownerName || !ownerPassword || !industryProfileKey) {
    console.error(
      "Usage: ONBOARD_WORKSPACE_NAME=... ONBOARD_WORKSPACE_SLUG=... ONBOARD_OWNER_EMAIL=... " +
        "ONBOARD_OWNER_NAME=... ONBOARD_OWNER_PASSWORD=... ONBOARD_INDUSTRY_KEY=... npx tsx prisma/scripts/onboard-workspace.ts"
    );
    process.exit(1);
  }
  if (ownerPassword.length < 12) {
    console.error("ONBOARD_OWNER_PASSWORD must be at least 12 characters.");
    process.exit(1);
  }

  const result = await onboardWorkspace({ workspaceName, slug, ownerEmail, ownerName, ownerPassword, industryProfileKey });
  console.log(`Onboarded workspace ${result.workspaceId} for ${ownerEmail} (user ${result.ownerUserId}).`);
  console.log("They can log in immediately with the password you just set.");
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
