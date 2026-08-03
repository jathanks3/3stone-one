-- CreateTable
CREATE TABLE "demo_profiles" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "editionKey" TEXT NOT NULL,
    "orgName" TEXT NOT NULL,
    "industryProfileKey" TEXT NOT NULL,
    "accentColor" TEXT,
    "industryLabel" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "demo_profiles_pkey" PRIMARY KEY ("id")
);
