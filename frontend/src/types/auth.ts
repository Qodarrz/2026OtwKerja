export enum Role {
  USER = 'USER',
  ADMIN = 'ADMIN',
  DOCUMENT_VALIDATOR = 'DOCUMENT_VALIDATOR',
  FIELD_INSPECTOR = 'FIELD_INSPECTOR',
  LEGALIZER = 'LEGALIZER',
}

export interface User {
  id: string;
  email: string;
  name: string | null;
  provider: 'LOCAL' | 'GOOGLE';
  roles: Role[];
  isKtpVerified: boolean;
  verify_gmail: boolean;
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
