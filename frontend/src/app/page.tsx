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
  Scale,
  Eye,
  Clock,
  CheckCircle2
} from "lucide-react";
import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-background overflow-hidden">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 px-6">
        {/* Background Orbs */}
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] -z-10 animate-pulse-slow" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-sky-500/5 rounded-full blur-[100px] -z-10" />

        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-bold mb-6 border border-primary/20">
              <ShieldCheck className="w-4 h-4" />
              Sistem Monitoring Kinerja Birokrasi Berbasis ERP
            </span>
            <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight mb-8 leading-[1.1]">
              Transformasi Digital <br />
              <span className="text-primary">Pelayanan Publik Masa Depan.</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
              FlowGov mengeliminasi "Internal Black Box" birokrasi dengan transparansi real-time, kontrol SLA otomatis, dan akuntabilitas berbasis data.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/register">
                <Button size="lg" variant="premium" className="group">
                  Mulai Sekarang
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/public-tracking">
                <Button size="lg" variant="outline" className="rounded-2xl border-primary/20 hover:bg-primary/5 text-primary">
                  Lacak Izin Publik
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Features Grid */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {[
              { 
                icon: Eye, 
                title: "End-to-End Visibility", 
                desc: "Pantau setiap tahapan internal birokrasi secara transparan dari awal hingga akhir.",
                color: "bg-sky-500"
              },
              { 
                icon: Clock, 
                title: "Real-Time SLA Control", 
                desc: "Sistem otomatis yang memastikan setiap proses diselesaikan tepat waktu sesuai standar pelayanan.",
                color: "bg-blue-600"
              },
              { 
                icon: CheckCircle2, 
                title: "Accountability by Design", 
                desc: "Jejak digital yang tidak dapat dimanipulasi menjamin akuntabilitas setiap individu pelaksana.",
                color: "bg-sky-400"
              },
            ].map((feature, i) => (
              <div 
                key={i}
                className="group p-8 rounded-3xl bg-card border border-border/50 hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-300 text-left"
              >
                <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mb-6 text-white shadow-lg shadow-primary/20", feature.color)}>
                  <feature.icon className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Transparency Section */}
      <section className="py-24 bg-muted/30 border-y border-border/50 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl font-bold tracking-tight mb-6">
                Mendobrak "Internal Black Box" Pelayanan Publik
              </h2>
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                Kebanyakan sistem perizinan saat ini hanya mendigitalisasi proses pengajuan. FlowGov melangkah lebih jauh dengan membuka kotak hitam proses internal birokrasi yang selama ini tidak tersentuh publik.
              </p>
              <div className="space-y-6">
                {[
                  "Pelacakan pergerakan berkas antar departemen",
                  "Deteksi otomatis bottleneck pemrosesan",
                  "Log audit yang tidak dapat diubah (Immutable Logs)",
                  "Notifikasi real-time untuk setiap progres"
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                    </div>
                    <span className="font-semibold text-foreground/80">{item}</span>
                  </div>
                ))}
              </div>
              <Link href="/public-tracking" className="inline-block mt-10">
                <Button variant="link" className="p-0 text-primary font-bold text-lg hover:no-underline group">
                  Lihat Dashboard Transparansi <ChevronRight className="ml-1 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 bg-primary/10 blur-[80px] rounded-full" />
              <div className="relative bg-card border border-border/50 rounded-3xl p-8 shadow-2xl">
                <div className="flex items-center justify-between mb-8 border-b border-border pb-4">
                  <h4 className="font-bold flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    Indeks Kinerja Layanan
                  </h4>
                  <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded">Real-time</span>
                </div>
                <div className="space-y-6">
                  {[
                    { label: "SLA Compliance", value: 94 },
                    { label: "Tingkat Transparansi", value: 100 },
                    { label: "Efisiensi Birokrasi", value: 82 },
                  ].map((stat, i) => (
                    <div key={i} className="space-y-2">
                      <div className="flex justify-between text-xs font-bold uppercase tracking-wider">
                        <span>{stat.label}</span>
                        <span>{stat.value}%</span>
                      </div>
                      <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          whileInView={{ width: `${stat.value}%` }}
                          transition={{ duration: 1 }}
                          className="h-full bg-primary"
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-8 p-4 bg-primary/5 rounded-2xl border border-primary/10">
                  <p className="text-[10px] uppercase font-bold text-primary mb-1 tracking-widest">Global Index Impact</p>
                  <p className="text-sm font-medium text-muted-foreground">
                    FlowGov mendukung peningkatan skor **CPI** dan **EGDI** melalui penguatan sistem pengawasan internal.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust/Footer Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-12">
            Standar Akuntabilitas Tinggi
          </p>
          <div className="flex flex-wrap justify-center items-center gap-12 opacity-40 grayscale hover:grayscale-0 transition-all cursor-default">
            <div className="flex items-center gap-2 font-bold text-2xl">
              <Building2 className="w-8 h-8" /> DINAS PUPR
            </div>
            <div className="flex items-center gap-2 font-bold text-2xl">
              <ShieldCheck className="w-8 h-8" /> BPN RI
            </div>
            <div className="flex items-center gap-2 font-bold text-2xl">
              <Scale className="w-8 h-8" /> OMBUDSMAN
            </div>
          </div>
          <div className="mt-20 pt-8 border-t border-border/50 text-center text-muted-foreground text-sm">
            &copy; 2026 FlowGov - Team 2026OtwKerja. Seluruh hak cipta dilindungi.
          </div>
        </div>
      </section>
    </main>
  );
}
