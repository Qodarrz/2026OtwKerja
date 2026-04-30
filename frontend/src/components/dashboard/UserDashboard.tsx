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
      icon: Activity, color: "text-sky-600", bg: "bg-sky-50" 
    },
    { 
      label: "Selesai", 
      value: applications.filter(a => a.status === 'APPROVED').length.toString(), 
      icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" 
    },
    { 
      label: "Menunggu", 
      value: applications.filter(a => a.status === 'DOCUMENT_CHECK').length.toString(), 
      icon: Clock, color: "text-amber-600", bg: "bg-amber-50" 
    },
    { 
      label: "Draft", 
      value: applications.filter(a => a.status === 'DRAFT').length.toString(), 
      icon: FileText, color: "text-slate-500", bg: "bg-slate-50" 
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
             <div className="p-1.5 bg-primary/10 rounded-lg">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
             </div>
             <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-muted-foreground">Portal Publik</span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">Halo, {user?.name?.split(' ')[0]}!</h1>
          <p className="text-muted-foreground font-medium">Pantau progres perizinan dan kewajiban administrasi Anda di sini.</p>
        </div>
        <Link href="/submit">
          <Button className="rounded-xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 font-extrabold h-11 px-8 transition-all active:scale-95">
            <Plus className="w-5 h-5 mr-2" />
            Buat Pengajuan Baru
          </Button>
        </Link>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="border-none shadow-sm bg-white overflow-hidden group hover:shadow-md transition-all">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={cn("p-3 rounded-2xl transition-transform group-hover:scale-110 duration-300", stat.bg)}>
                    <stat.icon className={cn("w-6 h-6", stat.color)} />
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="text-3xl font-black tracking-tight text-slate-900">{stat.value}</span>
                  <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">{stat.label}</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card className="border-none shadow-sm bg-white overflow-hidden">
            <div className="p-8 border-b border-slate-50 flex items-center justify-between">
               <div>
                  <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Pengajuan Terkini</h2>
                  <p className="text-sm text-muted-foreground font-medium">Daftar pengajuan terbaru yang sedang diproses.</p>
               </div>
               <Link href="/dashboard/applications">
                 <Button variant="ghost" size="sm" className="text-primary font-black uppercase text-[10px] tracking-widest hover:bg-primary/5">Lihat Semua</Button>
               </Link>
            </div>
            <CardContent className="p-0">
              {applications.length > 0 ? (
                <div className="divide-y divide-slate-50">
                  {applications.map((sub) => (
                    <Link 
                      key={sub.id} 
                      href={`/dashboard/applications/${sub.id}`}
                      className="flex items-center justify-between p-6 hover:bg-slate-50/50 transition-colors group cursor-pointer"
                    >
                      <div className="flex items-center gap-5">
                        <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center group-hover:bg-white group-hover:shadow-sm transition-all">
                          <FileText className="w-6 h-6 text-slate-400 group-hover:text-primary transition-colors" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">{sub.referenceNumber || 'DRAFT'}</p>
                          <p className="font-extrabold text-slate-900 tracking-tight">{sub.permitType.replace('_', ' ')}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-8">
                        <div className="hidden md:flex flex-col items-end">
                          <p className="text-xs font-bold text-slate-400">{new Date(sub.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</p>
                          <span className={cn(
                            "text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg mt-1.5 border",
                            ['APPROVED'].includes(sub.status) ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                            ['REJECTED'].includes(sub.status) ? "bg-rose-50 text-rose-600 border-rose-100" :
                            ['DRAFT'].includes(sub.status) ? "bg-slate-100 text-slate-600 border-slate-200" :
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
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                     <FileText className="w-8 h-8 text-slate-200" />
                  </div>
                  <p className="font-extrabold text-slate-900 tracking-tight">Belum Ada Pengajuan</p>
                  <p className="text-sm text-muted-foreground mt-1 mb-8">Mulai perizinan pertama Anda hari ini.</p>
                  <Link href="/submit">
                    <Button variant="outline" className="rounded-xl border-slate-200 font-bold">Mulai Sekarang</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-primary to-blue-700 text-white overflow-hidden relative border-none shadow-2xl shadow-primary/20">
            <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl opacity-50" />
            <CardContent className="p-12 relative z-10">
              <div className="max-w-md space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 rounded-full text-[10px] font-black uppercase tracking-widest">
                  Layanan Bantuan
                </div>
                <h3 className="text-3xl font-black leading-tight tracking-tight">Butuh Konsultasi Terkait Tata Ruang?</h3>
                <p className="text-blue-100 font-medium leading-relaxed">
                  Tim ahli kami siap membantu Anda memverifikasi dokumen teknis dan zonasi lahan sebelum diajukan ke sistem.
                </p>
                <Button className="bg-white text-primary hover:bg-white/90 rounded-xl font-black px-8 h-12 shadow-xl shadow-black/10 transition-all active:scale-95">
                  Hubungi Konsultan Ahli
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          <Card className="border-none shadow-sm bg-white overflow-hidden">
            <div className="p-8 border-b border-slate-50">
               <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Kewajiban Pembayaran</h2>
               <p className="text-sm text-muted-foreground font-medium">Tagihan retribusi perizinan aktif.</p>
            </div>
            <CardContent className="p-8 space-y-8">
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 space-y-4">
                <div className="flex justify-between items-start">
                   <div className="p-2.5 bg-white rounded-xl shadow-sm border border-slate-100 text-primary">
                      <CreditCard className="w-5 h-5" />
                   </div>
                   <span className="text-[9px] font-black uppercase tracking-[0.2em] text-primary">Tagihan Aktif</span>
                </div>
                <div className="space-y-1">
                  <p className="text-3xl font-black text-slate-900 tracking-tighter leading-none">
                    {formatCurrency(applications.reduce((acc, app) => acc + (app.totalCost || 0), 0))}
                  </p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Akumulatif</p>
                </div>
                <Button size="sm" className="w-full rounded-xl bg-primary hover:bg-primary/90 font-black h-10 mt-4 shadow-md shadow-primary/10 transition-all">
                  Bayar Sekarang
                </Button>
              </div>
              
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                   <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Panduan Cepat</p>
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
                      <div className="w-6 h-6 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 group-hover:bg-primary/5 group-hover:border-primary/20 transition-all duration-300">
                        <History className="w-3 h-3 text-slate-300 group-hover:text-primary transition-colors" />
                      </div>
                      <p className="text-sm font-bold text-slate-600 group-hover:text-slate-900 transition-colors leading-tight">{guide}</p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none bg-primary text-white overflow-hidden shadow-2xl shadow-primary/20">
             <CardContent className="p-8">
               <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-sm font-black uppercase tracking-widest leading-none">Status KTP</p>
               </div>
               <div className="space-y-4">
                  <h4 className="text-2xl font-black leading-tight tracking-tight">KTP Terverifikasi</h4>
                  <p className="text-xs text-blue-100 font-medium leading-relaxed">
                    Identitas Anda telah tervalidasi melalui sistem OCR. Anda dapat melanjutkan seluruh proses perizinan tanpa hambatan.
                  </p>
               </div>
             </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
