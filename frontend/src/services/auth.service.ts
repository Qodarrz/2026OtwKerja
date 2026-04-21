import api from '@/lib/axios';
import { AuthResponse } from '@/types/auth';

export const authService = {
  async login(email: string, password: string): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/auth/login', { email, password });
    return data;
  },

  async register(email: string, name: string, password: string): Promise<any> { 
    const { data } = await api.post('/auth/register', { email, name, password });
    return data;
  },

  async getProfile(): Promise<any> {
    const { data } = await api.get('/auth/profile');
    return data;
  },

  googleLogin(): void { 
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    window.location.href = `${backendUrl}/auth/google`;
  }
};
