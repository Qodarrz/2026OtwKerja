"use client";

import { useAuth } from "@/contexts/AuthContext";
import { Role } from "@/types/auth";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { Navbar } from "@/components/layout/Navbar";
import { UserDashboard } from "@/components/dashboard/UserDashboard";
import { AdminDashboardView } from "@/components/dashboard/AdminDashboardView";
import { InternalDashboard } from "@/components/dashboard/InternalDashboard";
import { Loader2 } from "lucide-react";

export default function DashboardPage() {
  const { user, isLoading } = useAuth();

  const renderDashboard = () => {
    if (!user) return null;

    // Prioritize Admin
    if (user.roles.includes(Role.ADMIN)) {
      return <AdminDashboardView />;
    }

    // Then Internal Staff
    const internalRoles = [
      Role.DOCUMENT_VALIDATOR, 
      Role.FIELD_INSPECTOR, 
      Role.LEGALIZER
    ];
    
    if (user.roles.some(role => internalRoles.includes(role))) {
      return <InternalDashboard />;
    }

    // Default to User
    return <UserDashboard />;
  };

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-background pt-32 pb-20 px-6">
        <Navbar />
        
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
          </div>
        ) : (
          renderDashboard()
        )}
      </main>
    </ProtectedRoute>
  );
}
