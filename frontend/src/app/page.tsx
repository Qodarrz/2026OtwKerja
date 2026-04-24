"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/layout/Navbar";
import { cn } from "@/lib/utils";
import { 
  FileText, 
  Map as MapIcon, 
  ShieldCheck, 
  Zap, 
  ArrowRight,
  ChevronRight,
  TrendingUp,
  Building2,
  Scale
} from "lucide-react";
import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-background overflow-hidden">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 px-6">
        {/* Background Orbs */}
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] -z-10 animate-pulse-slow" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-accent/10 rounded-full blur-[100px] -z-10" />

        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-6 border border-primary/20">
              <Zap className="w-4 h-4" />
              Sistem Perizinan Terpadu Era Digital
            </span>
            <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight mb-8 leading-[1.1]">
              Urus Perizinan Bangunan <br />
              <span className="gradient-text">Semudah Klik Jari.</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
              Platform revolusioner untuk memproses IMB/PBG secara otomatis, cek overlap lahan, dan estimasi NJOP secara real-time.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/submit">
                <Button size="lg" variant="premium" className="group">
                  Mulai Pengajuan
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/public-tracking">
                <Button size="lg" variant="outline" className="rounded-2xl">
                  Lacak Status Izin
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Stats/Features Preview */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {[
              { 
                icon: MapIcon, 
                title: "Pemetaan Presisi", 
                desc: "Integrasi peta interaktif untuk menentukan koordinat lahan dengan akurasi tinggi.",
                color: "bg-blue-500"
              },
              { 
                icon: Scale, 
                title: "Cek Overlap Lahan", 
                desc: "Deteksi dini konflik hak tanah dengan database pertanahan yang terintegrasi.",
                color: "bg-purple-500"
              },
              { 
                icon: TrendingUp, 
                title: "Estimasi NJOP", 
                desc: "Hitung perkiraan biaya dan pajak bangunan secara instan berdasarkan zona.",
                color: "bg-emerald-500"
              },
            ].map((feature, i) => (
              <div 
                key={i}
                className="group p-8 rounded-3xl bg-card border border-border/50 hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-300 text-left"
              >
                <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mb-6 text-white shadow-lg", feature.color)}>
                  <feature.icon className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.desc}
                </p>
                <div className="mt-6 flex items-center text-primary font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                  Pelajari lebih lanjut <ChevronRight className="ml-1 w-4 h-4" />
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-12">
            Didukung Oleh Instansi Terkait
          </p>
          <div className="flex flex-wrap justify-center items-center gap-12 opacity-50 grayscale hover:grayscale-0 transition-all">
            <div className="flex items-center gap-2 font-bold text-2xl">
              <Building2 className="w-8 h-8" /> DINAS PUPR
            </div>
            <div className="flex items-center gap-2 font-bold text-2xl">
              <ShieldCheck className="w-8 h-8" /> BPN RI
            </div>
            <div className="flex items-center gap-2 font-bold text-2xl">
              <FileText className="w-8 h-8" /> KEMENKEU
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
