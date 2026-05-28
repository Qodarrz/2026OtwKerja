"use client";

import { useAuth } from "@/contexts/AuthContext";
import { Role } from "@/types/auth";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { SocketProvider } from "@/contexts/SocketContext";
import { GlobalNotificationModal } from "@/components/notifications/GlobalNotificationModal";

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
    [Role.DOCUMENT_VALIDATOR, Role.FIELD_INSPECTOR, Role.LEGALIZER, Role.CS].includes(role)
  );

  const isInternal = isAdmin || isStaff;

  return (
    <ProtectedRoute>
      <SocketProvider>
        <div className={cn("min-h-screen bg-background", isInternal ? "flex" : "block")}>
          {isInternal ? (
            <>
              <Sidebar />
              <main className="flex-1 lg:ml-80 p-10 bg-background min-h-screen">
                {children}
              </main>
              <GlobalNotificationModal />
            </>
          ) : (
            <>
              <Navbar />
              <main className="pt-32 pb-20 px-6">
                <div className="max-w-7xl mx-auto">
                  {children}
                </div>
              </main>
              <GlobalNotificationModal />
            </>
          )}
        </div>
      </SocketProvider>
    </ProtectedRoute>
  );
}
