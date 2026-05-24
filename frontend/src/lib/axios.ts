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
      // Clear the local token hint
      if (typeof window !== 'undefined') {
        localStorage.removeItem('user_hint');
        // Clear Next.js cookie
        try {
          await fetch('/api/auth/logout', { method: 'POST' });
        } catch (e) {
          // ignore
        }
        
        // Prevent redirect loop if already on login
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
