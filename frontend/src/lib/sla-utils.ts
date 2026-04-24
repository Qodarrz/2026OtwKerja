import { SLAStatus, SLA_RULES } from '@/types/erp';

export function calculateSLAStatus(startTime: string, stageName: string): { status: SLAStatus; remainingHours: number } {
  const start = new Date(startTime).getTime();
  const now = new Date().getTime();
  const durationDays = SLA_RULES[stageName] || 1;
  const durationMs = durationDays * 24 * 60 * 60 * 1000;
  
  const elapsed = now - start;
  const remaining = durationMs - elapsed;
  const remainingHours = Math.max(0, remaining / (1000 * 60 * 60));

  if (elapsed > durationMs) {
    return { status: 'overdue', remainingHours: 0 };
  }
  
  // Warning at 80% duration
  if (elapsed > durationMs * 0.8) {
    return { status: 'warning', remainingHours };
  }

  return { status: 'on_time', remainingHours };
}
