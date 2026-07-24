/*
  Warnings:

  - You are about to drop the `platform_workspace_onboarding_states` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "SalesPipelineStage" AS ENUM ('lead', 'discovery_scheduled', 'proposal_draft', 'proposal_sent', 'negotiation', 'won', 'lost');

-- Note: no DropForeignKey / DropIndex / searchVector ALTER statements here —
-- Prisma's diff engine generated spurious statements against the hand-added
-- generated tsvector column (it doesn't fully understand Unsupported-typed
-- generated columns) and would have dropped the real GIN index built for
-- full-text search. Removed by hand; the DROP TABLE below removes the old
-- table's own foreign key implicitly, and the tsvector column/index are
-- untouched, exactly as intended.

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "emailVerifiedAt" TIMESTAMP(3);

-- DropTable
DROP TABLE "platform_workspace_onboarding_states";

-- CreateTable
CREATE TABLE "platform_email_verification_tokens" (
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "platform_email_verification_tokens_pkey" PRIMARY KEY ("token")
);

-- CreateTable
CREATE TABLE "platform_onboarding_step_definitions" (
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,

    CONSTRAINT "platform_onboarding_step_definitions_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "platform_workspace_onboarding_progress" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "stepKey" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "platform_workspace_onboarding_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform_sales_prospects" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "businessName" TEXT,
    "stage" "SalesPipelineStage" NOT NULL DEFAULT 'lead',
    "convertedWorkspaceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "platform_sales_prospects_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "platform_email_verification_tokens_userId_idx" ON "platform_email_verification_tokens"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "platform_workspace_onboarding_progress_workspaceId_stepKey_key" ON "platform_workspace_onboarding_progress"("workspaceId", "stepKey");

-- AddForeignKey
ALTER TABLE "platform_email_verification_tokens" ADD CONSTRAINT "platform_email_verification_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform_workspace_onboarding_progress" ADD CONSTRAINT "platform_workspace_onboarding_progress_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform_workspace_onboarding_progress" ADD CONSTRAINT "platform_workspace_onboarding_progress_stepKey_fkey" FOREIGN KEY ("stepKey") REFERENCES "platform_onboarding_step_definitions"("key") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform_sales_prospects" ADD CONSTRAINT "platform_sales_prospects_convertedWorkspaceId_fkey" FOREIGN KEY ("convertedWorkspaceId") REFERENCES "workspaces"("id") ON DELETE SET NULL ON UPDATE CASCADE;
