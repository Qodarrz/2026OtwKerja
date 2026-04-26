import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const analyticsService = {
  getDashboardMetrics: async () => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/analytics/dashboard`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  getBottlenecks: async () => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/analytics/bottlenecks`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  getStaffPerformance: async () => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/analytics/staff-performance`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },
};
