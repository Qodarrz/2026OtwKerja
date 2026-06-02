import api from "@/lib/axios";
import { Role } from "@/types/auth";
export interface UserResponse {
  id: string;
  name: string | null;
  email: string;
  roles: Role[];
  createdAt: string;
}
export const usersService = {
  getStaff: async (): Promise<UserResponse[]> => {
    const { data } = await api.get("/users/staff");
    return data;
  },
  getUsers: async (): Promise<UserResponse[]> => {
    const { data } = await api.get("/users");
    return data;
  },
  createUser: async (userData: any): Promise<UserResponse> => {
    const { data } = await api.post("/users", userData);
    return data;
  },
  updateRoles: async (userId: string, roles: Role[]) => {
    const { data } = await api.patch(`/users/${userId}/roles`, { roles });
    return data;
  },
  updateUser: async (userId: string, userData: any) => {
    const { data } = await api.patch(`/users/${userId}`, userData);
    return data;
  },
  deleteUser: async (userId: string) => {
    const { data } = await api.delete(`/users/${userId}`);
    return data;
  },
  getProfile: async () => {
    const { data } = await api.get("/users/me/profile");
    return data;
  },
  updateProfile: async (profileData: any) => {
    const { data } = await api.patch("/users/me/profile", profileData);
    return data;
  },
  getActivityHistory: async () => {
    const { data } = await api.get("/users/me/history");
    return data;
  },
  getSettings: async () => {
    const { data } = await api.get("/users/me/settings");
    return data;
  },
  updateSettings: async (settingsData: any) => {
    const { data } = await api.patch("/users/me/settings", settingsData);
    return data;
  },
};
