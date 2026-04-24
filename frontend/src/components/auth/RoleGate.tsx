'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Role } from '@/types/auth';

interface RoleGateProps {
  children: React.ReactNode;
  allowedRoles?: Role[];
  requireInternal?: boolean;
  fallback?: React.ReactNode;
}

export default function RoleGate({ 
  children, 
  allowedRoles, 
  requireInternal = false,
  fallback = null 
}: RoleGateProps) {
  const { user, isInternal } = useAuth();

  const hasAccess = () => {
    if (requireInternal && isInternal()) return true;
    if (allowedRoles && user?.roles.some(role => allowedRoles.includes(role))) return true;
    return false;
  };

  if (!hasAccess()) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
