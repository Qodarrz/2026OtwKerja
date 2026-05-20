"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Lightbulb,
  ChevronRight,
  Target,
  ShieldCheck,
  Zap,
  X,
} from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

import { useAuth } from "@/contexts/AuthContext";

export function SmartOnboarding() {
  const [isVisible, setIsVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    setMounted(true);
    const isCompleted = localStorage.getItem('flowgov_onboarding_done');
    if (!isCompleted) {
      setIsVisible(true);
    }
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    localStorage.setItem('flowgov_onboarding_done', 'true');
  };

  if (!mounted || !isVisible) return null;

  const isStaff = user?.roles?.some(role => ['ADMIN', 'CS'].includes(role));
  if (!isStaff) return null;

  const guides = [
    {
      title: "Pantau SLA",
      desc: "Perhatikan timer pada setiap berkas. Warna merah berarti sudah overdue.",
      icon: Target,
      color: "text-rose-500",
      bg: "bg-rose-500/10",
    },
    {
      title: "Validasi Cepat",
      desc: "Gunakan tombol shortcut untuk approve/reject dokumen pendukung.",
      icon: Zap,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
    },
    {
      title: "Integritas Data",
      desc: "Setiap aksi Anda tercatat di Audit Log dan tidak bisa dimanipulasi.",
      icon: ShieldCheck,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
    },
  ];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="relative mb-10"
      >
        <Card className="border-none bg-primary text-primary-foreground overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 p-4">
            <button
              onClick={handleClose}
              className="p-1.5 bg-primary-foreground/10 hover:bg-primary-foreground/20 rounded-lg transition-colors"
              title="Tutup Panduan"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <CardContent className="p-8 md:p-10">
            <div className="flex flex-col lg:flex-row gap-10 items-center">
              <div className="lg:max-w-sm space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary-foreground/10 rounded-full text-[10px] font-bold uppercase tracking-widest">
                  <Lightbulb className="w-3.5 h-3.5" /> Quick Start Guide
                </div>
                <h3 className="text-3xl font-bold tracking-tight leading-tight">
                  Selamat Datang di Portal Internal FlowGov
                </h3>
                <p className="text-primary-foreground/80 font-medium leading-relaxed">
                  Sistem ini dirancang untuk mempermudah birokrasi. Ikuti panduan
                  cepat ini untuk mulai memproses perizinan secara efisien.
                </p>
                <Button 
                  onClick={handleClose}
                  className="rounded-xl bg-background text-foreground hover:bg-secondary font-bold px-6 shadow-lg border-none"
                >
                  Mulai Bekerja
                  <ChevronRight className="ml-2 w-4 h-4" />
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
                {guides.map((guide, i) => (
                  <div
                    key={i}
                    className="p-6 bg-primary-foreground/5 rounded-2xl border border-primary-foreground/10 hover:bg-primary-foreground/10 transition-colors group"
                  >
                    <div
                      className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110",
                        guide.bg,
                      )}
                    >
                      <guide.icon className={cn("w-5 h-5", guide.color)} />
                    </div>
                    <h4 className="font-bold text-sm mb-1">{guide.title}</h4>
                    <p className="text-xs text-primary-foreground/60 font-medium leading-normal">
                      {guide.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}

