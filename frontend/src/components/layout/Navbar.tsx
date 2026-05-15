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

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Guest nav items
  const guestItems = [
    { name: "Beranda", href: "/" },
    { name: "Transparansi", href: "/public-tracking", icon: ExternalLink },
  ];

  // Authenticated nav items
  const authItems = [
    { name: "Beranda", href: "/", icon: Home },
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Pengajuan", href: "/submit", icon: FilePlus },
    { name: "Lacak Izin", href: "/public-tracking", icon: Search },
  ];

  const navItems = isAuthenticated ? authItems : guestItems;

  return (
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

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-1 bg-muted/30 p-1 rounded-2xl border border-border/50">
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
          {/* Theme Toggle */}
          {mounted && (
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground hover:text-primary"
            >
              {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          )}

          {isAuthenticated ? (
            <>
              <button className="relative p-2 text-muted-foreground hover:text-primary transition-colors">
                <Bell className="w-5 h-5" />
                <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-primary rounded-full border-2 border-background" />
              </button>
              
              <div className="h-8 w-px bg-border mx-2 hidden sm:block" />
              
              <Link href="/dashboard/profile">
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
                className="p-2 text-muted-foreground hover:text-rose-500 transition-colors"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="hidden sm:block">
                <Button variant="ghost" size="sm" className="rounded-xl">
                  Masuk
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm" className="rounded-xl shadow-lg shadow-sm">
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
            {!isAuthenticated && (
              <div className="pt-4 border-t border-border flex flex-col gap-3">
                <Link href="/login">
                  <Button variant="outline" className="w-full rounded-xl">Masuk</Button>
                </Link>
                <Link href="/register">
                  <Button className="w-full rounded-xl">Mulai Sekarang</Button>
                </Link>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
