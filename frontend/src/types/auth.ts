export interface User {
  id: string;
  email: string;
  name: string | null;
  provider: 'LOCAL' | 'GOOGLE';
}

export interface AuthResponse {
  access_token: string;
  user: User;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
