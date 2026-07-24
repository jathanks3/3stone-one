-- Note: no DropIndex / ALTER COLUMN searchVector statements here — Prisma's
-- diff engine doesn't understand the hand-added generated tsvector column
-- from 0001_init and proposes spurious drops against it every time.

-- CreateTable
CREATE TABLE "platform_integration_verifications" (
    "serviceKey" TEXT NOT NULL,
    "lastSuccessAt" TIMESTAMP(3),
    "lastErrorAt" TIMESTAMP(3),
    "lastErrorMessage" TEXT,

    CONSTRAINT "platform_integration_verifications_pkey" PRIMARY KEY ("serviceKey")
);
