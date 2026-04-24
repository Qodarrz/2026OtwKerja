"use client";

import { motion } from "framer-motion";
import { Navbar } from "@/components/layout/Navbar";
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
  X
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";

const adminStats = [
  { label: "Total Pengajuan", value: "1,284", icon: BarChart3, color: "text-indigo-500", bg: "bg-indigo-500/10" },
  { label: "Butuh Validasi", value: "42", icon: FileCheck, color: "text-amber-500", bg: "bg-amber-500/10" },
  { label: "User Aktif", value: "856", icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
  { label: "Laporan Konflik", value: "5", icon: AlertCircle, color: "text-rose-500", bg: "bg-rose-500/10" },
];

const pendingApprovals = [
  { id: "APP-2024-088", user: "Andi Wijaya", type: "IMB Residensial", date: "2 jam lalu", priority: "High" },
  { id: "APP-2024-089", user: "PT. Maju Bersama", type: "PBG Komersial", date: "4 jam lalu", priority: "Medium" },
  { id: "APP-2024-090", user: "Siti Aminah", type: "IMB Residensial", date: "1 hari lalu", priority: "Low" },
];

export default function AdminDashboardPage() {
  return (
    <main className="min-h-screen bg-background pt-32 pb-20 px-6">
      <Navbar />
      
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 bg-indigo-100 text-indigo-600 text-[10px] font-bold rounded uppercase tracking-wider">Internal Portal</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Admin Console</h1>
            <p className="text-muted-foreground mt-1">Monitoring dan validasi perizinan FlowGov.</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="rounded-xl">
              <Filter className="w-4 h-4 mr-2" /> Filter
            </Button>
            <Button className="rounded-xl bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200">
              Generate Report
            </Button>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {adminStats.map((stat, i) => (
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
                    <div className="flex items-center text-emerald-500 text-xs font-bold">
                      +12% <ArrowUpRight className="w-3 h-3 ml-1" />
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
                  <CardTitle>Antrian Validasi</CardTitle>
                  <CardDescription>Segera tinjau berkas yang masuk untuk menjaga SLA.</CardDescription>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input 
                    placeholder="Cari ID/User..." 
                    className="pl-9 pr-4 py-2 bg-muted/50 border-none rounded-lg text-sm focus:ring-1 ring-primary outline-none"
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-2 px-0">
                {pendingApprovals.map((app, i) => (
                  <div 
                    key={app.id} 
                    className="flex items-center justify-between p-4 px-6 hover:bg-muted/30 transition-colors group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center font-bold text-xs">
                        {app.id.split('-')[2]}
                      </div>
                      <div>
                        <p className="font-bold">{app.user}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {app.type} • {app.date}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "text-[10px] font-bold uppercase px-2 py-0.5 rounded-full",
                        app.priority === "High" ? "bg-rose-100 text-rose-600" :
                        app.priority === "Medium" ? "bg-amber-100 text-amber-600" :
                        "bg-blue-100 text-blue-600"
                      )}>
                        {app.priority}
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-emerald-600 hover:bg-emerald-50">
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-rose-600 hover:bg-rose-50">
                          <X className="w-4 h-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Distribusi Geografis</CardTitle>
                <CardDescription>Konsentrasi permohonan berdasarkan wilayah.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[250px] bg-muted/50 rounded-2xl flex items-center justify-center border-2 border-dashed border-border">
                  <div className="text-center">
                    <BarChart3 className="w-10 h-10 mx-auto text-muted-foreground/50 mb-2" />
                    <p className="text-sm text-muted-foreground">Peta Heatmap Wilayah</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Stats */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Kepatuhan SLA</CardTitle>
                <CardDescription>Status kecepatan pelayanan.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  {[
                    { label: "On-Time", value: 88, color: "bg-emerald-500" },
                    { label: "Delayed", value: 8, color: "bg-amber-500" },
                    { label: "Overdue", value: 4, color: "bg-rose-500" },
                  ].map((sla) => (
                    <div key={sla.label} className="space-y-2">
                      <div className="flex justify-between text-xs font-bold uppercase">
                        <span>{sla.label}</span>
                        <span>{sla.value}%</span>
                      </div>
                      <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${sla.value}%` }}
                          className={cn("h-full", sla.color)} 
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t border-border">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Sistem mendeteksi lonjakan pengajuan di wilayah **Jakarta Selatan**. Rekomendasi: Penambahan validator lapangan.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}
