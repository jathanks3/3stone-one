-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "WorkspacePlan" ADD VALUE 'workspace_starter';
ALTER TYPE "WorkspacePlan" ADD VALUE 'workspace_team';
ALTER TYPE "WorkspacePlan" ADD VALUE 'workspace_pro';
ALTER TYPE "WorkspacePlan" ADD VALUE 'student_starter';
ALTER TYPE "WorkspacePlan" ADD VALUE 'student_plus';
ALTER TYPE "WorkspacePlan" ADD VALUE 'student_premium';

-- AlterTable
ALTER TABLE "platform_subscriptions" ADD COLUMN     "aiAddOnEnabled" BOOLEAN NOT NULL DEFAULT false;

-- Deliberately NOT included: Prisma's diff also proposed dropping
-- search_index_entries_searchVector_idx and the searchVector column's
-- default. That's pre-existing drift on Global Search's tsvector column
-- (Unsupported type - Prisma's introspection there isn't reliable),
-- unrelated to this migration's actual change. Left alone.
