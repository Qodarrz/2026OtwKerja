"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  FileCheck, 
  BarChart3, 
  AlertCircle, 
  ArrowUpRight, 
  Filter,
  Check,
  Loader2,
  TrendingUp,
  Target,
  Zap,
  ShieldCheck
} from "lucide-react";
import { cn } from "@/lib/utils";
import { analyticsService } from "@/services/analytics.service";
import { 
  ShieldAlert, 
  History, 
  User, 
  Activity,
  Cpu
} from "lucide-react";

export function AdminDashboardView() {
  const [metrics, setMetrics] = useState<any>(null);
  const [bottlenecks, setBottlenecks] = useState<any>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [metricsData, bottlenecksData, auditLogsData] = await Promise.all([
          analyticsService.getDashboardMetrics(),
          analyticsService.getBottlenecks(),
          analyticsService.getAuditLogs(5)
        ]);
        setMetrics(metricsData);
        setBottlenecks(bottlenecksData);
        setAuditLogs(auditLogsData);
      } catch (error) {
        console.error("Failed to fetch admin data", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const stats = [
    { 
      label: "Impact Score", 
      value: metrics?.impactScore ? `${metrics.impactScore}%` : "0%", 
      icon: Cpu, 
      color: "text-primary", 
      bg: "bg-indigo-50",
      change: "+8%",
      description: "Komposit efisiensi" 
    },
    { 
      label: "On-Time Rate", 
      value: metrics?.onTimePercentage ? `${metrics.onTimePercentage}%` : "0%", 
      icon: Zap, 
      color: "text-emerald-600", 
      bg: "bg-emerald-50",
      change: "+3%",
      description: "Kepatuhan SLA"
    },
    { 
      label: "SLA Overdue", 
      value: metrics?.overdueCount || "0", 
      icon: ShieldAlert, 
      color: "text-rose-600", 
      bg: "bg-rose-50",
      change: "-2%",
      description: "Butuh atensi segera"
    },
    { 
      label: "Efisiensi", 
      value: metrics?.efficiency ? `${metrics.efficiency}%` : "0%", 
      icon: Activity, 
      color: "text-primary", 
      bg: "bg-sky-50",
      change: "+5%",
      description: "Kecepatan proses"
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-2">
             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
             <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-muted-foreground">Sistem Aktif & Terpantau</span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground">Admin Console</h1>
          <p className="text-muted-foreground font-medium">Monitoring performa birokrasi dan kendali Service Level Agreement.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="rounded-xl border-border bg-card font-bold h-11 px-6 hover:bg-accent transition-all">
            <Filter className="w-4 h-4 mr-2 text-muted-foreground" /> Filter Data
          </Button>
          <Button className="rounded-xl bg-primary hover:bg-primary/90 shadow-lg shadow-sm font-bold h-11 px-6 transition-all active:scale-95">
            Unduh Laporan
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="border-none shadow-sm bg-card overflow-hidden group hover:shadow-md transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className={cn("p-3 rounded-2xl transition-transform group-hover:scale-110 duration-300", stat.bg)}>
                    <stat.icon className={cn("w-6 h-6", stat.color)} />
                  </div>
                  <div className={cn(
                    "flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold",
                    stat.change.startsWith('+') ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                  )}>
                    {stat.change}
                    <TrendingUp className={cn("w-3 h-3", !stat.change.startsWith('+') && "rotate-180")} />
                  </div>
                </div>
                <div className="space-y-1">
                  <h3 className="text-3xl font-extrabold tracking-tight text-foreground">{stat.value}</h3>
                  <p className="text-sm font-bold text-muted-foreground">{stat.label}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold pt-2 border-t border-slate-50 mt-4">{stat.description}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card className="border-none shadow-sm bg-card overflow-hidden">
            <div className="p-8 border-b border-slate-50 flex items-center justify-between">
               <div>
                  <h2 className="text-xl font-extrabold text-foreground tracking-tight">Analisis Bottleneck</h2>
                  <p className="text-sm text-muted-foreground font-medium">Visualisasi titik hambatan pada alur kerja.</p>
               </div>
               <div className="p-2 bg-muted rounded-xl">
                  <Target className="w-5 h-5 text-muted-foreground" />
               </div>
            </div>
            <CardContent className="p-8 space-y-8">
              {bottlenecks.map((item: any) => (
                <div key={item.stage} className="space-y-3 group">
                  <div className="flex justify-between items-end">
                    <div className="space-y-1">
                      <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-muted-foreground">Unit Kerja</p>
                      <p className="text-md font-extrabold text-foreground">{item.stage.replace('_', ' ')}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-black text-foreground leading-none">{(item.avgDurationHours || 0).toFixed(1)} <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Jam</span></p>
                    </div>
                  </div>
                  <div className="h-4 w-full bg-secondary rounded-full overflow-hidden p-1">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(((item.avgDurationHours || 0) / 48) * 100, 100)}%` }}
                      className={cn(
                        "h-full rounded-full shadow-inner transition-all duration-500",
                        (item.avgDurationHours || 0) > 24 ? "bg-primary text-primary-foreground" : 
                        (item.avgDurationHours || 0) > 12 ? "bg-primary text-primary-foreground" : 
                        "bg-primary text-primary-foreground"
                      )} 
                    />
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    <span>Target: 24 Jam</span>
                    <span>Volume: {item.count} Berkas</span>
                  </div>
                </div>
              ))}
              {bottlenecks.length === 0 && (
                <div className="py-20 text-center flex flex-col items-center gap-4">
                  <div className="p-4 bg-muted rounded-full">
                    <Check className="w-8 h-8 text-slate-200" />
                  </div>
                  <p className="text-sm font-bold text-muted-foreground">Belum ada data historis untuk dianalisis.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          <Card className="border-none shadow-sm bg-card overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16" />
            <div className="p-8 border-b border-slate-50">
               <h2 className="text-xl font-extrabold text-foreground tracking-tight">Kepatuhan SLA</h2>
               <p className="text-sm text-muted-foreground font-medium">Data kumulatif kecepatan layanan.</p>
            </div>
            <CardContent className="p-8 space-y-8">
              <div className="space-y-6">
                {[
                  { label: "Tepat Waktu", value: metrics?.slaStats?.onTimePercentage || 0, color: "bg-emerald-500", text: "text-emerald-600" },
                  { label: "Peringatan", value: metrics?.slaStats?.warningCount || 0, color: "bg-amber-500", text: "text-amber-600", isAbsolute: true },
                  { label: "Terlambat", value: metrics?.slaStats?.overduePercentage || 0, color: "bg-rose-500", text: "text-rose-600" },
                ].map((sla) => (
                  <div key={sla.label} className="space-y-2.5">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">{sla.label}</span>
                      <span className={cn("text-sm font-black", sla.text)}>{sla.isAbsolute ? sla.value : `${sla.value}%`}</span>
                    </div>
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: sla.isAbsolute ? '15%' : `${sla.value}%` }}
                        className={cn("h-full rounded-full shadow-sm", sla.color)} 
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-8 border-t border-border relative z-10">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-1.5 bg-primary/10 rounded-lg">
                    <Zap className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-primary">Rekomendasi Sistem</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                  Tahap <span className="font-extrabold text-foreground">{bottlenecks[0]?.stage?.replace('_', ' ') || 'Verifikasi'}</span> butuh tambahan sumber daya untuk menjaga kestabilan SLA pekan depan.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none bg-background overflow-hidden shadow-lg shadow-sm">
            <CardContent className="p-8">
               <div className="flex items-center justify-between mb-8">
                  <div className="w-12 h-12 rounded-2xl bg-card/10 flex items-center justify-center">
                     <ShieldCheck className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Integritas Log</p>
                    <p className="text-lg font-black text-emerald-400 leading-none mt-1 uppercase">Aktif</p>
                  </div>
               </div>
               
               <div className="space-y-6">
                 <div className="flex items-center gap-2">
                    <History className="w-4 h-4 text-muted-foreground" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Recent Audit Logs</span>
                 </div>
                 
                 <div className="space-y-4">
                    {auditLogs.map((log, i) => (
                      <div key={log.id} className="flex gap-3 items-start border-l-2 border-slate-700 pl-4 py-1">
                        <div className="space-y-1">
                          <p className="text-[10px] font-black text-slate-200 uppercase tracking-tight">{log.action}</p>
                          <p className="text-[10px] text-muted-foreground font-medium leading-none">{new Date(log.createdAt).toLocaleTimeString()}</p>
                        </div>
                      </div>
                    ))}
                 </div>

                 <Button className="w-full bg-card text-foreground hover:bg-secondary font-extrabold rounded-xl h-11 mt-4 border-none transition-all active:scale-95 shadow-lg">
                    Lihat Selengkapnya
                 </Button>
               </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
