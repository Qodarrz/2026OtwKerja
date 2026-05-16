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

-- CreateIndex
CREATE UNIQUE INDEX "WorkflowTemplate_permitType_key" ON "WorkflowTemplate"("permitType");

-- CreateIndex
CREATE INDEX "WorkflowTemplate_permitType_idx" ON "WorkflowTemplate"("permitType");

-- CreateIndex
CREATE INDEX "WorkflowTemplate_isActive_idx" ON "WorkflowTemplate"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "WorkflowTemplateStage_templateId_stage_key" ON "WorkflowTemplateStage"("templateId", "stage");

-- CreateIndex
CREATE INDEX "WorkflowTemplateStage_templateId_idx" ON "WorkflowTemplateStage"("templateId");

-- AddForeignKey
ALTER TABLE "WorkflowTemplateStage" ADD CONSTRAINT "WorkflowTemplateStage_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "WorkflowTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
