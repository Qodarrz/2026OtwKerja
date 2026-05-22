'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AuthState, Role } from '@/types/auth';
import { useRouter } from 'next/navigation';
import { authService } from '@/services/auth.service';

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
    isAuthenticated: false,
    isLoading: true,
  });
  const router = useRouter();

  useEffect(() => {
    // 1. Initial optimistic hydration from session hint
    const storedUser = typeof window !== 'undefined' ? localStorage.getItem('user_hint') : null;
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setAuthState({
          user,
          isAuthenticated: true,
          isLoading: false, // Optimistically assume valid
        });
      } catch (e) {
        localStorage.removeItem('user_hint');
        if (window.location.pathname !== '/callback') {
          fetch('/api/auth/logout', { method: 'POST' }).catch(() => { });
        }
      }
    } else {
      // Force clear cookie if user_hint is missing so middleware doesn't redirect loop
      // But SKIP this on /callback because the cookie was just set by OAuth and user_hint isn't saved yet
      if (typeof window !== 'undefined' && window.location.pathname !== '/callback') {
        fetch('/api/auth/logout', { method: 'POST' }).catch(() => { });
      }
    }

    // 2. Full background validation with the server
    const initAuth = async () => {
      try {
        const userProfile = await authService.getProfile();
        localStorage.setItem('user_hint', JSON.stringify(userProfile));
        setAuthState({
          user: userProfile,
          isAuthenticated: true,
          isLoading: false,
        });
      } catch (err: any) {
        const isAuthError = err.response && err.response.status === 401;

        if (isAuthError) {
          localStorage.removeItem('user_hint');

          // DO NOT call logout API on /callback page to prevent race condition where 
          // the cookie might not be sent yet by the browser, deleting the newly created session.
          if (typeof window !== 'undefined' && window.location.pathname !== '/callback') {
            try {
              // Force clear local cookie
              await fetch('/api/auth/logout', { method: 'POST' });
              // Attempt to logout from backend
              await authService.logout();
            } catch (e) {
              // Ignore errors during cleanup
            }
          }

          setAuthState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
        } else {
          // If it's a network error (server restarting) or 500, do NOT log out.
          // Just gracefully stop loading and rely on the optimistic state.
          setAuthState((prev) => ({
            ...prev,
            isLoading: false,
          }));
        }
      }
    };

    initAuth();
  }, []);

  const login = (token: string, user: User) => {
    localStorage.setItem('user_hint', JSON.stringify(user));
    setAuthState({
      user,
      isAuthenticated: true,
      isLoading: false,
    });
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      await authService.logout();
    } catch (err) {
      console.error('[AuthContext] Logout error:', err);
    }
    localStorage.removeItem('user_hint');
    setAuthState({
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
      Role.LEGALIZER,
      Role.CS
    ];
    return authState.user?.roles.some(role => internalRoles.includes(role)) || false;
  };

  const isVerified = () => {
    return authState.user?.verify_gmail || false;
  };

  // Centralized redirection logic
  useEffect(() => {
    if (authState.isAuthenticated && authState.user && !authState.isLoading) {
      const pathname = window.location.pathname;
      const isAuthPage = pathname === '/login' || pathname === '/register';
      const isOtpPage = pathname.includes('/verify-otp');
      const isKtpPage = pathname.includes('/verify-ktp');
      const isInternalUser = isInternal();

      // Skip redirection for certain pages
      const isExcluded = pathname === '/' || pathname.includes('/profile');

      if (isExcluded) return;

      // 1. Check Gmail Verification
      if (!authState.user.verify_gmail) {
        if (!isOtpPage) {
          router.push(`/verify-otp?email=${encodeURIComponent(authState.user.email)}`);
        }
        return;
      }

      // 2. We no longer force KTP verification on login. User can explore the dashboard.
      // KTP check will be enforced when they try to apply for a permit.

      // 3. Handle Login/Register/OTP page redirects if already fully verified
      const isVerificationPage = isOtpPage;
      if (isAuthPage || isVerificationPage) {
        router.push(isInternalUser ? '/dashboard' : '/submit');
      }
    }
  }, [authState.isAuthenticated, authState.user?.verify_gmail, authState.isLoading, router]);

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
