ALTER TABLE "platform_support_tickets"
  ALTER COLUMN "workspaceId" DROP NOT NULL,
  ADD COLUMN "sourceUrl" TEXT,
  ADD COLUMN "productArea" TEXT;
