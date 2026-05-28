"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Home,
  LayoutDashboard,
  FilePlus,
  Search,
  Bell,
  User,
  Menu,
  X,
  Sun,
  Moon,
  ExternalLink,
  LogOut
} from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "next-themes";

export function Navbar() {
  const pathname = usePathname();
  const { isAuthenticated, user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedNotif, setSelectedNotif] = useState<any>(null);
  const [isLoadingNotif, setIsLoadingNotif] = useState(false);

  const fetchNotifications = async (showLoading = false) => {
    if (!isAuthenticated) return;
    try {
      if (showLoading) setIsLoadingNotif(true);
      const { notificationService } = await import('@/services/notification.service');
      const countRes = await notificationService.getUnreadCount();
      setUnreadCount(countRes.count || 0);

      if (isNotifOpen || showLoading) {
        const listRes = await notificationService.getAll({ limit: 10 });
        setNotifications(listRes.data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      if (showLoading) setIsLoadingNotif(false);
    }
  };

  useEffect(() => {
    fetchNotifications(isNotifOpen && notifications.length === 0);
    const interval = setInterval(() => fetchNotifications(false), 30000); // Polling every 30s
    return () => clearInterval(interval);
  }, [isAuthenticated, isNotifOpen]);

  const handleMarkAsRead = async (id: string, isRead: boolean) => {
    if (isRead) return;
    try {
      const { notificationService } = await import('@/services/notification.service');
      await notificationService.markAsRead(id);
      fetchNotifications();
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const guestItems = [
    { name: "Beranda", href: "/" },
    { name: "Transparansi", href: "/public-tracking", icon: ExternalLink },
  ];

  const authItems = [
    { name: "Beranda", href: "/", icon: Home },
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Pengajuan", href: "/submit", icon: FilePlus },
    { name: "Lacak Izin", href: "/public-tracking", icon: Search },
  ];

  const navItems = isAuthenticated ? authItems : guestItems;

  return (
    <>
      <nav
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-6 py-4",
          isScrolled
            ? "bg-background/80 backdrop-blur-lg border-b border-border shadow-sm py-3"
            : "bg-transparent"
        )}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="text-xl font-bold tracking-tight">
              Flow<span className="text-primary">Gov</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-1 bg-background p-1 rounded-2xl border border-border/50">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all",
                    isActive
                      ? "bg-background text-primary shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                  )}
                >
                  {item.icon && <item.icon className="w-4 h-4" />}
                  {item.name}
                </Link>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            {mounted && (
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="hidden md:block p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground hover:text-primary"
              >
                {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
            )}

            {isAuthenticated ? (
              <>
                <div className="relative">
                  <button
                    onClick={() => setIsNotifOpen(!isNotifOpen)}
                    className="relative p-2 text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 w-4 h-4 bg-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center rounded-full border-2 border-background">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>

                  <AnimatePresence>
                    {isNotifOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute top-full right-0 mt-2 w-80 bg-background border border-border rounded-xl shadow-xl overflow-hidden z-50"
                      >
                        <div className="p-4 border-b border-border flex items-center justify-between bg-muted/30">
                          <h3 className="font-bold text-sm">Notifikasi</h3>
                          {unreadCount > 0 && (
                            <span className="text-xs text-primary font-medium">{unreadCount} baru</span>
                          )}
                        </div>
                        <div className="max-h-[300px] overflow-y-auto">
                          {isLoadingNotif ? (
                            <div className="divide-y divide-border">
                              {[...Array(3)].map((_, i) => (
                                <div key={i} className="p-4 w-full">
                                  <div className="flex justify-between items-start mb-2">
                                    <div className="h-4 bg-muted animate-pulse rounded w-2/3"></div>
                                    <div className="w-2 h-2 rounded-full bg-muted animate-pulse shrink-0 mt-1"></div>
                                  </div>
                                  <div className="space-y-2 mb-2">
                                    <div className="h-3 bg-muted animate-pulse rounded w-full"></div>
                                    <div className="h-3 bg-muted animate-pulse rounded w-4/5"></div>
                                  </div>
                                  <div className="h-2 bg-muted animate-pulse rounded w-1/4 mt-3"></div>
                                </div>
                              ))}
                            </div>
                          ) : notifications.length === 0 ? (
                            <div className="p-8 text-center text-muted-foreground text-sm flex flex-col items-center">
                              <Bell className="w-8 h-8 opacity-20 mb-2" />
                              Belum ada notifikasi
                            </div>
                          ) : (
                            <div className="divide-y divide-border">
                              {notifications.map((notif) => (
                                <div
                                  key={notif.id}
                                  onClick={() => {
                                    handleMarkAsRead(notif.id, notif.isRead);
                                    setSelectedNotif(notif);
                                    setIsNotifOpen(false); // optional: close dropdown
                                  }}
                                  className={cn(
                                    "p-4 hover:bg-muted/50 transition-colors cursor-pointer text-left w-full",
                                    !notif.isRead ? "bg-primary/5" : ""
                                  )}
                                >
                                  <div className="flex justify-between items-start mb-1">
                                    <h4 className={cn("text-sm font-semibold", !notif.isRead ? "text-foreground" : "text-muted-foreground")}>
                                      {notif.title}
                                    </h4>
                                    {!notif.isRead && <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5 ml-2" />}
                                  </div>
                                  <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{notif.message}</p>
                                  <span className="text-[10px] text-muted-foreground/70 font-medium">
                                    {new Date(notif.createdAt).toLocaleDateString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="h-8 w-px bg-border mx-2 hidden md:block" />

                <Link href="/dashboard/profile" className="hidden md:block">
                  <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center overflow-hidden hover:scale-105 transition-transform group">
                    {user?.name ? (
                      <span className="text-xs font-bold text-primary">{user.name.charAt(0)}</span>
                    ) : (
                      <User className="w-5 h-5 text-primary" />
                    )}
                  </div>
                </Link>

                <button
                  onClick={logout}
                  className="hidden md:block p-2 text-muted-foreground hover:text-rose-500 transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="hidden md:block">
                  <Button variant="ghost" size="sm" className="rounded-xl">
                    Masuk
                  </Button>
                </Link>
                <Link href="/register" className="hidden md:block">
                  <Button size="sm" className="rounded-xl shadow-lg">
                    Daftar
                  </Button>
                </Link>
              </>
            )}

            {/* Mobile Toggle */}
            <button
              className="md:hidden p-2 text-foreground"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-full left-0 right-0 bg-background/95 backdrop-blur-xl border-b border-border p-6 md:hidden flex flex-col gap-4 shadow-lg"
            >
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 text-lg font-medium p-3 hover:bg-muted rounded-xl transition-colors"
                >
                  {item.icon && <item.icon className="w-5 h-5 text-primary" />}
                  {item.name}
                </Link>
              ))}

              {/* Mobile Actions: Profile, Theme, Logout */}
              <div className="pt-4 border-t border-border flex flex-col gap-2">
                {isAuthenticated && (
                  <Link
                    href="/dashboard/profile"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 text-lg font-medium p-3 hover:bg-muted rounded-xl transition-colors"
                  >
                    <User className="w-5 h-5 text-primary" />
                    Profil Saya
                  </Link>
                )}

                {mounted && (
                  <button
                    onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                    className="flex items-center gap-3 text-lg font-medium p-3 hover:bg-muted rounded-xl transition-colors text-left"
                  >
                    {theme === "dark" ? <Sun className="w-5 h-5 text-primary" /> : <Moon className="w-5 h-5 text-primary" />}
                    {theme === "dark" ? "Mode Terang" : "Mode Gelap"}
                  </button>
                )}

                {isAuthenticated ? (
                  <button
                    onClick={() => {
                      logout();
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex items-center gap-3 text-lg font-medium p-3 hover:bg-rose-500/10 text-rose-500 rounded-xl transition-colors text-left mt-2"
                  >
                    <LogOut className="w-5 h-5" />
                    Keluar
                  </button>
                ) : (
                  <div className="flex flex-col gap-3 mt-2">
                    <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                      <Button variant="outline" className="w-full rounded-xl h-12">Masuk</Button>
                    </Link>
                    <Link href="/register" onClick={() => setIsMobileMenuOpen(false)}>
                      <Button className="w-full rounded-xl h-12">Mulai Sekarang</Button>
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Notification Modal */}
      <AnimatePresence>
        {selectedNotif && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-background border border-border p-6 rounded-3xl max-w-md w-full shadow-2xl relative"
            >
              <button
                onClick={() => setSelectedNotif(null)}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted text-muted-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4">
                <Bell className="w-6 h-6" />
              </div>

              <h2 className="text-xl font-bold mb-2 pr-8">{selectedNotif.title}</h2>
              <p className="text-muted-foreground mb-4 leading-relaxed">
                {selectedNotif.message}
              </p>

              <div className="flex items-center justify-between mt-6 pt-6 border-t border-border">
                <span className="text-xs text-muted-foreground font-medium">
                  {new Date(selectedNotif.createdAt).toLocaleString('id-ID', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>

                {selectedNotif.applicationId && (
                  <Link href={`/dashboard/applications/${selectedNotif.applicationId}`} onClick={() => setSelectedNotif(null)}>
                    <Button variant="outline" size="sm" className="rounded-full">
                      Lihat Aplikasi
                    </Button>
                  </Link>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
