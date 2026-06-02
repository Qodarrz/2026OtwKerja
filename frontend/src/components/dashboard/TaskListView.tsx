"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Calendar,
  ArrowUpRight,
  MoreVertical,
  CheckCircle2,
  AlertCircle,
  Clock,
  Filter,
  Search,
  List,
  LayoutGrid,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { permitService } from "@/services/permit.service";
import { SLACountdown } from "./SLACountdown";
import { DashboardSkeleton } from "./DashboardSkeleton";
interface TaskListViewProps {
  title: string;
  description: string;
  filterStatus?: "PENDING" | "COMPLETED" | "EXPIRED";
}
export function TaskListView({
  title,
  description,
  filterStatus = "PENDING",
}: TaskListViewProps) {
  const [tasks, setTasks] = useState<any[]>([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [filterStage, setFilterStage] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1); // Reset page on new search
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const response = await permitService.getStaffTasks({
          status: filterStatus,
          search: debouncedSearch,
          page,
          limit: 10,
          _t: Date.now(),
        });
        setTasks(response.data || []);
        if (response.meta) setMeta(response.meta);
      } catch (error) {
        console.error("Failed to fetch tasks", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [filterStatus, debouncedSearch, page]);

  if (loading && tasks.length === 0) {
    return <DashboardSkeleton />;
  }

  const filteredTasks = tasks.filter(t => {
    const matchStage = filterStage === "ALL" || t.currentStage === filterStage || t.status === filterStage;
    return matchStage;
  });

  const uniqueStages = Array.from(new Set(tasks.map(t => t.currentStage || t.status)));

  return (
    <div className="space-y-10">
      {" "}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        {" "}
        <div className="space-y-1">
          {" "}
          <div className="flex items-center gap-2 mb-2">
            {" "}
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />{" "}
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
              Internal Portal
            </span>{" "}
          </div>{" "}
          <h1 className="text-4xl font-bold tracking-tight text-foreground">
            {title}
          </h1>{" "}
          <p className="text-muted-foreground font-medium">
            {description}
          </p>{" "}
        </div>{" "}
        <div className="flex items-center gap-3">
          {" "}
          <div className="relative hidden lg:block">
            {" "}
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />{" "}
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari berkas..."
              className="pl-11 pr-4 py-3 bg-card border border-border rounded-xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-primary/5 w-64 transition-all"
            />{" "}
          </div>{" "}
          <div className="flex bg-card border border-border rounded-xl p-1 shadow-sm">
            {" "}
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "p-2 rounded-lg transition-all",
                viewMode === "list"
                  ? "bg-secondary text-foreground shadow-inner"
                  : "text-muted-foreground hover:text-muted-foreground",
              )}
            >
              {" "}
              <List className="w-4 h-4" />{" "}
            </button>{" "}
            <button
              onClick={() => setViewMode("grid")}
              className={cn(
                "p-2 rounded-lg transition-all",
                viewMode === "grid"
                  ? "bg-secondary text-foreground shadow-inner"
                  : "text-muted-foreground hover:text-muted-foreground",
              )}
            >
              {" "}
              <LayoutGrid className="w-4 h-4" />{" "}
            </button>{" "}
          </div>{" "}
          <div className="relative">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <select
              value={filterStage}
              onChange={(e) => setFilterStage(e.target.value)}
              className="pl-11 pr-8 py-3 appearance-none bg-card border border-border rounded-xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all text-muted-foreground hover:bg-accent cursor-pointer h-11"
            >
              <option value="ALL">Semua Tahap</option>
              {uniqueStages.map(stage => (
                <option key={stage} value={stage}>{stage?.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>
        </div>{" "}
      </header>{" "}
      <Card className="border-none shadow-sm bg-card overflow-hidden">
        {" "}
        <CardContent className="p-0">
          {" "}
          {viewMode === "list" ? (
            <div className="overflow-x-auto">
              {" "}
              <table className="w-full text-left">
                <thead className="bg-background text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground border-b border-border">
                  <tr>
                    <th className="px-8 py-5">Pemohon & No. Ref</th>
                    <th className="px-8 py-5">Tipe Izin</th>
                    <th className="px-8 py-5">Waktu Masuk</th>
                    <th className="px-8 py-5">Status / SLA</th>
                    <th className="px-8 py-5 text-right">Tindakan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredTasks.length > 0 ? (
                    filteredTasks.map((task) => (
                      <tr
                        key={task.id}
                        className="hover:bg-accent/80 transition-colors group"
                      >
                        <td className="px-8 py-6">
                          <div className="flex flex-col gap-1">
                            <span className="font-bold text-foreground tracking-tight">
                              {task.applicant?.name || "Unknown User"}
                            </span>
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                              {task.referenceNumber}
                            </span>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <span className="inline-flex items-center px-3 py-1 bg-secondary text-muted-foreground text-[10px] font-bold uppercase tracking-widest rounded-lg border border-border">
                            {task.permitType.replace("_", " ")}
                          </span>
                        </td>
                        <td className="px-8 py-6 text-sm font-bold text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-slate-300" />
                            {new Date(
                              task.submittedAt || task.createdAt,
                            ).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                            })}
                          </div>
                        </td>
                        <td className="px-8 py-6 w-64">
                          {task.status === "APPROVED" ||
                          task.status === "REJECTED" ? (
                            <span
                              className={cn(
                                "inline-flex items-center px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-lg border",
                                task.status === "APPROVED"
                                  ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                                  : "bg-rose-50 text-rose-600 border-rose-200",
                              )}
                            >
                              {task.status === "APPROVED"
                                ? "Disetujui"
                                : "Ditolak"}
                            </span>
                          ) : (
                            <SLACountdown
                              remainingHours={task.remainingHours}
                              maxHours={task.maxHours}
                              status={task.slaStatus}
                            />
                          )}
                        </td>
                        <td className="px-8 py-6 text-right">
                          <Link href={`/dashboard/validate/${task.id}`}>
                            <Button
                              size="sm"
                              className="rounded-xl bg-primary hover:bg-primary/90 font-bold h-9 px-5 transition-all shadow-md "
                            >
                              Detail
                              <ArrowUpRight className="ml-2 w-3.5 h-3.5" />
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-32 text-center">
                        <div className="flex flex-col items-center gap-4">
                          <div className="p-6 bg-muted rounded-full">
                            <FileText className="w-10 h-10 text-slate-200" />
                          </div>
                          <div className="space-y-1">
                            <p className="text-lg font-bold text-foreground tracking-tight">
                              Tidak Ada Berkas
                            </p>
                            <p className="text-sm font-medium text-muted-foreground">
                              Semua pekerjaan telah selesai untuk kategori ini.
                            </p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>{" "}
            </div>
          ) : (
            <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {" "}
              {filteredTasks.map((task) => (
                <div
                  key={task.id}
                  className="p-6 rounded-2xl border border-border bg-background hover:bg-card hover:shadow-md hover: transition-all duration-300 group"
                >
                  {" "}
                  <div className="flex justify-between items-start mb-6">
                    {" "}
                    <div className="p-2 bg-card rounded-xl shadow-sm border border-border group-hover:scale-110 transition-transform">
                      {" "}
                      <FileText className="w-5 h-5 text-primary" />{" "}
                    </div>{" "}
                    <button className="text-slate-300 hover:text-muted-foreground transition-colors">
                      {" "}
                      <MoreVertical className="w-5 h-5" />{" "}
                    </button>{" "}
                  </div>{" "}
                  <div className="space-y-4">
                    {" "}
                    <div>
                      {" "}
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
                        {task.referenceNumber}
                      </p>{" "}
                      <h4 className="font-bold text-foreground truncate tracking-tight">
                        {task.applicant?.name || "Unknown User"}
                      </h4>{" "}
                    </div>{" "}
                    <div className="pt-4 border-t border-border">
                      {" "}
                      {task.status === "APPROVED" ||
                      task.status === "REJECTED" ? (
                        <span
                          className={cn(
                            "inline-flex items-center px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-lg border",
                            task.status === "APPROVED"
                              ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                              : "bg-rose-50 text-rose-600 border-rose-200",
                          )}
                        >
                          {" "}
                          {task.status === "APPROVED"
                            ? "Disetujui"
                            : "Ditolak"}{" "}
                        </span>
                      ) : (
                        <SLACountdown
                          remainingHours={task.remainingHours}
                          maxHours={task.maxHours}
                          status={task.slaStatus}
                        />
                      )}{" "}
                    </div>{" "}
                    <Link
                      href={`/dashboard/validate/${task.id}`}
                      className="block"
                    >
                      {" "}
                      <Button className="w-full bg-primary hover:bg-primary/90 rounded-xl font-bold h-11 shadow-lg ">
                        {" "}
                        Lihat Detail{" "}
                      </Button>{" "}
                    </Link>{" "}
                  </div>{" "}
                </div>
              ))}{" "}
            </div>
          )}{" "}
          
          {/* Pagination Controls */}
          {meta.totalPages > 1 && (
            <div className="flex items-center justify-between px-8 py-4 border-t border-border bg-background/50">
              <span className="text-sm font-bold text-muted-foreground">
                Menampilkan halaman {meta.page} dari {meta.totalPages} ({meta.total} total data)
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={meta.page <= 1}
                  className="rounded-lg font-bold"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Sebelumnya
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))}
                  disabled={meta.page >= meta.totalPages}
                  className="rounded-lg font-bold"
                >
                  Selanjutnya
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}

        </CardContent>{" "}
      </Card>{" "}
    </div>
  );
}
