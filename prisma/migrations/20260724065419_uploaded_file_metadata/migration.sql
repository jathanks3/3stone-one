-- Note: no DropIndex / ALTER COLUMN searchVector statements here — Prisma's
-- diff engine doesn't understand the hand-added generated tsvector column
-- from 0001_init and proposes spurious drops against it every time.

-- CreateEnum
CREATE TYPE "UploadedFileKind" AS ENUM ('avatar', 'logo', 'document');

-- CreateTable
CREATE TABLE "uploaded_files" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "uploadedByUserId" TEXT NOT NULL,
    "kind" "UploadedFileKind" NOT NULL,
    "storagePath" TEXT NOT NULL,
    "originalFilename" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "uploaded_files_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "uploaded_files_storagePath_key" ON "uploaded_files"("storagePath");

-- CreateIndex
CREATE INDEX "uploaded_files_workspaceId_kind_idx" ON "uploaded_files"("workspaceId", "kind");

-- AddForeignKey
ALTER TABLE "uploaded_files" ADD CONSTRAINT "uploaded_files_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "uploaded_files" ADD CONSTRAINT "uploaded_files_uploadedByUserId_fkey" FOREIGN KEY ("uploadedByUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
