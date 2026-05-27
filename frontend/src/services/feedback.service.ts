import api from '@/lib/axios';

export const feedbackService = {
  async getAll(params?: any) {
    const { data } = await api.get('/feedback', { params });
    return data;
  },

  async reply(id: string, response: string) {
    const { data } = await api.post(`/feedback/${id}/reply`, { response });
    return data;
  }
};
