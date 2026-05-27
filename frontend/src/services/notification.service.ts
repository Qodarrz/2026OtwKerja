import api from '@/lib/axios';

export const notificationService = {
  async getAll(params?: any) {
    const { data } = await api.get('/notifications', { params });
    return data;
  },

  async getUnreadCount() {
    const { data } = await api.get('/notifications/unread-count');
    return data;
  },

  async markAsRead(id: string) {
    const { data } = await api.patch(`/notifications/${id}/read`);
    return data;
  },

  async markAllAsRead() {
    const { data } = await api.patch('/notifications/read-all');
    return data;
  }
};
