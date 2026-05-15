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
  updateRoles: async (userId: string, roles: Role[]) => {
    const { data } = await api.patch(`/users/${userId}/roles`, { roles });
    return data;
  },
};
