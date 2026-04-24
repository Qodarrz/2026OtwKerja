"use client";

import { motion } from "framer-motion";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  FileText, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  ArrowUpRight, 
  Activity,
  Plus
} from "lucide-react";
import Link from "next/link";
import { cn, formatCurrency } from "@/lib/utils";

const stats = [
  { label: "Izin Aktif", value: "3", icon: Activity, color: "text-blue-500", bg: "bg-blue-500/10" },
  { label: "Selesai", value: "12", icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  { label: "Menunggu", value: "2", icon: Clock, color: "text-amber-500", bg: "bg-amber-500/10" },
  { label: "Ditolak", value: "0", icon: XCircle, color: "text-rose-500", bg: "bg-rose-500/10" },
];

const recentSubmissions = [
  { id: "PBG-2024-001", title: "Rumah Tinggal Bp. Budi", status: "In Progress", date: "24 Apr 2024", type: "Residensial" },
  { id: "PBG-2024-002", title: "Ruko Thamrin", status: "Completed", date: "15 Apr 2024", type: "Komersial" },
  { id: "PBG-2023-098", title: "Gudang Cakung", status: "Pending", date: "10 Apr 2024", type: "Industri" },
];

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-background pt-32 pb-20 px-6">
      <Navbar />
      
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Selamat Datang, Budi!</h1>
            <p className="text-muted-foreground mt-1">Kelola perizinan dan pantau status pengajuan Anda.</p>
          </div>
          <Link href="/submit">
            <Button className="rounded-xl shadow-lg">
              <Plus className="w-4 h-4 mr-2" />
              Buat Pengajuan Baru
            </Button>
          </Link>
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
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className={cn("p-2 rounded-xl", stat.bg)}>
                      <stat.icon className={cn("w-6 h-6", stat.color)} />
                    </div>
                    <span className="text-xs font-bold text-muted-foreground uppercase">Live</span>
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
                  <CardTitle>Pengajuan Terkini</CardTitle>
                  <CardDescription>Daftar 3 pengajuan terakhir yang Anda buat.</CardDescription>
                </div>
                <Button variant="ghost" size="sm" className="text-primary font-bold">Lihat Semua</Button>
              </CardHeader>
              <CardContent className="space-y-4 px-0">
                {recentSubmissions.map((sub, i) => (
                  <div 
                    key={sub.id} 
                    className="flex items-center justify-between p-4 px-6 hover:bg-muted/30 transition-colors group cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center">
                        <FileText className="w-6 h-6 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-bold">{sub.title}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
                          {sub.id} • {sub.type}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="hidden md:block text-right">
                        <p className="text-sm font-medium">{sub.date}</p>
                        <span className={cn(
                          "text-[10px] font-bold uppercase px-2 py-0.5 rounded-full mt-1 inline-block",
                          sub.status === "In Progress" ? "bg-blue-100 text-blue-600" :
                          sub.status === "Completed" ? "bg-emerald-100 text-emerald-600" :
                          "bg-amber-100 text-amber-600"
                        )}>
                          {sub.status}
                        </span>
                      </div>
                      <ArrowUpRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-indigo-600 to-purple-700 text-white overflow-hidden relative">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl" />
              <CardContent className="p-10 relative z-10">
                <div className="max-w-lg">
                  <h3 className="text-2xl font-bold mb-4">Butuh Bantuan Ahli?</h3>
                  <p className="text-indigo-100 mb-8 leading-relaxed">
                    Kami menyediakan layanan asistensi teknis untuk membantu Anda dalam proses verifikasi dokumen dan pemetaan lahan yang lebih kompleks.
                  </p>
                  <Button className="bg-white text-indigo-600 hover:bg-white/90 rounded-xl font-bold">
                    Hubungi Konsultan
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Info */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Informasi Pajak & NJOP</CardTitle>
                <CardDescription>Rangkuman kewajiban pajak Anda.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/50">
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground uppercase font-bold">Tagihan Aktif</span>
                    <span className="text-xl font-bold">{formatCurrency(12500000)}</span>
                  </div>
                  <Button size="sm" variant="outline" className="rounded-lg h-8 text-xs">Detail</Button>
                </div>
                
                <div className="space-y-4">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Aktivitas Akun</p>
                  {[
                    "Login terdeteksi dari Jakarta",
                    "Pengajuan PBG-2024-001 disetujui sistem",
                    "Pembaruan profil berhasil"
                  ].map((act, i) => (
                    <div key={i} className="flex gap-3 text-sm">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                      <p>{act}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}
