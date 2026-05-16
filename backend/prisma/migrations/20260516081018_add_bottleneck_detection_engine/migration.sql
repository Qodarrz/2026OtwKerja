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
CREATE UNIQUE INDEX "BottleneckThreshold_stage_key" ON "BottleneckThreshold"("stage");

-- CreateIndex
CREATE INDEX "BottleneckThreshold_stage_idx" ON "BottleneckThreshold"("stage");

-- CreateIndex
CREATE INDEX "BottleneckEventArchive_stage_detectedAt_idx" ON "BottleneckEventArchive"("stage", "detectedAt");

-- CreateIndex
CREATE INDEX "BottleneckEventArchive_archivedAt_idx" ON "BottleneckEventArchive"("archivedAt");

-- AddForeignKey
ALTER TABLE "BottleneckRecommendation" ADD CONSTRAINT "BottleneckRecommendation_bottleneckId_fkey" FOREIGN KEY ("bottleneckId") REFERENCES "BottleneckEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BottleneckResolution" ADD CONSTRAINT "BottleneckResolution_bottleneckId_fkey" FOREIGN KEY ("bottleneckId") REFERENCES "BottleneckEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
