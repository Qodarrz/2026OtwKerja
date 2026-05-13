import api from '@/lib/axios';

export const analyticsService = {
  getDashboardMetrics: async () => {
    const { data } = await api.get('/analytics/dashboard');
    return data;
  },

  getBottlenecks: async () => {
    const { data } = await api.get('/analytics/bottlenecks');
    return data;
  },

  getStaffPerformance: async () => {
    const { data } = await api.get('/analytics/staff-performance');
    return data;
  },

  getUserMetrics: async () => {
    const { data } = await api.get('/analytics/user-dashboard');
    return data;
  },
  getAuditLogs: async (limit: number = 10) => {
    const { data } = await api.get('/analytics/audit-logs', { params: { limit } });
    return data;
  },
};
