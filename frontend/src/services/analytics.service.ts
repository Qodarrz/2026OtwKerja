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
};
