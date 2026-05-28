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
            WorkflowStage.ASSESSMENT,
            WorkflowStage.WAITING_FOR_PAYMENT,
            WorkflowStage.LEGALIZATION,
            WorkflowStage.APPROVED,
        ],
        roles: {
            [WorkflowStage.DOCUMENT_CHECK]: [Role.DOCUMENT_VALIDATOR],
            [WorkflowStage.FIELD_INSPECTION]: [Role.FIELD_INSPECTOR],
            [WorkflowStage.ASSESSMENT]: [Role.ADMIN],
            [WorkflowStage.WAITING_FOR_PAYMENT]: [Role.ADMIN],
            [WorkflowStage.LEGALIZATION]: [Role.LEGALIZER],
        },
        sla: {
            [WorkflowStage.DOCUMENT_CHECK]: 48,
            [WorkflowStage.FIELD_INSPECTION]: 72,
            [WorkflowStage.ASSESSMENT]: 24,
            [WorkflowStage.WAITING_FOR_PAYMENT]: 72,
            [WorkflowStage.LEGALIZATION]: 24,
        },
    },
    [PermitType.BUSINESS_LICENSE]: {
        stages: [
            WorkflowStage.DOCUMENT_CHECK,
            WorkflowStage.ASSESSMENT,
            WorkflowStage.WAITING_FOR_PAYMENT,
            WorkflowStage.LEGALIZATION,
            WorkflowStage.APPROVED,
        ],
        roles: {
            [WorkflowStage.DOCUMENT_CHECK]: [Role.DOCUMENT_VALIDATOR],
            [WorkflowStage.ASSESSMENT]: [Role.ADMIN],
            [WorkflowStage.WAITING_FOR_PAYMENT]: [Role.ADMIN],
            [WorkflowStage.LEGALIZATION]: [Role.LEGALIZER],
        },
        sla: {
            [WorkflowStage.DOCUMENT_CHECK]: 24,
            [WorkflowStage.ASSESSMENT]: 24,
            [WorkflowStage.WAITING_FOR_PAYMENT]: 72,
            [WorkflowStage.LEGALIZATION]: 12,
        },
    },
};
