"use client";

import { useAuth } from "@/contexts/AuthContext";
import { Role } from "@/types/auth";
import { UserDashboard } from "@/components/dashboard/UserDashboard";
import { AdminDashboardView } from "@/components/dashboard/AdminDashboardView";
import { InternalDashboard } from "@/components/dashboard/InternalDashboard";
import { Loader2 } from "lucide-react";

export default function DashboardPage() {
  const { user } = useAuth();

  if (!user) return null;

  const isAdmin = user.roles.includes(Role.ADMIN);
  const isStaff = user.roles.some(role => 
    [Role.DOCUMENT_VALIDATOR, Role.FIELD_INSPECTOR, Role.LEGALIZER].includes(role)
  );

  if (isAdmin) return <AdminDashboardView />;
  if (isStaff) return <InternalDashboard />;
  return <UserDashboard />;
}
