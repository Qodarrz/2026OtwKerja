-- CreateEnum
CREATE TYPE "AuthProvider" AS ENUM ('LOCAL', 'GOOGLE');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN', 'DOCUMENT_VALIDATOR', 'FIELD_INSPECTOR', 'LEGALIZER', 'CS');

-- CreateEnum
CREATE TYPE "PermitType" AS ENUM ('BUILDING_PERMIT', 'BUSINESS_LICENSE');

-- CreateEnum
CREATE TYPE "LandType" AS ENUM ('RESIDENTIAL', 'COMMERCIAL', 'INDUSTRIAL', 'AGRICULTURAL');

-- CreateEnum
CREATE TYPE "WorkflowStage" AS ENUM ('DOCUMENT_CHECK', 'FIELD_INSPECTION', 'LEGALIZATION', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ActionType" AS ENUM ('SUBMIT', 'APPROVE', 'REJECT', 'RESUBMIT');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('APPLICATION_SUBMITTED', 'STAGE_ADVANCED', 'APPLICATION_APPROVED', 'APPLICATION_REJECTED', 'SLA_WARNING', 'SLA_OVERDUE', 'SLA_ESCALATION', 'FEEDBACK_RESPONSE');

-- CreateEnum
CREATE TYPE "SLAStatus" AS ENUM ('ON_TIME', 'WARNING', 'OVERDUE');

-- CreateEnum
CREATE TYPE "BottleneckSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "BottleneckStatus" AS ENUM ('ACTIVE', 'RESOLVED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "RecommendationType" AS ENUM ('ADD_STAFF', 'REASSIGN_STAFF', 'ADJUST_SLA', 'OPTIMIZE_PROCESS', 'REDISTRIBUTE_WORKLOAD', 'OTHER');

-- CreateEnum
CREATE TYPE "RecommendationPriority" AS ENUM ('HIGH', 'MEDIUM', 'LOW');

-- CreateEnum
CREATE TYPE "ResolutionActionType" AS ENUM ('STAFF_ADDED', 'STAFF_REASSIGNED', 'SLA_ADJUSTED', 'PROCESS_OPTIMIZED', 'OTHER');

-- CreateEnum
CREATE TYPE "FeedbackType" AS ENUM ('COMPLAINT', 'SUGGESTION', 'APPRECIATION', 'OTHER');

-- CreateEnum
CREATE TYPE "ChatSessionStatus" AS ENUM ('BOT', 'OPEN', 'RESOLVED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "name" TEXT,
    "provider" "AuthProvider" NOT NULL DEFAULT 'LOCAL',
    "providerId" TEXT,
    "roles" "Role"[],
    "verify_gmail" BOOLEAN NOT NULL DEFAULT false,
    "isKtpVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationSetting" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "emailSlaWarning" BOOLEAN NOT NULL DEFAULT true,
    "pushSlaOverdue" BOOLEAN NOT NULL DEFAULT true,
    "emailStatusUpdate" BOOLEAN NOT NULL DEFAULT true,
    "appStatusUpdate" BOOLEAN NOT NULL DEFAULT true,
    "systemAlerts" BOOLEAN NOT NULL DEFAULT true,
    "browserNotifications" BOOLEAN NOT NULL DEFAULT true,
    "focusModeActive" BOOLEAN NOT NULL DEFAULT false,
    "focusModeStart" TEXT NOT NULL DEFAULT '08:00',
    "focusModeEnd" TEXT NOT NULL DEFAULT '17:00',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserDetail" (
    "id" TEXT NOT NULL,
    "phone" TEXT,
    "address" TEXT,
    "avatar" TEXT,
    "nik" TEXT,
    "ktpFullName" TEXT,
    "ktpBirthDate" TIMESTAMP(3),
    "ktpBirthPlace" TEXT,
    "ktpGender" TEXT,
    "ktpAddress" TEXT,
    "ktpImageUrl" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserDetail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OtpVerification" (
    "id" TEXT NOT NULL,
    "otp_code" TEXT NOT NULL,
    "otp_expires_at" TIMESTAMP(3) NOT NULL,
    "otp_attempts" INTEGER NOT NULL DEFAULT 0,
    "last_otp_requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,

    CONSTRAINT "OtpVerification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PermitFormSchema" (
    "id" TEXT NOT NULL,
    "permitType" "PermitType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "fields" JSONB NOT NULL,
    "requiresMap" BOOLEAN NOT NULL DEFAULT false,
    "requiredDocuments" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PermitFormSchema_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PermitApplication" (
    "id" TEXT NOT NULL,
    "referenceNumber" TEXT NOT NULL,
    "permitType" "PermitType" NOT NULL,
    "status" "WorkflowStage" NOT NULL DEFAULT 'DOCUMENT_CHECK',
    "applicantId" TEXT NOT NULL,
    "dynamicData" JSONB,
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
    "currentStage" "WorkflowStage" NOT NULL DEFAULT 'DOCUMENT_CHECK',
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
    "completedAt" TIMESTAMP(3),
    "durationHours" INTEGER,
    "slaStatus" "SLAStatus",

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
    "hash" TEXT,
    "previousHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLogArchive" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "changes" JSONB,
    "performedBy" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLogArchive_pkey" PRIMARY KEY ("id")
);

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

-- CreateTable
CREATE TABLE "WorkflowTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "permitType" "PermitType" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkflowTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowTemplateStage" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "stage" "WorkflowStage" NOT NULL,
    "order" INTEGER NOT NULL,
    "requiredRoles" "Role"[],
    "slaDurationHours" INTEGER NOT NULL DEFAULT 24,
    "slaWarningPercent" DOUBLE PRECISION NOT NULL DEFAULT 0.8,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "WorkflowTemplateStage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BottleneckEvent" (
    "id" TEXT NOT NULL,
    "stage" "WorkflowStage" NOT NULL,
    "score" INTEGER NOT NULL,
    "severity" "BottleneckSeverity" NOT NULL,
    "queueLength" INTEGER NOT NULL,
    "queueWeight" DOUBLE PRECISION NOT NULL,
    "avgProcessingTime" DOUBLE PRECISION NOT NULL,
    "processingWeight" DOUBLE PRECISION NOT NULL,
    "slaViolationRate" DOUBLE PRECISION NOT NULL,
    "slaWeight" DOUBLE PRECISION NOT NULL,
    "staffWorkload" DOUBLE PRECISION NOT NULL,
    "workloadWeight" DOUBLE PRECISION NOT NULL,
    "status" "BottleneckStatus" NOT NULL DEFAULT 'ACTIVE',
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "resolutionDuration" INTEGER,

    CONSTRAINT "BottleneckEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BottleneckRecommendation" (
    "id" TEXT NOT NULL,
    "bottleneckId" TEXT NOT NULL,
    "type" "RecommendationType" NOT NULL,
    "priority" "RecommendationPriority" NOT NULL,
    "description" TEXT NOT NULL,
    "specificMetrics" JSONB NOT NULL,
    "estimatedImpact" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BottleneckRecommendation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BottleneckResolution" (
    "id" TEXT NOT NULL,
    "bottleneckId" TEXT NOT NULL,
    "actionType" "ResolutionActionType" NOT NULL,
    "performedBy" TEXT NOT NULL,
    "performedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "wasEffective" BOOLEAN,
    "evaluatedAt" TIMESTAMP(3),

    CONSTRAINT "BottleneckResolution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BottleneckThreshold" (
    "id" TEXT NOT NULL,
    "stage" "WorkflowStage",
    "queueLengthThreshold" INTEGER NOT NULL DEFAULT 10,
    "processingTimeMultiplier" DOUBLE PRECISION NOT NULL DEFAULT 1.5,
    "slaViolationPercentage" DOUBLE PRECISION NOT NULL DEFAULT 20.0,
    "workloadPerStaff" DOUBLE PRECISION NOT NULL DEFAULT 5.0,
    "bottleneckScoreThreshold" INTEGER NOT NULL DEFAULT 60,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "BottleneckThreshold_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BottleneckEventArchive" (
    "id" TEXT NOT NULL,
    "stage" "WorkflowStage" NOT NULL,
    "score" INTEGER NOT NULL,
    "severity" "BottleneckSeverity" NOT NULL,
    "queueLength" INTEGER NOT NULL,
    "queueWeight" DOUBLE PRECISION NOT NULL,
    "avgProcessingTime" DOUBLE PRECISION NOT NULL,
    "processingWeight" DOUBLE PRECISION NOT NULL,
    "slaViolationRate" DOUBLE PRECISION NOT NULL,
    "slaWeight" DOUBLE PRECISION NOT NULL,
    "staffWorkload" DOUBLE PRECISION NOT NULL,
    "workloadWeight" DOUBLE PRECISION NOT NULL,
    "status" "BottleneckStatus" NOT NULL,
    "detectedAt" TIMESTAMP(3) NOT NULL,
    "resolvedAt" TIMESTAMP(3),
    "resolutionDuration" INTEGER,
    "archivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BottleneckEventArchive_pkey" PRIMARY KEY ("id")
);

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

-- CreateTable
CREATE TABLE "Feedback" (
    "id" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "type" "FeedbackType" NOT NULL DEFAULT 'OTHER',
    "userId" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "response" TEXT,
    "respondedAt" TIMESTAMP(3),
    "respondedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatSession" (
    "id" TEXT NOT NULL,
    "status" "ChatSessionStatus" NOT NULL DEFAULT 'BOT',
    "userId" TEXT NOT NULL,
    "assignedToId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChatSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatMessage" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "senderId" TEXT,
    "senderName" TEXT NOT NULL,
    "senderRole" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationSetting_userId_key" ON "NotificationSetting"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserDetail_userId_key" ON "UserDetail"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "OtpVerification_userId_key" ON "OtpVerification"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_token_key" ON "Session"("token");

-- CreateIndex
CREATE UNIQUE INDEX "PermitFormSchema_permitType_key" ON "PermitFormSchema"("permitType");

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
CREATE INDEX "StageHistory_slaStatus_idx" ON "StageHistory"("slaStatus");

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

-- CreateIndex
CREATE INDEX "AuditLog_entityType_action_createdAt_idx" ON "AuditLog"("entityType", "action", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_performedBy_createdAt_idx" ON "AuditLog"("performedBy", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLogArchive_entityType_entityId_idx" ON "AuditLogArchive"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLogArchive_performedBy_idx" ON "AuditLogArchive"("performedBy");

-- CreateIndex
CREATE INDEX "AuditLogArchive_createdAt_idx" ON "AuditLogArchive"("createdAt");

-- CreateIndex
CREATE INDEX "AuditLogArchive_archivedAt_idx" ON "AuditLogArchive"("archivedAt");

-- CreateIndex
CREATE INDEX "AuditLogArchive_entityType_action_createdAt_idx" ON "AuditLogArchive"("entityType", "action", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLogArchive_performedBy_createdAt_idx" ON "AuditLogArchive"("performedBy", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "SLARule_stage_key" ON "SLARule"("stage");

-- CreateIndex
CREATE INDEX "SLARule_stage_idx" ON "SLARule"("stage");

-- CreateIndex
CREATE UNIQUE INDEX "WorkflowTemplate_permitType_key" ON "WorkflowTemplate"("permitType");

-- CreateIndex
CREATE INDEX "WorkflowTemplate_permitType_idx" ON "WorkflowTemplate"("permitType");

-- CreateIndex
CREATE INDEX "WorkflowTemplate_isActive_idx" ON "WorkflowTemplate"("isActive");

-- CreateIndex
CREATE INDEX "WorkflowTemplateStage_templateId_idx" ON "WorkflowTemplateStage"("templateId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkflowTemplateStage_templateId_stage_key" ON "WorkflowTemplateStage"("templateId", "stage");

-- CreateIndex
CREATE INDEX "BottleneckEvent_stage_detectedAt_idx" ON "BottleneckEvent"("stage", "detectedAt");

-- CreateIndex
CREATE INDEX "BottleneckEvent_status_detectedAt_idx" ON "BottleneckEvent"("status", "detectedAt");

-- CreateIndex
CREATE INDEX "BottleneckEvent_score_idx" ON "BottleneckEvent"("score");

-- CreateIndex
CREATE INDEX "BottleneckRecommendation_bottleneckId_idx" ON "BottleneckRecommendation"("bottleneckId");

-- CreateIndex
CREATE INDEX "BottleneckResolution_bottleneckId_idx" ON "BottleneckResolution"("bottleneckId");

-- CreateIndex
CREATE INDEX "BottleneckResolution_performedBy_idx" ON "BottleneckResolution"("performedBy");

-- CreateIndex
CREATE INDEX "BottleneckThreshold_stage_idx" ON "BottleneckThreshold"("stage");

-- CreateIndex
CREATE UNIQUE INDEX "BottleneckThreshold_stage_key" ON "BottleneckThreshold"("stage");

-- CreateIndex
CREATE INDEX "BottleneckEventArchive_stage_detectedAt_idx" ON "BottleneckEventArchive"("stage", "detectedAt");

-- CreateIndex
CREATE INDEX "BottleneckEventArchive_archivedAt_idx" ON "BottleneckEventArchive"("archivedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ApiKey_key_key" ON "ApiKey"("key");

-- CreateIndex
CREATE INDEX "ApiKey_key_idx" ON "ApiKey"("key");

-- CreateIndex
CREATE INDEX "ApiKey_isActive_idx" ON "ApiKey"("isActive");

-- CreateIndex
CREATE INDEX "Feedback_userId_idx" ON "Feedback"("userId");

-- CreateIndex
CREATE INDEX "Feedback_applicationId_idx" ON "Feedback"("applicationId");

-- CreateIndex
CREATE INDEX "ChatSession_userId_idx" ON "ChatSession"("userId");

-- CreateIndex
CREATE INDEX "ChatSession_assignedToId_idx" ON "ChatSession"("assignedToId");

-- CreateIndex
CREATE INDEX "ChatSession_status_idx" ON "ChatSession"("status");

-- CreateIndex
CREATE INDEX "ChatMessage_sessionId_idx" ON "ChatMessage"("sessionId");

-- AddForeignKey
ALTER TABLE "NotificationSetting" ADD CONSTRAINT "NotificationSetting_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserDetail" ADD CONSTRAINT "UserDetail_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OtpVerification" ADD CONSTRAINT "OtpVerification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

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

-- AddForeignKey
ALTER TABLE "WorkflowTemplateStage" ADD CONSTRAINT "WorkflowTemplateStage_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "WorkflowTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BottleneckRecommendation" ADD CONSTRAINT "BottleneckRecommendation_bottleneckId_fkey" FOREIGN KEY ("bottleneckId") REFERENCES "BottleneckEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BottleneckResolution" ADD CONSTRAINT "BottleneckResolution_bottleneckId_fkey" FOREIGN KEY ("bottleneckId") REFERENCES "BottleneckEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "PermitApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_respondedById_fkey" FOREIGN KEY ("respondedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatSession" ADD CONSTRAINT "ChatSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatSession" ADD CONSTRAINT "ChatSession_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ChatSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
