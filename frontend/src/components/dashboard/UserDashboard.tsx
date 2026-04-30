"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  FileText, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  ArrowUpRight, 
  Activity,
  Plus,
  Loader2
} from "lucide-react";
import Link from "next/link";
import { cn, formatCurrency } from "@/lib/utils";
import { permitService, PermitApplication } from "@/services/permit.service";
import { useAuth } from "@/contexts/AuthContext";

export function UserDashboard() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<PermitApplication[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await permitService.getApplications({ limit: 5 });
        setApplications(response.data);
      } catch (error) {
        console.error("Failed to fetch applications", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const stats = [
    { 
      label: "Izin Aktif", 
      value: applications.filter(a => !['APPROVED', 'REJECTED', 'DRAFT'].includes(a.status)).length.toString(), 
      icon: Activity, color: "text-blue-500", bg: "bg-blue-500/10" 
    },
    { 
      label: "Selesai", 
      value: applications.filter(a => a.status === 'APPROVED').length.toString(), 
      icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500/10" 
    },
    { 
      label: "Menunggu", 
      value: applications.filter(a => a.status === 'DOCUMENT_CHECK').length.toString(), 
      icon: Clock, color: "text-amber-500", bg: "bg-amber-500/10" 
    },
    { 
      label: "Draft", 
      value: applications.filter(a => a.status === 'DRAFT').length.toString(), 
      icon: FileText, color: "text-slate-500", bg: "bg-slate-500/10" 
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
    <div className="max-w-7xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Selamat Datang, {user?.name || 'User'}!</h1>
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
            <Card className="hover:shadow-md transition-shadow border-border/50">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={cn("p-2 rounded-xl", stat.bg)}>
                    <stat.icon className={cn("w-6 h-6", stat.color)} />
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
          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 pb-6 mb-6">
              <div>
                <CardTitle>Pengajuan Terkini</CardTitle>
                <CardDescription>Daftar pengajuan terbaru Anda.</CardDescription>
              </div>
              <Link href="/dashboard/applications">
                <Button variant="ghost" size="sm" className="text-primary font-bold">Lihat Semua</Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-0 px-0 pb-0">
              {applications.length > 0 ? (
                applications.map((sub) => (
                  <Link 
                    key={sub.id} 
                    href={`/dashboard/applications/${sub.id}`}
                    className="flex items-center justify-between p-4 px-6 hover:bg-muted/30 transition-colors group cursor-pointer border-b border-border/50 last:border-0"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center">
                        <FileText className="w-6 h-6 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-bold">{sub.referenceNumber || 'Draft Application'}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
                          {sub.permitType.replace('_', ' ')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="hidden md:block text-right">
                        <p className="text-sm font-medium">{new Date(sub.createdAt).toLocaleDateString('id-ID')}</p>
                        <span className={cn(
                          "text-[10px] font-bold uppercase px-2 py-0.5 rounded-full mt-1 inline-block",
                          ['APPROVED'].includes(sub.status) ? "bg-emerald-100 text-emerald-600" :
                          ['REJECTED'].includes(sub.status) ? "bg-rose-100 text-rose-600" :
                          ['DRAFT'].includes(sub.status) ? "bg-slate-100 text-slate-600" :
                          "bg-amber-100 text-amber-600"
                        )}>
                          {sub.status.replace('_', ' ')}
                        </span>
                      </div>
                      <ArrowUpRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
                    </div>
                  </Link>
                ))
              ) : (
                <div className="py-20 text-center text-muted-foreground">
                  <p>Anda belum memiliki pengajuan.</p>
                  <Link href="/submit">
                    <Button variant="link" className="mt-2">Mulai pengajuan pertama Anda</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-primary to-blue-700 text-white overflow-hidden relative border-none shadow-xl shadow-primary/20">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl" />
            <CardContent className="p-10 relative z-10">
              <div className="max-w-lg">
                <h3 className="text-2xl font-bold mb-4">Butuh Bantuan Ahli?</h3>
                <p className="text-blue-100 mb-8 leading-relaxed">
                  Kami menyediakan layanan asistensi teknis untuk membantu Anda dalam proses verifikasi dokumen dan pemetaan lahan yang lebih kompleks.
                </p>
                <Button className="bg-white text-primary hover:bg-white/90 rounded-xl font-bold">
                  Hubungi Konsultan
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Informasi Pajak & Biaya</CardTitle>
              <CardDescription>Rangkuman kewajiban pembayaran Anda.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/50 border border-border/50">
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground uppercase font-bold">Tagihan Aktif</span>
                  <span className="text-xl font-bold">
                    {formatCurrency(applications.reduce((acc, app) => acc + (app.totalCost || 0), 0))}
                  </span>
                </div>
                <Button size="sm" variant="outline" className="rounded-lg h-8 text-xs">Detail</Button>
              </div>
              
              <div className="space-y-4">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Panduan Cepat</p>
                {[
                  "Cara verifikasi KTP via OCR",
                  "Dokumen yang diperlukan untuk PBG",
                  "Alur pembayaran retribusi",
                  "Masa berlaku izin usaha"
                ].map((guide, i) => (
                  <div key={i} className="flex gap-3 text-sm group cursor-pointer hover:text-primary transition-colors">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                    <p>{guide}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
