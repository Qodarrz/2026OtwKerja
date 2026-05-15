"use client";

import { useState } from "react";
import { 
  Search, 
  Activity, 
  Clock, 
  CheckCircle2, 
  FileText,
  ArrowRight,
  Globe,
  MapPin,
  ShieldCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export default function PublicTracking() {
  const [searchId, setSearchId] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearching(true);
    // Simulate API call
    setTimeout(() => {
      setResult({
        id: searchId || "APP-2026-882",
        status: "Sedang Diproses",
        type: "Izin Mendirikan Bangunan (IMB)",
        submittedAt: "24 Apr 2026",
        currentStage: "Validasi Lapangan",
        slaStatus: "Sesuai Jadwal",
        stages: [
          { name: "Submission", completed: true, date: "24 Apr" },
          { name: "Verifikasi Dokumen", completed: true, date: "25 Apr" },
          { name: "Validasi Lapangan", completed: false, active: true },
          { name: "Legalitas", completed: false },
          { name: "Selesai", completed: false },
        ]
      });
      setIsSearching(false);
    }, 1000);
  };

  return (
    <div className="space-y-10">
      
      {/* Hero Search */}
      <section className="pt-40 pb-20 px-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] -z-10" />
        
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-6">
              <Globe className="w-4 h-4" />
              Portal Transparansi Publik
            </span>
            <h1 className="text-4xl md:text-6xl font-black mb-8 tracking-tight">
              Pantau Status <span className="text-primary">Izin Anda.</span>
            </h1>
            <p className="text-lg text-muted-foreground mb-12 max-w-2xl mx-auto">
              Akses real-time untuk setiap tahapan permohonan Anda. Masukkan nomor referensi di bawah ini.
            </p>

            <form onSubmit={handleSearch} className="relative max-w-2xl mx-auto group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <input 
                type="text" 
                placeholder="Masukkan ID Permohonan (Contoh: PBG-2024-001)"
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                className="w-full h-20 bg-card border-2 border-border rounded-[2rem] pl-16 pr-44 text-xl font-bold focus:border-primary outline-none transition-all shadow-lg shadow-sm"
              />
              <Button 
                type="submit"
                disabled={isSearching}
                size="lg"
                className="absolute right-3 top-3 bottom-3 px-10 rounded-[1.5rem] shadow-md"
              >
                {isSearching ? "Mencari..." : "Lacak Berkas"}
                {!isSearching && <ArrowRight className="ml-2 w-5 h-5" />}
              </Button>
            </form>
          </motion.div>
        </div>
      </section>

      {/* Results */}
      <section className="pb-32 px-6">
        <div className="max-w-6xl mx-auto">
          <AnimatePresence mode="wait">
            {!result && !isSearching && (
              <motion.div 
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                className="text-center py-20"
              >
                <Activity className="w-16 h-16 mx-auto mb-6 text-muted-foreground" />
                <p className="font-bold text-lg uppercase tracking-widest text-muted-foreground">Menunggu Input</p>
              </motion.div>
            )}

            {result && (
              <motion.div 
                key="result"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="grid grid-cols-1 lg:grid-cols-3 gap-10"
              >
                {/* Summary Card */}
                <Card className="h-fit lg:sticky lg:top-32">
                  <CardHeader>
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
                        <FileText className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase">ID Referensi</p>
                        <p className="text-xl font-black">{result.id}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between py-3 border-b border-border">
                      <span className="text-sm text-muted-foreground">Jenis Izin</span>
                      <span className="text-sm font-bold text-right">{result.type}</span>
                    </div>
                    <div className="flex justify-between py-3 border-b border-border">
                      <span className="text-sm text-muted-foreground">Status SLA</span>
                      <span className="px-3 py-1 bg-emerald-500/10 text-emerald-600 text-[10px] font-bold rounded-full border border-emerald-500/20 uppercase tracking-wider">
                        {result.slaStatus}
                      </span>
                    </div>
                    <div className="flex justify-between py-3 border-b border-border">
                      <span className="text-sm text-muted-foreground">Dikirim</span>
                      <span className="text-sm font-bold">{result.submittedAt}</span>
                    </div>
                    
                    <div className="mt-8 p-4 bg-primary rounded-2xl text-primary-foreground shadow-md shadow-sm">
                      <div className="flex gap-3">
                        <ShieldCheck className="w-5 h-5 text-primary-foreground/80" />
                        <div>
                          <p className="text-[10px] font-bold uppercase opacity-80">Jaminan FlowGov</p>
                          <p className="text-xs font-medium mt-1 leading-relaxed">Status Anda dipantau 24/7 oleh sistem audit internal kami.</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Timeline */}
                <div className="lg:col-span-2 space-y-8">
                  <h3 className="text-2xl font-bold flex items-center gap-3">
                    <Activity className="w-6 h-6 text-primary" />
                    Timeline Permohonan
                  </h3>

                  <div className="space-y-6">
                    {result.stages.map((stage: any, i: number) => (
                      <div 
                        key={i} 
                        className={cn(
                          "relative p-8 rounded-3xl border transition-all duration-500",
                          stage.completed ? "bg-emerald-500/5 border-emerald-500/20" : 
                          stage.active ? "bg-card border-primary shadow-lg shadow-sm scale-[1.02]" : 
                          "bg-muted/30 border-border opacity-50"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-6">
                            <div className={cn(
                              "w-12 h-12 rounded-2xl flex items-center justify-center border-2 shrink-0 transition-colors",
                              stage.completed ? "bg-emerald-500 border-emerald-500 text-primary-foreground" :
                              stage.active ? "bg-primary border-primary text-primary-foreground" :
                              "bg-background border-border text-muted-foreground"
                            )}>
                              {stage.completed ? <CheckCircle2 className="w-6 h-6" /> : <span className="font-bold">{i + 1}</span>}
                            </div>
                            <div>
                              <h4 className="text-xl font-bold">{stage.name}</h4>
                              {stage.completed && <p className="text-xs text-emerald-600 font-bold mt-1">Selesai pada {stage.date}</p>}
                              {stage.active && <p className="text-xs text-primary font-bold mt-1 animate-pulse">Sedang Berlangsung</p>}
                            </div>
                          </div>
                          {stage.active && (
                            <div className="text-right">
                              <span className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Durasi</span>
                              <span className="text-xl font-mono font-bold">14:22:04</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>
    </div>
  );
}
