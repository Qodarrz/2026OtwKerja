"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
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
  // Fetch up to 50 for the dashboard summary view to avoid missing tasks
  const fetcher = (url: string) => permitService.getStaffTasks({ limit: 50 });
  const { data: response, error } = useSWR('/staff/tasks', fetcher);
  const loading = !response && !error;
  const currentTasks = response?.data || [];
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const filteredTasks = currentTasks.filter((task: any) => 
    statusFilter === 'ALL' || task.currentStage === statusFilter
  );

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
             <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">{roleInfo.label} Portal</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground">Antrean Berkas</h1>
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
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-card border border-border text-sm font-bold rounded-xl h-11 px-4 hover:bg-accent transition-all cursor-pointer outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="ALL">Semua Status</option>
              <option value="DOCUMENT_CHECK">Document Check</option>
              <option value="FIELD_INSPECTION">Field Inspection</option>
              <option value="ASSESSMENT">Assessment</option>
              <option value="WAITING_FOR_PAYMENT">Waiting For Payment</option>
              <option value="LEGALIZATION">Legalization</option>
            </select>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: "Total Antrean", value: filteredTasks.length, icon: FileText, color: "bg-primary", text: "text-primary", bg: "bg-primary/5" },
          { label: "SLA Warning", value: filteredTasks.filter((t: any) => t.slaStatus === 'WARNING').length, icon: Clock, color: "bg-amber-500", text: "text-amber-600", bg: "bg-amber-50/50" },
          { label: "SLA Overdue", value: filteredTasks.filter((t: any) => t.slaStatus === 'OVERDUE').length, icon: AlertCircle, color: "bg-rose-500", text: "text-rose-600", bg: "bg-rose-50/50" },
        ].map((stat, i) => (
          <Card key={stat.label} className="border-none shadow-sm overflow-hidden bg-card">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{stat.label}</p>
                  <h3 className="text-3xl font-bold text-foreground">{stat.value}</h3>
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
              <h2 className="text-xl font-bold text-foreground tracking-tight">Tugas Yang Perlu Diproses</h2>
              <p className="text-sm text-muted-foreground font-medium">Daftar berkas yang berada pada tahap <span className="text-primary font-bold">{roleInfo.label}</span>.</p>
           </div>
        </div>
        <CardContent className="p-0">
          {viewMode === 'list' ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-background text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground border-b border-border">
                  <tr>
                    <th className="px-8 py-5">Pemohon & No. Ref</th>
                    <th className="px-8 py-5">Tipe Izin</th>
                    <th className="px-8 py-5">Waktu Masuk</th>
                    <th className="px-8 py-5">Urgensi (SLA)</th>
                    <th className="px-8 py-5 text-right">Tindakan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredTasks.length > 0 ? (
                    filteredTasks.map((task: any) => (
                      <tr key={task.id} className="hover:bg-accent/80 transition-colors group">
                        <td className="px-8 py-6">
                          <div className="flex flex-col gap-1">
                            <span className="font-bold text-foreground tracking-tight">{task.applicant?.name || 'Unknown User'}</span>
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{task.referenceNumber}</span>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <span className="inline-flex items-center px-3 py-1 bg-secondary text-muted-foreground text-[10px] font-bold uppercase tracking-widest rounded-lg border border-border">
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
                            <Button size="sm" className="rounded-xl bg-primary hover:bg-primary/90 font-bold h-9 px-5 transition-all shadow-md">
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
                            <p className="text-lg font-bold text-foreground tracking-tight">Antrean Bersih!</p>
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
               {filteredTasks.map((task: any) => (
                 <div key={task.id} className="p-6 rounded-2xl border border-border bg-background hover:bg-card hover:shadow-md transition-all duration-300 group relative overflow-hidden">
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
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">{task.referenceNumber}</p>
                        <h4 className="font-bold text-foreground truncate tracking-tight">{task.applicant?.name || 'Unknown User'}</h4>
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
                        <Button className="w-full bg-primary hover:bg-primary/90 rounded-xl font-bold h-11 shadow-lg">
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
