/*
  Warnings:

  - The values [GENERAL,BOTTLENECK_REPORT] on the enum `FeedbackType` will be removed. If these variants are still used in the database, this will fail.
  - Added the required column `updatedAt` to the `Feedback` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "FeedbackType_new" AS ENUM ('COMPLAINT', 'SUGGESTION', 'APPRECIATION', 'OTHER');
ALTER TABLE "Feedback" ALTER COLUMN "type" DROP DEFAULT;
ALTER TABLE "Feedback" ALTER COLUMN "type" TYPE "FeedbackType_new" USING ("type"::text::"FeedbackType_new");
ALTER TYPE "FeedbackType" RENAME TO "FeedbackType_old";
ALTER TYPE "FeedbackType_new" RENAME TO "FeedbackType";
DROP TYPE "FeedbackType_old";
ALTER TABLE "Feedback" ALTER COLUMN "type" SET DEFAULT 'OTHER';
COMMIT;

-- AlterTable
ALTER TABLE "AuditLog" ADD COLUMN     "hash" TEXT,
ADD COLUMN     "previousHash" TEXT;

-- AlterTable
ALTER TABLE "Feedback" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "type" SET DEFAULT 'OTHER';

-- CreateTable
CREATE TABLE "ApiKey" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "scopes" TEXT[],
    "lastUsedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApiKey_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ApiKey_key_key" ON "ApiKey"("key");

-- CreateIndex
CREATE INDEX "ApiKey_key_idx" ON "ApiKey"("key");

-- CreateIndex
CREATE INDEX "ApiKey_isActive_idx" ON "ApiKey"("isActive");
