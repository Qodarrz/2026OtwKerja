-- CreateEnum
CREATE TYPE "SLAStatus" AS ENUM ('ON_TIME', 'WARNING', 'OVERDUE');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'SLA_WARNING';
ALTER TYPE "NotificationType" ADD VALUE 'SLA_OVERDUE';

-- AlterTable
ALTER TABLE "StageHistory" ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "durationHours" INTEGER,
ADD COLUMN     "slaStatus" "SLAStatus";

-- CreateTable
CREATE TABLE "SLARule" (
    "id" TEXT NOT NULL,
    "stage" "WorkflowStage" NOT NULL,
    "maxDurationHours" INTEGER NOT NULL,
    "warningThreshold" DOUBLE PRECISION NOT NULL DEFAULT 0.8,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SLARule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SLARule_stage_key" ON "SLARule"("stage");

-- CreateIndex
CREATE INDEX "SLARule_stage_idx" ON "SLARule"("stage");

-- CreateIndex
CREATE INDEX "StageHistory_slaStatus_idx" ON "StageHistory"("slaStatus");
