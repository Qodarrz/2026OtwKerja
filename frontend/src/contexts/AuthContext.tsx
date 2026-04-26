  'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AuthState, Role } from '@/types/auth';
import { useRouter } from 'next/navigation';

interface AuthContextType extends AuthState {
  login: (token: string, user: User) => void;
  logout: () => void;
  isAdmin: () => boolean;
  isInternal: () => boolean;
  isVerified: () => boolean;
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

  const isVerified = () => {
    return authState.user?.verify_gmail || false;
  };

  // Fallback to OTP or KTP if authenticated but not fully verified
  useEffect(() => {
    if (authState.isAuthenticated && authState.user && !authState.isLoading) {
      const pathname = window.location.pathname;
      const isAuthPage = pathname === '/login' || pathname === '/register';
      const isOtpPage = pathname.includes('/verify-otp');
      const isKtpPage = pathname.includes('/verify-ktp');
      const isInternalUser = isInternal();

      // 1. If on Login/Register but already logged in
      if (isAuthPage) {
        if (!authState.user.verify_gmail) {
          router.push(`/verify-otp?email=${encodeURIComponent(authState.user.email)}`);
        } else if (!authState.user.isKtpVerified && !isInternalUser) {
          router.push('/verify-ktp');
        } else {
          router.push(isInternalUser ? '/dashboard' : '/submit');
        }
        return;
      }

      // 2. If already verified but on OTP page
      if (isOtpPage && authState.user.verify_gmail) {
        if (!authState.user.isKtpVerified && !isInternalUser) {
          router.push('/verify-ktp');
        } else {
          router.push(isInternalUser ? '/dashboard' : '/submit');
        }
        return;
      }

      // 3. Global redirect for unverified users on protected routes
      // Don't redirect on root, profile, or the pages themselves
      const isExcluded = pathname === '/' || pathname.includes('/profile') || isOtpPage || isKtpPage;
      
      if (!authState.user.verify_gmail && !isExcluded) {
        router.push(`/verify-otp?email=${encodeURIComponent(authState.user.email)}`);
      } else if (authState.user.verify_gmail && !authState.user.isKtpVerified && !isInternalUser && !isExcluded) {
        router.push('/verify-ktp');
      }
    }
  }, [authState.isAuthenticated, authState.user?.verify_gmail, authState.user?.isKtpVerified, authState.isLoading, router]);

  return (
    <AuthContext.Provider value={{ ...authState, login, logout, isAdmin, isInternal, isVerified, hasRole }}>
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
