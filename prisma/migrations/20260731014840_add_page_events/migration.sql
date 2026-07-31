-- Deliberately NOT included: Prisma's diff also proposed dropping
-- search_index_entries_searchVector_idx and the searchVector column's
-- default. That's pre-existing drift on Global Search's tsvector column
-- (Unsupported type - Prisma's introspection there isn't reliable),
-- unrelated to this migration's actual change. Left alone (same call as
-- 20260731005530_add_workspace_student_editions).

-- CreateTable
CREATE TABLE "page_events" (
    "id" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "page_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "page_events_occurredAt_idx" ON "page_events"("occurredAt");
