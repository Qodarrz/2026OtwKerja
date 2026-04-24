export type SLAStatus = 'on_time' | 'warning' | 'overdue';

export interface SLARule {
  stage: string;
  durationDays: number;
}

export interface ApplicationStage {
  name: string;
  startTime: string; // ISO String
  endTime?: string;
  status: SLAStatus;
  picName?: string;
}

export interface Application {
  id: string;
  userId: string;
  type: string;
  submitDate: string;
  currentStage: string;
  stages: ApplicationStage[];
  status: 'active' | 'completed' | 'rejected';
}

export const SLA_RULES: Record<string, number> = {
  'Submission': 1,
  'Document Verification': 2,
  'Field Validation': 3,
  'Final Approval': 2,
};
