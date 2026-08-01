-- CreateEnum
CREATE TYPE "LetterGrade" AS ENUM ('a_plus', 'a', 'a_minus', 'b_plus', 'b', 'b_minus', 'c_plus', 'c', 'c_minus', 'd_plus', 'd', 'd_minus', 'f');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('saved', 'applied', 'interviewing', 'offer', 'rejected');

-- CreateEnum
CREATE TYPE "TimeOffType" AS ENUM ('vacation', 'sick', 'personal');

-- CreateEnum
CREATE TYPE "TimeOffStatus" AS ENUM ('pending', 'approved', 'denied');

-- AlterEnum
ALTER TYPE "ApprovalEntityType" ADD VALUE 'time_off_request';

-- Deliberately NOT included: Prisma's diff also proposed dropping
-- search_index_entries_searchVector_idx and the searchVector column's
-- default. That's pre-existing drift on Global Search's tsvector column
-- (Unsupported type - Prisma's introspection there isn't reliable),
-- unrelated to this migration's actual change. Left alone (same call as
-- 20260801034919_add_notes_and_calendar_events and earlier migrations).

-- CreateTable
CREATE TABLE "gpa_courses" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "credits" DOUBLE PRECISION NOT NULL,
    "grade" "LetterGrade" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gpa_courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_applications" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'saved',
    "appliedDate" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "job_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "time_off_requests" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "type" "TimeOffType" NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" "TimeOffStatus" NOT NULL DEFAULT 'pending',
    "notes" TEXT,
    "approvalRequestId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "time_off_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "gpa_courses_workspaceId_studentId_idx" ON "gpa_courses"("workspaceId", "studentId");

-- CreateIndex
CREATE INDEX "job_applications_workspaceId_studentId_idx" ON "job_applications"("workspaceId", "studentId");

-- CreateIndex
CREATE UNIQUE INDEX "time_off_requests_approvalRequestId_key" ON "time_off_requests"("approvalRequestId");

-- CreateIndex
CREATE INDEX "time_off_requests_workspaceId_idx" ON "time_off_requests"("workspaceId");

-- AddForeignKey
ALTER TABLE "gpa_courses" ADD CONSTRAINT "gpa_courses_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gpa_courses" ADD CONSTRAINT "gpa_courses_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_applications" ADD CONSTRAINT "job_applications_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_applications" ADD CONSTRAINT "job_applications_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "time_off_requests" ADD CONSTRAINT "time_off_requests_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "time_off_requests" ADD CONSTRAINT "time_off_requests_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "time_off_requests" ADD CONSTRAINT "time_off_requests_approvalRequestId_fkey" FOREIGN KEY ("approvalRequestId") REFERENCES "approval_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;
