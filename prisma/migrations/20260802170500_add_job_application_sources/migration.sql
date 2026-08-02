ALTER TABLE "job_applications"
ADD COLUMN "source" TEXT NOT NULL DEFAULT 'manual',
ADD COLUMN "sourceUrl" TEXT;
