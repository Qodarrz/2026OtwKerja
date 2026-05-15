-- CreateIndex
CREATE INDEX "AuditLog_entityType_action_createdAt_idx" ON "AuditLog"("entityType", "action", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_performedBy_createdAt_idx" ON "AuditLog"("performedBy", "createdAt");
