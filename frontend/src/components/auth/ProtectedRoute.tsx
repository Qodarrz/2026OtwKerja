'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Role } from '@/types/auth';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: Role[];
  requireInternal?: boolean;
}

export default function ProtectedRoute({ 
  children, 
  allowedRoles,
  requireInternal = false
}: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading, isInternal } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push('/login');
      } else if (requireInternal && !isInternal()) {
        router.push('/'); // Redirect to home if not internal but on internal route
      } else if (allowedRoles && !user?.roles.some(role => allowedRoles.includes(role))) {
        router.push('/'); // Redirect to home if role not allowed
      }
    }
  }, [isLoading, isAuthenticated, isInternal, user, router, requireInternal, allowedRoles]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#020617]">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (requireInternal && !isInternal()) {
    return null;
  }

  if (allowedRoles && !user?.roles.some(role => allowedRoles.includes(role))) {
    return null;
  }

  return <>{children}</>;
}
