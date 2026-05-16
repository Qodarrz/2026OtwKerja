"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  FileText, 
  Clock, 
  ArrowUpRight, 
  Filter,
  Search,
  CheckCircle2,
  Loader2,
  Calendar,
  Inbox,
  LayoutGrid,
  List,
  MoreVertical,
  FileSearch, 
  MapPin, 
  Gavel,
  AlertCircle
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { permitService } from "@/services/permit.service";
import { useAuth } from "@/contexts/AuthContext";
import { Role } from "@/types/auth";
import { SLACountdown } from "./SLACountdown";

export function InternalDashboard() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

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

  const getRoleInfo = () => {
    if (user?.roles.includes(Role.DOCUMENT_VALIDATOR)) return { label: "Document Validator", icon: FileSearch, color: "text-primary", bg: "bg-blue-50" };
    if (user?.roles.includes(Role.FIELD_INSPECTOR)) return { label: "Field Inspector", icon: MapPin, color: "text-primary", bg: "bg-indigo-50" };
    if (user?.roles.includes(Role.LEGALIZER)) return { label: "Legalizer", icon: Gavel, color: "text-purple-600", bg: "bg-purple-50" };
    return { label: "Staff", icon: Inbox, color: "text-muted-foreground", bg: "bg-muted" };
  };

  const roleInfo = getRoleInfo();

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
             <div className={cn("p-1.5 rounded-lg", roleInfo.bg)}>
                <roleInfo.icon className={cn("w-3.5 h-3.5", roleInfo.color)} />
             </div>
             <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-muted-foreground">{roleInfo.label} Portal</span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground">Antrean Berkas</h1>
          <p className="text-muted-foreground font-medium">Prioritaskan pengajuan perizinan berdasarkan tenggat waktu SLA.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative hidden lg:block">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Cari ID atau Pemohon..." 
              className="pl-11 pr-4 py-3 bg-card border border-border rounded-xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-primary/5 w-72 transition-all"
            />
          </div>
          <div className="flex bg-card border border-border rounded-xl p-1 shadow-sm">
            <button 
              onClick={() => setViewMode('list')}
              className={cn("p-2 rounded-lg transition-all", viewMode === 'list' ? "bg-secondary text-foreground shadow-inner" : "text-muted-foreground hover:text-muted-foreground")}
            >
              <List className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setViewMode('grid')}
              className={cn("p-2 rounded-lg transition-all", viewMode === 'grid' ? "bg-secondary text-foreground shadow-inner" : "text-muted-foreground hover:text-muted-foreground")}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
          <Button variant="outline" className="rounded-xl border-border bg-card font-bold h-11 px-6 hover:bg-accent transition-all">
            <Filter className="w-4 h-4 mr-2 text-muted-foreground" /> Filter
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: "Total Antrean", value: tasks.length, icon: FileText, color: "bg-primary", text: "text-primary", bg: "bg-primary/5" },
          { label: "SLA Warning", value: tasks.filter(t => t.slaStatus === 'WARNING').length, icon: Clock, color: "bg-amber-500", text: "text-amber-600", bg: "bg-amber-50/50" },
          { label: "SLA Overdue", value: tasks.filter(t => t.slaStatus === 'OVERDUE').length, icon: AlertCircle, color: "bg-rose-500", text: "text-rose-600", bg: "bg-rose-50/50" },
        ].map((stat, i) => (
          <Card key={stat.label} className="border-none shadow-sm overflow-hidden bg-card">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">{stat.label}</p>
                  <h3 className="text-3xl font-black text-foreground">{stat.value}</h3>
                </div>
                <div className={cn("p-3 rounded-2xl", stat.bg)}>
                  <stat.icon className={cn("w-6 h-6", stat.text)} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-none shadow-sm bg-card overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex items-center justify-between">
           <div>
              <h2 className="text-xl font-extrabold text-foreground tracking-tight">Tugas Yang Perlu Diproses</h2>
              <p className="text-sm text-muted-foreground font-medium">Daftar berkas yang berada pada tahap <span className="text-primary font-bold">{roleInfo.label}</span>.</p>
           </div>
        </div>
        <CardContent className="p-0">
          {viewMode === 'list' ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-muted/50 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground border-b border-border">
                  <tr>
                    <th className="px-8 py-5">Pemohon & No. Ref</th>
                    <th className="px-8 py-5">Tipe Izin</th>
                    <th className="px-8 py-5">Waktu Masuk</th>
                    <th className="px-8 py-5">Urgensi (SLA)</th>
                    <th className="px-8 py-5 text-right">Tindakan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {tasks.length > 0 ? (
                    tasks.map((task) => (
                      <tr key={task.id} className="hover:bg-accent/80 transition-colors group">
                        <td className="px-8 py-6">
                          <div className="flex flex-col gap-1">
                            <span className="font-extrabold text-foreground tracking-tight">{task.applicant?.name || 'Unknown User'}</span>
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{task.referenceNumber}</span>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <span className="inline-flex items-center px-3 py-1 bg-secondary text-muted-foreground text-[10px] font-black uppercase tracking-widest rounded-lg border border-border">
                            {task.permitType.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-8 py-6 text-sm font-bold text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-slate-300" />
                            {new Date(task.submittedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                          </div>
                        </td>
                        <td className="px-8 py-6 w-64">
                          <SLACountdown 
                            remainingHours={task.remainingHours} 
                            maxHours={task.maxHours} 
                            status={task.slaStatus} 
                          />
                        </td>
                        <td className="px-8 py-6 text-right">
                          <Link href={`/dashboard/validate/${task.id}`}>
                            <Button size="sm" className="rounded-xl bg-primary hover:bg-primary/90 font-extrabold h-9 px-5 transition-all shadow-md shadow-sm">
                              Proses <ArrowUpRight className="ml-2 w-3.5 h-3.5" />
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-32 text-center">
                        <div className="flex flex-col items-center gap-4">
                          <div className="p-6 bg-emerald-50 rounded-full">
                            <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                          </div>
                          <div className="space-y-1">
                            <p className="text-lg font-black text-foreground tracking-tight">Antrean Bersih!</p>
                            <p className="text-sm font-medium text-muted-foreground">Tidak ada berkas yang perlu divalidasi saat ini.</p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {tasks.map(task => (
                 <div key={task.id} className="p-6 rounded-2xl border border-border bg-muted/50 hover:bg-card hover:shadow-md hover:shadow-sm transition-all duration-300 group relative overflow-hidden">
                    {task.isPendingLong && <div className="absolute top-0 right-0 w-16 h-16 bg-rose-500/10 rotate-45 translate-x-8 -translate-y-8" />}
                    <div className="flex justify-between items-start mb-6">
                      <div className="p-2 bg-card rounded-xl shadow-sm border border-border group-hover:scale-110 transition-transform">
                        <FileText className="w-5 h-5 text-primary" />
                      </div>
                      <button className="text-slate-300 hover:text-muted-foreground transition-colors">
                        <MoreVertical className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">{task.referenceNumber}</p>
                        <h4 className="font-extrabold text-foreground truncate tracking-tight">{task.applicant?.name || 'Unknown User'}</h4>
                      </div>
                      <div className="flex items-center justify-between pt-4 border-t border-border">
                        <div className="w-full">
                          <SLACountdown 
                            remainingHours={task.remainingHours} 
                            maxHours={task.maxHours} 
                            status={task.slaStatus} 
                          />
                        </div>
                      </div>
                      <Link href={`/dashboard/validate/${task.id}`} className="block">
                        <Button className="w-full bg-primary hover:bg-primary/90 rounded-xl font-extrabold h-11 shadow-lg shadow-sm">
                          Mulai Validasi
                        </Button>
                      </Link>
                    </div>
                 </div>
               ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
