"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Clock,
  CheckCircle2,
  ArrowUpRight,
  Activity,
  Plus,
  Loader2,
  Sparkles,
  HelpCircle,
  CreditCard,
  History
} from "lucide-react";
import Link from "next/link";
import { cn, formatCurrency } from "@/lib/utils";
import { permitService, PermitApplication } from "@/services/permit.service";
import { analyticsService } from "@/services/analytics.service";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";

export function UserDashboard() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<PermitApplication[]>([]);
  const [metrics, setMetrics] = useState({
    activeCount: 0,
    approvedCount: 0,
    waitingCount: 0,
    rejectedCount: 0,
    totalCost: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [appsRes, metricsRes] = await Promise.all([
          permitService.getApplications({ limit: 5 }),
          analyticsService.getUserMetrics()
        ]);
        setApplications(appsRes.data);
        setMetrics(metricsRes);
      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const stats = [
    {
      label: "Izin Aktif",
      value: metrics.activeCount.toString(),
      icon: Activity, color: "text-primary", bg: "bg-sky-50"
    },
    {
      label: "Selesai",
      value: metrics.approvedCount.toString(),
      icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50"
    },
    {
      label: "Menunggu",
      value: metrics.waitingCount.toString(),
      icon: Clock, color: "text-amber-600", bg: "bg-amber-50"
    },
    {
      label: "Ditolak",
      value: (metrics.rejectedCount || 0).toString(),
      icon: FileText, color: "text-rose-600", bg: "bg-rose-50"
    },
  ];

  return (
    <div className="space-y-10">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-bold tracking-tight text-foreground">Halo, {user?.name?.split(' ')[0]}!</h1>
          <p className="text-muted-foreground font-medium">Pantau progres perizinan dan kewajiban administrasi Anda di sini.</p>
        </div>
        <Link href="/submit">
          <Button className="rounded-xl bg-primary hover:bg-primary/90 shadow-lg font-bold h-11 px-8 transition-all active:scale-95">
            <Plus className="w-5 h-5 mr-2" />
            Buat Pengajuan Baru
          </Button>
        </Link>
      </header>

      {applications.filter(app => app.status === 'WAITING_FOR_PAYMENT').map(app => (
        <div key={app.id} className="p-6 bg-amber-50 rounded-xl border border-amber-200 shadow-sm flex flex-col md:flex-row gap-4 items-start md:items-center justify-between animate-in fade-in slide-in-from-top-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center shrink-0">
              <CreditCard className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <h3 className="text-amber-900 font-bold text-lg tracking-tight">Menunggu Pembayaran: {formatCurrency(app.totalCost || 0)}</h3>
              <p className="text-amber-700 text-sm font-medium leading-relaxed">Tagihan untuk {app.permitType.replace(/_/g, ' ')} ({app.referenceNumber}) telah terbit. Silakan lakukan pembayaran tunai di Loket PTSP untuk melanjutkan proses legalisasi.</p>
            </div>
          </div>
        </div>
      ))}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="border-none shadow-sm bg-card overflow-hidden">
              <CardContent className="p-6">
                <div className="flex flex-col gap-2">
                  <Skeleton className="w-16 h-8" />
                  <Skeleton className="w-24 h-3 mt-1" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="border-none shadow-sm bg-card overflow-hidden group hover:shadow-md transition-all">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                  </div>
                  <div className="flex flex-col">
                    <span className="text-3xl font-bold tracking-tight text-foreground">{stat.value}</span>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">{stat.label}</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card className="border-none shadow-sm bg-card overflow-hidden">
            <div className="p-8 border-b border-slate-50 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-foreground tracking-tight">Pengajuan Terkini</h2>
                <p className="text-sm text-muted-foreground font-medium">Daftar pengajuan terbaru yang sedang diproses.</p>
              </div>
              <Link href="/dashboard/applications">
                <Button variant="ghost" size="sm" className="text-primary font-bold uppercase text-[10px] tracking-widest hover:bg-primary/5">Lihat Semua</Button>
              </Link>
            </div>
            <CardContent className="p-0">
              {loading ? (
                <div className="divide-y divide-slate-50">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center justify-between p-6">
                      <div className="flex items-center gap-5">
                        <Skeleton className="w-12 h-12 rounded-2xl" />
                        <div className="space-y-2">
                          <Skeleton className="w-24 h-3" />
                          <Skeleton className="w-40 h-5" />
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2 hidden md:flex">
                        <Skeleton className="w-16 h-3" />
                        <Skeleton className="w-20 h-6 rounded-lg mt-1.5" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : applications.length > 0 ? (
                <div className="divide-y divide-slate-50">
                  {applications.map((sub) => (
                    <Link
                      key={sub.id}
                      href={`/dashboard/applications/${sub.id}`}
                      className="flex items-center justify-between p-6 hover:bg-accent/50 transition-colors group cursor-pointer"
                    >
                      <div className="flex items-center gap-5">
                        <div className="w-12 h-12 rounded-2xl bg-muted border border-border flex items-center justify-center group-hover:bg-card group-hover:shadow-sm transition-all">
                          <FileText className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">{sub.referenceNumber || '-'}</p>
                          <p className="font-bold text-foreground tracking-tight">{sub.permitType.replace('_', ' ')}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-8">
                        <div className="hidden md:flex flex-col items-end">
                          <p className="text-xs font-bold text-muted-foreground">{new Date(sub.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</p>
                          <span className={cn(
                            "text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg mt-1.5 border",
                            ['APPROVED'].includes(sub.status) ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                              ['REJECTED'].includes(sub.status) ? "bg-rose-50 text-rose-600 border-rose-100" :
                                "bg-amber-50 text-amber-600 border-amber-100"
                          )}>
                            {sub.status.replace('_', ' ')}
                          </span>
                        </div>
                        <ArrowUpRight className="w-5 h-5 text-slate-300 group-hover:text-primary group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="py-24 text-center">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                    <FileText className="w-8 h-8 text-slate-200" />
                  </div>
                  <p className="font-bold text-foreground tracking-tight">Belum Ada Pengajuan</p>
                  <p className="text-sm text-muted-foreground mt-1 mb-8">Mulai perizinan pertama Anda hari ini.</p>
                  <Link href="/submit">
                    <Button variant="outline" className="rounded-xl border-border font-bold">Mulai Sekarang</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-linear-to-br from-primary to-blue-700 text-primary-foreground overflow-hidden relative border-none shadow-lg">
            <div className="absolute top-0 right-0 w-80 h-80 bg-card/10 rounded-full -mr-32 -mt-32 blur-3xl opacity-50" />
            <CardContent className="p-12 relative z-10">
              <div className="max-w-md space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-card/20 rounded-full text-[10px] font-bold uppercase tracking-widest">
                  Layanan Bantuan
                </div>
                <h3 className="text-3xl font-bold leading-tight tracking-tight">Butuh Konsultasi Terkait Tata Ruang?</h3>
                <p className="text-blue-100 font-medium leading-relaxed">
                  Tim ahli kami siap membantu Anda memverifikasi dokumen teknis dan zonasi lahan sebelum diajukan ke sistem.
                </p>
                <Button className="bg-card text-primary hover:bg-card/90 rounded-xl font-bold px-8 h-12 shadow-md shadow-black/10 transition-all active:scale-95">
                  Hubungi Konsultan Ahli
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          <Card className="border-none shadow-sm bg-card overflow-hidden">
            <div className="p-8 border-b border-slate-50">
              <h2 className="text-xl font-bold text-foreground tracking-tight">Layanan Konsultasi & Retribusi</h2>
              <p className="text-sm text-muted-foreground font-medium">Pembayaran retribusi dilakukan langsung di loket DPMPTSP atau via WhatsApp resmi.</p>
            </div>
            <CardContent className="p-8 space-y-8">
              <div className="p-6 rounded-2xl bg-muted border border-border space-y-4">
                <div className="flex justify-between items-start">
                  <div className="p-2.5 bg-card rounded-xl shadow-sm border border-border text-primary">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-primary">Info Pembayaran</span>
                </div>
                <div className="space-y-1">
                  <p className="text-xl font-bold text-foreground tracking-tighter leading-tight">
                    Bayar di Loket / WA
                  </p>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-relaxed">Silakan hubungi admin untuk menerbitkan kode bayar atau kunjungi kantor pelayanan kami.</p>
                </div>
                <Button
                  size="sm"
                  onClick={() => window.open('https://wa.me/6281234567890', '_blank')}
                  className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-10 mt-4 shadow-md shadow-sm transition-all"
                >
                  Hubungi Admin via WA
                </Button>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Panduan Cepat</p>
                  <HelpCircle className="w-4 h-4 text-slate-300" />
                </div>
                <div className="space-y-4">
                  {[
                    "Cara verifikasi KTP via OCR",
                    "Dokumen wajib untuk PBG/IMB",
                    "Alur pembayaran retribusi",
                    "Masa berlaku izin usaha"
                  ].map((guide, i) => (
                    <div key={i} className="flex gap-4 group cursor-pointer">
                      <div className="w-6 h-6 rounded-lg bg-muted border border-border flex items-center justify-center shrink-0 group-hover:bg-primary/5 group-hover:border-primary/20 transition-all duration-300">
                        <History className="w-3 h-3 text-slate-300 group-hover:text-primary transition-colors" />
                      </div>
                      <p className="text-sm font-bold text-muted-foreground group-hover:text-foreground transition-colors leading-tight">{guide}</p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={cn(
            "border-none overflow-hidden shadow-sm",
            user?.isKtpVerified ? "bg-primary text-primary-foreground" : "bg-amber-500 text-primary-foreground"
          )}>
            <CardContent className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-card/20 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-primary-foreground" />
                </div>
                <p className="text-sm font-bold uppercase tracking-widest leading-none">Status KTP</p>
              </div>
              <div className="space-y-4">
                <h4 className="text-2xl font-bold leading-tight tracking-tight">
                  {user?.isKtpVerified ? "KTP Terverifikasi" : "KTP Belum Verifikasi"}
                </h4>
                <p className="text-xs text-blue-100 font-medium leading-relaxed">
                  {user?.isKtpVerified
                    ? "Identitas Anda telah tervalidasi melalui sistem OCR. Anda dapat melanjutkan seluruh proses perizinan tanpa hambatan."
                    : "Harap verifikasi KTP Anda untuk dapat mengajukan perizinan secara penuh di platform FlowGov."}
                </p>
                {!user?.isKtpVerified && (
                  <Link href="/dashboard/profile">
                    <Button className="w-full bg-card text-amber-600 hover:bg-card/90 rounded-xl font-bold mt-4">
                      Verifikasi Sekarang
                    </Button>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
