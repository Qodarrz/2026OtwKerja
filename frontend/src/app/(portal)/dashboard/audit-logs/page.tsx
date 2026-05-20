"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Loader2, ShieldCheck, History, Search, FileText } from "lucide-react";
import { analyticsService } from "@/services/analytics.service";
export default function AuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    async function fetchLogs() {
      try {
        const result = await analyticsService.getAuditLogs(50);
        setLogs(result);
      } catch (error) {
        console.error("Failed to fetch audit logs", error);
      } finally {
        setLoading(false);
      }
    }
    fetchLogs();
  }, []);
  if (loading) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        {" "}
        <header className="flex justify-between gap-6">
          {" "}
          <div className="space-y-2">
            {" "}
            <div className="h-8 w-48 bg-secondary rounded-md animate-pulse" />{" "}
            <div className="h-4 w-96 bg-muted rounded-md animate-pulse" />{" "}
          </div>{" "}
          <div className="h-10 w-48 bg-secondary rounded-xl animate-pulse" />{" "}
        </header>{" "}
        <Card className="shadow-sm">
          {" "}
          <CardContent className="p-0">
            {" "}
            <div className="h-16 w-full bg-muted border-b border-border animate-pulse" />{" "}
            <div className="p-4 space-y-4">
              {" "}
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="h-12 w-full bg-muted rounded-lg animate-pulse"
                />
              ))}{" "}
            </div>{" "}
          </CardContent>{" "}
        </Card>{" "}
      </div>
    );
  }
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {" "}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        {" "}
        <div>
          {" "}
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Audit Log
          </h1>{" "}
          <p className="text-muted-foreground mt-1">
            Sistem rekam jejak aktivitas (immutable log) untuk akuntabilitas
            operasional.
          </p>{" "}
        </div>{" "}
        <div className="flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-xl text-emerald-600 text-xs font-semibold border border-emerald-100">
          {" "}
          <ShieldCheck className="w-4 h-4" /> Integritas Log Terjamin{" "}
        </div>{" "}
      </header>{" "}
      <Card className="shadow-sm overflow-hidden">
        {" "}
        <CardHeader className="border-b border-border bg-background flex flex-row items-center justify-between">
          {" "}
          <div className="relative w-72">
            {" "}
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />{" "}
            <input
              type="text"
              placeholder="Cari aktivitas atau ID..."
              className="pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 w-full transition-all"
            />{" "}
          </div>{" "}
        </CardHeader>{" "}
        <CardContent className="p-0">
          {" "}
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-muted text-xs font-semibold uppercase text-muted-foreground border-b border-border">
                <tr>
                  <th className="px-6 py-4">Waktu (WIB)</th>
                  <th className="px-6 py-4">Aktor / Pengguna</th>
                  <th className="px-6 py-4">Aktivitas</th>
                  <th className="px-6 py-4">Target Entitas</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {logs.map((log) => (
                  <tr
                    key={log.id}
                    className="hover:bg-accent/80 transition-colors group font-mono text-xs"
                  >
                    <td className="px-6 py-4 text-muted-foreground font-medium">
                      {new Date(log.createdAt).toLocaleString("id-ID", {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </td>
                    <td className="px-6 py-4 font-semibold text-foreground">
                      {log.userId || "System"}
                    </td>
                    <td className="px-6 py-4 font-semibold text-foreground">
                      {log.action}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {log.entityType}
                      <span className="text-[10px] bg-secondary px-1.5 py-0.5 rounded text-muted-foreground ml-1">
                        {log.entityId}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase tracking-wider rounded-md">
                        SUCCESS
                      </span>
                    </td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="py-12 text-center text-muted-foreground font-sans font-medium"
                    >
                      <div className="flex flex-col items-center justify-center gap-2">
                        <History className="w-8 h-8 opacity-20" />
                        <p>Belum ada rekaman log aktivitas.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>{" "}
        </CardContent>{" "}
      </Card>{" "}
    </div>
  );
}
