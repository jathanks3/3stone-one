-- Note: no DropIndex / ALTER COLUMN searchVector statements here — Prisma's
-- diff engine doesn't understand the hand-added generated tsvector column
-- from 0001_init and proposes spurious drops against it every time; see
-- 20260724032209_onboarding_and_sales_pipeline's migration.sql for the
-- earlier instance of the same note.

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "notificationPreferences" JSONB;
