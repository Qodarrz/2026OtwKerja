import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const isAuthEndpoint = error.config?.url?.includes('/auth/profile') || error.config?.url?.includes('/auth/login');
      // Only clear hint and redirect if the 401 is from a core auth check, 
      // preventing infinite loops on RBAC endpoints like /analytics/dashboard
      if (isAuthEndpoint && typeof window !== 'undefined') {
        localStorage.removeItem('user_hint');
        try {
          await fetch('/api/auth/logout', { method: 'POST' });
        } catch (e) {
          // ignore
        }
        
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
