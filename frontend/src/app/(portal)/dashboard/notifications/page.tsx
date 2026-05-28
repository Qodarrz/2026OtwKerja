"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, BellRing, Bell, CheckCircle2, AlertTriangle, MessageSquare } from "lucide-react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import api from "@/lib/axios";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  applicationId?: string;
  application?: {
    id: string;
    referenceNumber: string;
  };
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const res = await api.get("/notifications?limit=50");
      setNotifications(res.data.data);
    } catch (error) {
      toast.error("Gagal memuat notifikasi.");
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (error) {
      console.error(error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      toast.success("Semua notifikasi ditandai sudah dibaca.");
    } catch (error) {
      toast.error("Gagal menandai notifikasi.");
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }
    
    if (notification.applicationId) {
      router.push(`/dashboard/validate/${notification.applicationId}`);
    } else {
      // General routing if necessary
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'SLA_WARNING':
      case 'SLA_ESCALATION':
        return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      case 'APPLICATION_APPROVED':
        return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
      case 'FEEDBACK_RESPONSE':
        return <MessageSquare className="w-5 h-5 text-blue-500" />;
      default:
        return <Bell className="w-5 h-5 text-primary" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            Kotak Masuk Notifikasi
            {unreadCount > 0 && (
              <span className="bg-rose-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                {unreadCount} Baru
              </span>
            )}
          </h1>
          <p className="text-muted-foreground font-medium mt-1">
            Pantau semua pembaruan dan instruksi dari sistem FlowGov.
          </p>
        </div>
        {unreadCount > 0 && (
          <Button onClick={markAllAsRead} variant="outline" className="rounded-xl font-bold">
            Tandai Semua Dibaca
          </Button>
        )}
      </header>

      {notifications.length === 0 ? (
        <Card className="border-dashed shadow-sm">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <BellRing className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-bold">Tidak ada notifikasi</h3>
            <p className="text-muted-foreground text-sm font-medium">Anda belum menerima notifikasi apapun.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map(notification => (
            <Card 
              key={notification.id} 
              onClick={() => handleNotificationClick(notification)}
              className={cn(
                "border-none shadow-sm cursor-pointer transition-all hover:scale-[1.01]",
                !notification.isRead ? "bg-card border-l-4 border-l-primary" : "bg-muted/30"
              )}
            >
              <CardContent className="p-5 flex items-start gap-4">
                <div className={cn(
                  "p-3 rounded-full shrink-0",
                  !notification.isRead ? "bg-primary/10" : "bg-background border"
                )}>
                  {getIcon(notification.type)}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-start justify-between gap-4">
                    <h4 className={cn("font-bold text-base", !notification.isRead ? "text-foreground" : "text-muted-foreground")}>
                      {notification.title}
                    </h4>
                    <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                      {format(new Date(notification.createdAt), "dd MMM yyyy, HH:mm", { locale: idLocale })}
                    </span>
                  </div>
                  <p className={cn("text-sm leading-relaxed", !notification.isRead ? "text-foreground font-medium" : "text-muted-foreground")}>
                    {notification.message}
                  </p>
                  {notification.application?.referenceNumber && (
                    <div className="inline-block mt-2">
                      <span className="text-[10px] font-mono bg-background border px-2 py-1 rounded-md text-muted-foreground">
                        Ref: {notification.application.referenceNumber}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
