"use client";

import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Headset, 
  Clock, 
  ArrowUpRight, 
  MessageSquare,
  Inbox,
  UserCheck,
  CheckCircle,
  Loader2
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import api from "@/lib/axios";
import { io, Socket } from "socket.io-client";
import { useAuth } from "@/contexts/AuthContext";

export function CSDashboard() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const socketRef = useRef<Socket | null>(null);

  const fetchSessions = async () => {
    try {
      const { data } = await api.get("/chat/sessions/admin/all");
      setSessions(data);
    } catch (error) {
      console.error("Gagal memuat tiket chat:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();

    const socketUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
    const socket = io(socketUrl, {
      withCredentials: true,
      transports: ["websocket", "polling"],
    });

    socketRef.current = socket;

    socket.on("ticket_activity", () => {
      fetchSessions();
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const openSessions = sessions.filter(s => s.status === "OPEN");
  const pendingSessions = openSessions.filter(s => s.assignedToId === null);
  const mySessions = openSessions.filter(s => s.assignedToId === user?.id);
  const resolvedSessions = sessions.filter(s => s.status === "RESOLVED");

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
            <div className="p-1.5 rounded-lg bg-sky-50 dark:bg-sky-950/30">
              <Headset className="w-3.5 h-3.5 text-primary" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Customer Service Portal</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground">Dashboard Layanan CS</h1>
          <p className="text-muted-foreground font-medium">Bantu warga menyelesaikan kendala perizinan secara real-time.</p>
        </div>
        <div>
          <Link href="/dashboard/tickets">
            <Button className="rounded-xl bg-primary hover:bg-primary/90 shadow-lg shadow-sm font-bold h-11 px-6 transition-all active:scale-95">
              Buka Ruang CS <ArrowUpRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
        </div>
      </header>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: "Menunggu CS (Pending)", value: pendingSessions.length, icon: Inbox, bg: "bg-amber-500/10", text: "text-amber-500" },
          { label: "Ditangani Saya", value: mySessions.length, icon: UserCheck, bg: "bg-primary/10", text: "text-primary" },
          { label: "Selesai (Resolved)", value: resolvedSessions.length, icon: CheckCircle, bg: "bg-emerald-500/10", text: "text-emerald-500" },
          { label: "Total Percakapan", value: sessions.length, icon: MessageSquare, bg: "bg-purple-500/10", text: "text-purple-500" }
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

      {/* Pending Tickets Queue */}
      <Card className="border-none shadow-sm bg-card overflow-hidden">
        <div className="p-8 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-foreground tracking-tight">Antrean Chat Tertunda (Pending)</h2>
            <p className="text-sm text-muted-foreground font-medium">Klik tombol untuk mengambil alih chat warga.</p>
          </div>
          <span className="inline-flex items-center px-3 py-1 bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 text-[10px] font-bold uppercase tracking-widest rounded-lg border border-amber-200/50">
            {pendingSessions.length} Chat
          </span>
        </div>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-background text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground border-b border-border">
                <tr>
                  <th className="px-8 py-5">Warga / Pemohon</th>
                  <th className="px-8 py-5">Email</th>
                  <th className="px-8 py-5">Pesan Terakhir</th>
                  <th className="px-8 py-5">Waktu Update</th>
                  <th className="px-8 py-5 text-right">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {pendingSessions.length > 0 ? (
                  pendingSessions.map((session) => {
                    const latestMsg = session.messages[session.messages.length - 1];
                    return (
                      <tr key={session.id} className="hover:bg-accent/80 transition-colors group">
                        <td className="px-8 py-6 font-bold text-foreground tracking-tight">
                          {session.user?.name || "Citizen"}
                        </td>
                        <td className="px-8 py-6 text-sm font-semibold text-muted-foreground">
                          {session.user?.email || "-"}
                        </td>
                        <td className="px-8 py-6 text-sm text-muted-foreground max-w-xs truncate italic">
                          {latestMsg?.content ? `"${latestMsg.content}"` : "Memulai obrolan..."}
                        </td>
                        <td className="px-8 py-6 text-sm font-bold text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-slate-300" />
                            {new Date(session.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <Link href="/dashboard/tickets">
                            <Button size="sm" className="rounded-xl bg-primary hover:bg-primary/90 font-bold h-9 px-5 transition-all shadow-md shadow-sm">
                              Bantu Sekarang <ArrowUpRight className="ml-2 w-3.5 h-3.5" />
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="py-32 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <div className="p-6 bg-emerald-50 dark:bg-emerald-950/20 rounded-full">
                          <CheckCircle className="w-10 h-10 text-emerald-500" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-lg font-bold text-foreground tracking-tight">Antrean Bersih!</p>
                          <p className="text-sm font-medium text-muted-foreground">Semua chat pengaduan warga telah tertangani.</p>
                        </div>
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
