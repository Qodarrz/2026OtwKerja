import { WorkflowStage, Role, PermitType } from '@prisma/client';

export interface WorkflowDefinition {
    stages: WorkflowStage[];
    roles: Partial<Record<WorkflowStage, Role[]>>;
    sla: Partial<Record<WorkflowStage, number>>;
}

export const WORKFLOW_CONFIG: Record<PermitType, WorkflowDefinition> = {
    [PermitType.BUILDING_PERMIT]: {
        stages: [
            WorkflowStage.DOCUMENT_CHECK,
            WorkflowStage.FIELD_INSPECTION,
            WorkflowStage.LEGALIZATION,
            WorkflowStage.APPROVED,
        ],
        roles: {
            [WorkflowStage.DOCUMENT_CHECK]: [Role.DOCUMENT_VALIDATOR],
            [WorkflowStage.FIELD_INSPECTION]: [Role.FIELD_INSPECTOR],
            [WorkflowStage.LEGALIZATION]: [Role.LEGALIZER],
        },
        sla: {
            [WorkflowStage.DOCUMENT_CHECK]: 48, // 2 days
            [WorkflowStage.FIELD_INSPECTION]: 72, // 3 days
            [WorkflowStage.LEGALIZATION]: 24, // 1 day
        },
    },
    [PermitType.BUSINESS_LICENSE]: {
        stages: [
            WorkflowStage.DOCUMENT_CHECK,
            WorkflowStage.LEGALIZATION,
            WorkflowStage.APPROVED,
        ],
        roles: {
            [WorkflowStage.DOCUMENT_CHECK]: [Role.DOCUMENT_VALIDATOR],
            [WorkflowStage.LEGALIZATION]: [Role.LEGALIZER],
        },
        sla: {
            [WorkflowStage.DOCUMENT_CHECK]: 24, // 1 day
            [WorkflowStage.LEGALIZATION]: 12, // 12 hours
        },
    },
};
