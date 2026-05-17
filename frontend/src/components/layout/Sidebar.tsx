"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  ClipboardList, 
  BarChart3, 
  Users, 
  Settings, 
  LogOut,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  Building2,
  FileSearch,
  CheckCircle,
  AlertCircle,
  BarChart,
  Activity,
  History,
  Lock,
  BellRing,
  Headset
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Role } from "@/types/auth";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [openMenus, setOpenMenus] = useState<string[]>([]);

  const toggleMenu = (title: string) => {
    setOpenMenus(prev => 
      prev.includes(title) ? prev.filter(t => t !== title) : [...prev, title]
    );
  };

  const menuItems = [
    {
      title: "Dashboard",
      icon: LayoutDashboard,
      href: "/dashboard",
      roles: [Role.ADMIN, Role.DOCUMENT_VALIDATOR, Role.FIELD_INSPECTOR, Role.LEGALIZER, Role.CS]
    },
    {
      title: "Customer Service",
      icon: Headset,
      href: "/dashboard/tickets",
      roles: [Role.ADMIN, Role.CS]
    },
    {
      title: "Antrean Berkas",
      icon: ClipboardList,
      roles: [Role.DOCUMENT_VALIDATOR, Role.FIELD_INSPECTOR, Role.LEGALIZER],
      subItems: [
        { title: "Menunggu Tindakan", icon: Activity, href: "/dashboard/tasks" },
        { title: "Sudah Selesai", icon: CheckCircle, href: "/dashboard/tasks/completed" },
        { title: "Melewati Batas (SLA)", icon: AlertCircle, href: "/dashboard/tasks/expired" }
      ]
    },
    {
      title: "Analitik & Laporan",
      icon: BarChart3,
      roles: [Role.ADMIN],
      subItems: [
        { title: "Performa Staf", icon: BarChart, href: "/dashboard/analytics/performance" },
        { title: "Analisis Bottleneck", icon: FileSearch, href: "/dashboard/analytics/bottlenecks" },
        { title: "Laporan SLA", icon: History, href: "/dashboard/analytics/sla" }
      ]
    },
    {
      title: "Manajemen Sistem",
      icon: ShieldCheck,
      roles: [Role.ADMIN],
      subItems: [
        { title: "Daftar Pengguna", icon: Users, href: "/dashboard/users" },
        { title: "Hak Akses (RBAC)", icon: Lock, href: "/dashboard/users/roles" },
        { title: "Audit Log", icon: History, href: "/dashboard/audit-logs" }
      ]
    },
    {
      title: "Pengaturan",
      icon: Settings,
      roles: [Role.ADMIN, Role.DOCUMENT_VALIDATOR, Role.FIELD_INSPECTOR, Role.LEGALIZER],
      subItems: [
        { title: "Profil Saya", icon: Users, href: "/dashboard/profile" },
        { title: "Notifikasi Sistem", icon: BellRing, href: "/dashboard/settings/notifications" }
      ]
    }
  ];

  const filteredMenu = menuItems.filter(item => 
    item.roles.some(role => user?.roles.includes(role))
  );

  return (
    <div className="w-72 h-screen bg-card border-r border-border flex flex-col fixed left-0 top-0 z-50 shadow-sm font-sans">
      <div className="p-8 pb-4 flex items-center gap-3">
        <div>
          <h2 className="font-bold text-xl leading-tight tracking-tight text-foreground">
            Flow<span className="text-primary">Gov</span>
          </h2>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Internal Portal</p>
        </div>
      </div>

      <nav className="flex-1 px-4 py-8 space-y-2 overflow-y-auto scrollbar-hide">
        {filteredMenu.map((item) => {
          const hasSubItems = item.subItems && item.subItems.length > 0;
          const isOpen = openMenus.includes(item.title);
          const isActive = pathname === item.href || (hasSubItems && item.subItems?.some(sub => sub.href === pathname));

          return (
            <div key={item.title} className="space-y-1">
              {item.href ? (
                <Link 
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                    pathname === item.href 
                      ? "bg-primary/10 text-primary" 
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  )}
                >
                  <item.icon className={cn(
                    "w-5 h-5",
                    pathname === item.href ? "text-primary" : "text-muted-foreground group-hover:text-muted-foreground"
                  )} />
                  <span className="font-bold text-sm tracking-tight">{item.title}</span>
                </Link>
              ) : (
                <button
                  onClick={() => toggleMenu(item.title)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                    isActive && !isOpen
                      ? "bg-primary/5 text-primary" 
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  )}
                >
                  <item.icon className={cn(
                    "w-5 h-5",
                    isActive ? "text-primary" : "text-muted-foreground group-hover:text-muted-foreground"
                  )} />
                  <span className="font-bold text-sm tracking-tight">{item.title}</span>
                  {isOpen ? (
                    <ChevronDown className="ml-auto w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="ml-auto w-4 h-4 text-muted-foreground" />
                  )}
                </button>
              )}

              <AnimatePresence>
                {hasSubItems && isOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden pl-11 pr-2 space-y-1"
                  >
                    {item.subItems?.map((sub) => (
                      <Link
                        key={sub.href}
                        href={sub.href}
                        className={cn(
                          "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-all duration-200",
                          pathname === sub.href
                            ? "text-primary font-bold bg-primary/5"
                            : "text-muted-foreground hover:text-foreground hover:translate-x-1"
                        )}
                      >
                        <sub.icon className={cn(
                          "w-4 h-4",
                          pathname === sub.href ? "text-primary" : "text-slate-300"
                        )} />
                        {sub.title}
                      </Link>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </nav>

      <div className="p-6 border-t border-border">
        <div className="bg-background border border-border rounded-2xl p-4 mb-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-primary">
              {user?.name?.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-foreground truncate tracking-tight">{user?.name}</p>
              <p className="text-[10px] text-muted-foreground truncate uppercase font-bold tracking-widest">{user?.roles[0]}</p>
            </div>
          </div>
          <button 
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 py-2.5 text-xs font-bold text-muted-foreground hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all duration-200 border border-border hover:border-rose-100"
          >
            <LogOut className="w-4 h-4" /> Keluar Sistem
          </button>
        </div>
      </div>
    </div>
  );
}
