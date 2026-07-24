-- Note: no DropIndex / ALTER COLUMN searchVector statements here — Prisma's
-- diff engine doesn't understand the hand-added generated tsvector column
-- from 0001_init and proposes spurious drops against it every time; see
-- 20260724032209_onboarding_and_sales_pipeline's migration.sql for the
-- earlier instance of the same note.

-- AlterEnum: WorkspacePlan reconciled with the marketing site's published
-- tiers (free stays as this app's own trial state; pro/enterprise-only
-- replaced with hub/growth/business_os/enterprise).
BEGIN;
CREATE TYPE "WorkspacePlan_new" AS ENUM ('free', 'hub', 'growth', 'business_os', 'enterprise');
ALTER TABLE "public"."platform_subscriptions" ALTER COLUMN "plan" DROP DEFAULT;
ALTER TABLE "public"."workspaces" ALTER COLUMN "plan" DROP DEFAULT;
ALTER TABLE "workspaces" ALTER COLUMN "plan" TYPE "WorkspacePlan_new" USING ("plan"::text::"WorkspacePlan_new");
ALTER TABLE "platform_subscriptions" ALTER COLUMN "plan" TYPE "WorkspacePlan_new" USING ("plan"::text::"WorkspacePlan_new");
ALTER TYPE "WorkspacePlan" RENAME TO "WorkspacePlan_old";
ALTER TYPE "WorkspacePlan_new" RENAME TO "WorkspacePlan";
DROP TYPE "public"."WorkspacePlan_old";
ALTER TABLE "platform_subscriptions" ALTER COLUMN "plan" SET DEFAULT 'free';
ALTER TABLE "workspaces" ALTER COLUMN "plan" SET DEFAULT 'free';
COMMIT;

-- AlterTable
ALTER TABLE "platform_subscriptions" ADD COLUMN     "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "stripePriceId" TEXT;
