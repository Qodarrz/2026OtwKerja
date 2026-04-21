/*
  Warnings:

  - You are about to drop the column `role` on the `User` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "PermitType" AS ENUM ('BUILDING_PERMIT', 'BUSINESS_LICENSE');

-- CreateEnum
CREATE TYPE "LandType" AS ENUM ('RESIDENTIAL', 'COMMERCIAL', 'INDUSTRIAL', 'AGRICULTURAL');

-- CreateEnum
CREATE TYPE "WorkflowStage" AS ENUM ('DRAFT', 'DOCUMENT_CHECK', 'FIELD_INSPECTION', 'LEGALIZATION', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ActionType" AS ENUM ('SUBMIT', 'APPROVE', 'REJECT', 'RESUBMIT');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('APPLICATION_SUBMITTED', 'STAGE_ADVANCED', 'APPLICATION_APPROVED', 'APPLICATION_REJECTED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Role" ADD VALUE 'DOCUMENT_VALIDATOR';
ALTER TYPE "Role" ADD VALUE 'FIELD_INSPECTOR';
ALTER TYPE "Role" ADD VALUE 'LEGALIZER';

-- AlterTable
ALTER TABLE "User" DROP COLUMN "role",
ADD COLUMN     "roles" "Role"[];

-- CreateTable
CREATE TABLE "PermitApplication" (
    "id" TEXT NOT NULL,
    "referenceNumber" TEXT NOT NULL,
    "permitType" "PermitType" NOT NULL,
    "status" "WorkflowStage" NOT NULL DEFAULT 'DRAFT',
    "applicantId" TEXT NOT NULL,
    "locationAddress" TEXT,
    "landSize" DOUBLE PRECISION,
    "landType" "LandType",
    "buildingHeight" DOUBLE PRECISION,
    "njopValue" DOUBLE PRECISION,
    "isStrategicLocation" BOOLEAN DEFAULT false,
    "businessName" TEXT,
    "businessType" TEXT,
    "businessLocation" TEXT,
    "estimatedEmployees" INTEGER,
    "baseTax" DOUBLE PRECISION,
    "strategicSurcharge" DOUBLE PRECISION,
    "landTypeSurcharge" DOUBLE PRECISION,
    "highRiseSurcharge" DOUBLE PRECISION,
    "administrativeFee" DOUBLE PRECISION,
    "totalCost" DOUBLE PRECISION,
    "currentStage" "WorkflowStage" NOT NULL DEFAULT 'DRAFT',
    "submittedAt" TIMESTAMP(3),
    "lastUpdatedAt" TIMESTAMP(3) NOT NULL,
    "rejectionReason" TEXT,
    "rejectedBy" TEXT,
    "rejectedAt" TIMESTAMP(3),
    "inspectionNotes" TEXT,
    "originalApplicationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PermitApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "originalFilename" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "storagePath" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ValidationAction" (
    "id" TEXT NOT NULL,
    "actionType" "ActionType" NOT NULL,
    "stage" "WorkflowStage" NOT NULL,
    "notes" TEXT,
    "applicationId" TEXT NOT NULL,
    "performedById" TEXT NOT NULL,
    "performedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ValidationAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StageHistory" (
    "id" TEXT NOT NULL,
    "fromStage" "WorkflowStage",
    "toStage" "WorkflowStage" NOT NULL,
    "applicationId" TEXT NOT NULL,
    "transitionedBy" TEXT,
    "transitionedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StageHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT NOT NULL,
    "applicationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "changes" JSONB,
    "performedBy" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PermitApplication_referenceNumber_key" ON "PermitApplication"("referenceNumber");

-- CreateIndex
CREATE INDEX "PermitApplication_applicantId_idx" ON "PermitApplication"("applicantId");

-- CreateIndex
CREATE INDEX "PermitApplication_status_idx" ON "PermitApplication"("status");

-- CreateIndex
CREATE INDEX "PermitApplication_permitType_idx" ON "PermitApplication"("permitType");

-- CreateIndex
CREATE INDEX "PermitApplication_referenceNumber_idx" ON "PermitApplication"("referenceNumber");

-- CreateIndex
CREATE INDEX "Document_applicationId_idx" ON "Document"("applicationId");

-- CreateIndex
CREATE INDEX "ValidationAction_applicationId_idx" ON "ValidationAction"("applicationId");

-- CreateIndex
CREATE INDEX "ValidationAction_performedById_idx" ON "ValidationAction"("performedById");

-- CreateIndex
CREATE INDEX "StageHistory_applicationId_idx" ON "StageHistory"("applicationId");

-- CreateIndex
CREATE INDEX "Notification_userId_isRead_idx" ON "Notification"("userId", "isRead");

-- CreateIndex
CREATE INDEX "Notification_applicationId_idx" ON "Notification"("applicationId");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_performedBy_idx" ON "AuditLog"("performedBy");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- AddForeignKey
ALTER TABLE "PermitApplication" ADD CONSTRAINT "PermitApplication_applicantId_fkey" FOREIGN KEY ("applicantId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PermitApplication" ADD CONSTRAINT "PermitApplication_originalApplicationId_fkey" FOREIGN KEY ("originalApplicationId") REFERENCES "PermitApplication"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "PermitApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ValidationAction" ADD CONSTRAINT "ValidationAction_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "PermitApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ValidationAction" ADD CONSTRAINT "ValidationAction_performedById_fkey" FOREIGN KEY ("performedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StageHistory" ADD CONSTRAINT "StageHistory_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "PermitApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "PermitApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;
