"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  FileCheck, 
  Users, 
  BarChart3, 
  AlertCircle, 
  ArrowUpRight, 
  Search,
  Filter,
  MoreVertical,
  Check,
  X,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { analyticsService } from "@/services/analytics.service";

export default function AdminDashboardPage() {
  const [metrics, setMetrics] = useState<any>(null);
  const [bottlenecks, setBottlenecks] = useState<any>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [metricsData, bottlenecksData] = await Promise.all([
          analyticsService.getDashboardMetrics(),
          analyticsService.getBottlenecks()
        ]);
        setMetrics(metricsData);
        setBottlenecks(bottlenecksData);
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
      label: "Total Pengajuan", 
      value: metrics?.totalApplications || "0", 
      icon: BarChart3, 
      color: "text-primary", 
      bg: "bg-primary/10",
      change: "+12%" 
    },
    { 
      label: "Butuh Validasi", 
      value: metrics?.pendingCount || "0", 
      icon: FileCheck, 
      color: "text-amber-500", 
      bg: "bg-amber-500/10",
      change: "+5%" 
    },
    { 
      label: "SLA Overdue", 
      value: metrics?.overdueCount || "0", 
      icon: AlertCircle, 
      color: "text-rose-500", 
      bg: "bg-rose-500/10",
      change: "-2%" 
    },
    { 
      label: "Tingkat Persetujuan", 
      value: metrics?.approvalRate ? `${metrics.approvalRate}%` : "0%", 
      icon: Check, 
      color: "text-emerald-500", 
      bg: "bg-emerald-500/10",
      change: "+3%" 
    },
  ];

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 bg-indigo-100 text-primary text-[10px] font-bold rounded uppercase tracking-wider">Internal Portal</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Admin Console</h1>
            <p className="text-muted-foreground mt-1">Monitoring dan validasi perizinan FlowGov secara real-time.</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="rounded-xl">
              <Filter className="w-4 h-4 mr-2" /> Filter
            </Button>
            <Button className="rounded-xl bg-primary hover:bg-primary/90 shadow-lg shadow-sm">
              Generate Report
            </Button>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className={cn("p-2 rounded-xl", stat.bg)}>
                      <stat.icon className={cn("w-6 h-6", stat.color)} />
                    </div>
                    <div className={cn(
                      "flex items-center text-xs font-bold",
                      stat.change.startsWith('+') ? "text-emerald-500" : "text-rose-500"
                    )}>
                      {stat.change} <ArrowUpRight className="w-3 h-3 ml-1" />
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-3xl font-bold tracking-tight">{stat.value}</span>
                    <span className="text-sm font-medium text-muted-foreground mt-1">{stat.label}</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main List */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 pb-6 mb-6">
                <div>
                  <CardTitle>Analisis Hambatan (Bottlenecks)</CardTitle>
                  <CardDescription>Visualisasi durasi rata-rata per tahapan kerja.</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {bottlenecks.map((item: any, i: number) => (
                  <div key={item.stage} className="space-y-2">
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-xs font-bold uppercase text-muted-foreground">{item.stage.replace('_', ' ')}</p>
                        <p className="text-lg font-bold">{item.avgDurationHours.toFixed(1)} Jam</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-medium text-muted-foreground">Volume</p>
                        <p className="text-sm font-bold">{item.count} Berkas</p>
                      </div>
                    </div>
                    <div className="h-3 w-full bg-muted rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min((item.avgDurationHours / 48) * 100, 100)}%` }}
                        className={cn(
                          "h-full rounded-full",
                          item.avgDurationHours > 24 ? "bg-rose-500" : 
                          item.avgDurationHours > 12 ? "bg-amber-500" : "bg-primary"
                        )} 
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Stats */}
          <div className="space-y-6">
            <Card className="border-primary/20 shadow-md shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Kepatuhan SLA</CardTitle>
                <CardDescription>Status kecepatan pelayanan kumulatif.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  {[
                    { label: "On-Time", value: metrics?.slaStats?.onTimePercentage || 0, color: "bg-emerald-500" },
                    { label: "Delayed/Warning", value: metrics?.slaStats?.warningCount || 0, color: "bg-amber-500", isAbsolute: true },
                    { label: "Overdue", value: metrics?.slaStats?.overduePercentage || 0, color: "bg-rose-500" },
                  ].map((sla) => (
                    <div key={sla.label} className="space-y-2">
                      <div className="flex justify-between text-xs font-bold uppercase">
                        <span>{sla.label}</span>
                        <span>{sla.isAbsolute ? sla.value : `${sla.value}%`}</span>
                      </div>
                      <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: sla.isAbsolute ? '10%' : `${sla.value}%` }}
                          className={cn("h-full", sla.color)} 
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
