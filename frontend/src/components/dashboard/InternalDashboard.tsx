"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  FileText, 
  Clock, 
  ArrowUpRight, 
  Filter,
  Search,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Calendar
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { permitService } from "@/services/permit.service";
import { useAuth } from "@/contexts/AuthContext";
import { Role } from "@/types/auth";

export function InternalDashboard() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await permitService.getStaffTasks();
        setTasks(data);
      } catch (error) {
        console.error("Failed to fetch staff tasks", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const getRoleLabel = () => {
    if (user?.roles.includes(Role.DOCUMENT_VALIDATOR)) return "Document Validator";
    if (user?.roles.includes(Role.FIELD_INSPECTOR)) return "Field Inspector";
    if (user?.roles.includes(Role.LEGALIZER)) return "Legalizer";
    return "Staff";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 bg-sky-100 text-sky-600 text-[10px] font-bold rounded uppercase tracking-wider">
              {getRoleLabel()} Portal
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Antrean Berkas</h1>
          <p className="text-muted-foreground mt-1">Kelola dan validasi pengajuan perizinan yang masuk.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Cari No. Referensi..." 
              className="pl-10 pr-4 py-2 bg-muted/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 w-64"
            />
          </div>
          <Button variant="outline" className="rounded-xl">
            <Filter className="w-4 h-4 mr-2" /> Filter
          </Button>
        </div>
      </header>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <Card className="bg-sky-600 text-white border-none shadow-lg shadow-sky-200">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sky-100 text-xs font-bold uppercase tracking-wider mb-1">Total Antrean</p>
                <h3 className="text-3xl font-bold">{tasks.length}</h3>
              </div>
              <div className="p-2 bg-white/20 rounded-xl">
                <FileText className="w-6 h-6" />
              </div>
            </div>
            <p className="text-[10px] text-sky-100/80 mt-4 uppercase tracking-widest font-bold">Menunggu Tindakan Anda</p>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-muted-foreground text-xs font-bold uppercase tracking-wider mb-1">Butuh Segera (SLA Warning)</p>
                <h3 className="text-3xl font-bold text-amber-600">{tasks.filter(t => t.isPendingLong).length}</h3>
              </div>
              <div className="p-2 bg-amber-100 rounded-xl">
                <Clock className="w-6 h-6 text-amber-600" />
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground mt-4 uppercase tracking-widest font-bold">Tertahan {">"} 7 Hari</p>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-muted-foreground text-xs font-bold uppercase tracking-wider mb-1">Target Hari Ini</p>
                <h3 className="text-3xl font-bold text-emerald-600">5</h3>
              </div>
              <div className="p-2 bg-emerald-100 rounded-xl">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground mt-4 uppercase tracking-widest font-bold">Berdasarkan SLA Rata-rata</p>
          </CardContent>
        </Card>
      </div>

      {/* Task Table */}
      <Card className="border-border/50">
        <CardHeader className="border-b border-border/50 pb-6">
          <CardTitle>Daftar Tugas</CardTitle>
          <CardDescription>Pilih berkas untuk memulai proses validasi.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-muted/30 text-[10px] font-bold uppercase tracking-widest text-muted-foreground border-b border-border/50">
                <tr>
                  <th className="px-6 py-4">Informasi Pemohon</th>
                  <th className="px-6 py-4">Tipe Izin</th>
                  <th className="px-6 py-4">Tanggal Masuk</th>
                  <th className="px-6 py-4">Status SLA</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {tasks.length > 0 ? (
                  tasks.map((task) => (
                    <tr key={task.id} className="hover:bg-muted/20 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-sm">{task.applicant?.name || 'Unknown'}</span>
                          <span className="text-xs text-muted-foreground uppercase">{task.referenceNumber}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-medium px-2 py-1 bg-muted rounded-lg border border-border/50">
                          {task.permitType.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(task.submittedAt).toLocaleDateString('id-ID')}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                           <div className={cn(
                             "w-2 h-2 rounded-full",
                             task.isPendingLong ? "bg-rose-500 animate-pulse" : "bg-emerald-500"
                           )} />
                           <span className={cn(
                             "text-xs font-bold",
                             task.isPendingLong ? "text-rose-600" : "text-emerald-600"
                           )}>
                             {task.daysPending} Hari Tertahan
                           </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link href={`/dashboard/validate/${task.id}`}>
                          <Button size="sm" className="rounded-lg bg-sky-600 hover:bg-sky-700 shadow-sm">
                            Proses <ArrowUpRight className="ml-1 w-3 h-3" />
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-20 text-center text-muted-foreground">
                      <div className="flex flex-col items-center">
                        <CheckCircle2 className="w-12 h-12 text-emerald-500/20 mb-4" />
                        <p className="font-medium">Kerja Bagus! Tidak ada antrean berkas saat ini.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
