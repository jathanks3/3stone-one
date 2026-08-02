-- AlterTable
ALTER TABLE "integrations" ADD COLUMN     "accessTokenEncrypted" TEXT,
ADD COLUMN     "connectedByUserId" TEXT,
ADD COLUMN     "refreshTokenEncrypted" TEXT,
ADD COLUMN     "scope" TEXT,
ADD COLUMN     "tokenExpiresAt" TIMESTAMP(3);
