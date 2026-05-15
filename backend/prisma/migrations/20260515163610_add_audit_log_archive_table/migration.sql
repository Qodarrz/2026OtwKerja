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
