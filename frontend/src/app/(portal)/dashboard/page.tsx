"use client";

import { useAuth } from "@/contexts/AuthContext";
import { Role } from "@/types/auth";
import { UserDashboard } from "@/components/dashboard/UserDashboard";
import { AdminDashboardView } from "@/components/dashboard/AdminDashboardView";
import { InternalDashboard } from "@/components/dashboard/InternalDashboard";
import { CSDashboard } from "@/components/dashboard/CSDashboard";
import { SmartOnboarding } from "@/components/dashboard/SmartOnboarding";

export default function DashboardPage() {
  const { user } = useAuth();

  if (!user) return null;

  const isAdmin = user.roles.includes(Role.ADMIN);
  const isCS = user.roles.includes(Role.CS);
  const isStaff = user.roles.some(role => 
    [Role.DOCUMENT_VALIDATOR, Role.FIELD_INSPECTOR, Role.LEGALIZER].includes(role)
  );

  return (
    <div className="container mx-auto py-6">
      <SmartOnboarding />
      
      {isAdmin && <AdminDashboardView />}
      {isCS && <CSDashboard />}
      {isStaff && <InternalDashboard />}
      {!isAdmin && !isCS && !isStaff && <UserDashboard />}
    </div>
  );
}
