import api from '@/lib/axios';

export interface PermitApplication {
  id: string;
  referenceNumber: string;
  permitType: string;
  status: string;
  currentStage: string;
  totalCost: number | null;
  createdAt: string;
}

export const permitService = {
  async getApplications(params?: any) {
    const { data } = await api.get('/permits/applications', { params });
    return data;
  },

  async getApplicationDetails(id: string) {
    const { data } = await api.get(`/permits/applications/${id}`);
    return data;
  },

  async createApplication(payload: any) {
    const { data } = await api.post('/permits/applications', payload);
    return data;
  },

  async submitApplication(id: string) {
    const { data } = await api.post(`/permits/applications/${id}/submit`);
    return data;
  },

  async calculateTax(id: string) {
    const { data } = await api.post(`/permits/applications/${id}/calculate-tax`);
    return data;
  }
};
