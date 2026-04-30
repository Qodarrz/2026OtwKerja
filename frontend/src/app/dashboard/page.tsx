"use client";

import { useAuth } from "@/contexts/AuthContext";
import { Role } from "@/types/auth";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { Navbar } from "@/components/layout/Navbar";
import { UserDashboard } from "@/components/dashboard/UserDashboard";
import { AdminDashboardView } from "@/components/dashboard/AdminDashboardView";
import { InternalDashboard } from "@/components/dashboard/InternalDashboard";
import { Sidebar } from "@/components/layout/Sidebar";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const { user, isLoading } = useAuth();

  if (isLoading) {  
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  const isAdmin = user.roles.includes(Role.ADMIN);
  const isStaff = user.roles.some(role => 
    [Role.DOCUMENT_VALIDATOR, Role.FIELD_INSPECTOR, Role.LEGALIZER].includes(role)
  );

  const isInternal = isAdmin || isStaff;

  const renderDashboardContent = () => {
    if (isAdmin) return <AdminDashboardView />;
    if (isStaff) return <InternalDashboard />;
    return <UserDashboard />;
  };

  return (
    <ProtectedRoute>
      <div className={cn("min-h-screen bg-background", isInternal ? "flex" : "block")}>
        {isInternal ? (
          <>
            <Sidebar />
            <main className="flex-1 ml-78 p-10 bg-slate-50/50 min-h-screen">
              {renderDashboardContent()}
            </main>
          </>
        ) : (
          <main className="pt-32 pb-20 px-6">
            <Navbar />
            <div className="max-w-7xl mx-auto">
              {renderDashboardContent()}
            </div>
          </main>
        )}
      </div>
    </ProtectedRoute>
  );
}
