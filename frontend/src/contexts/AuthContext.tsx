'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AuthState, Role } from '@/types/auth';
import { useRouter } from 'next/navigation';

interface AuthContextType extends AuthState {
  login: (token: string, user: User) => void;
  logout: () => void;
  isAdmin: () => boolean;
  isInternal: () => boolean;
  hasRole: (role: Role) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
  });
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userJson = localStorage.getItem('user');

    if (token && userJson) {
      try {
        setAuthState({
          token,
          user: JSON.parse(userJson),
          isAuthenticated: true,
          isLoading: false,
        });
      } catch (err) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setAuthState(prev => ({ ...prev, isLoading: false }));
      }
    } else {
      setAuthState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  const login = (token: string, user: User) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    setAuthState({
      token,
      user,
      isAuthenticated: true,
      isLoading: false,
    });
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setAuthState({
      token: null,
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
    router.push('/login');
  };

  const hasRole = (role: Role) => {
    return authState.user?.roles.includes(role) || false;
  };

  const isAdmin = () => {
    return hasRole(Role.ADMIN);
  };

  const isInternal = () => {
    const internalRoles = [
      Role.ADMIN,
      Role.DOCUMENT_VALIDATOR,
      Role.FIELD_INSPECTOR,
      Role.LEGALIZER
    ];
    return authState.user?.roles.some(role => internalRoles.includes(role)) || false;
  };

  return (
    <AuthContext.Provider value={{ ...authState, login, logout, isAdmin, isInternal, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
