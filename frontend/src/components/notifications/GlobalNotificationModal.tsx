"use client";

import { useEffect, useState } from "react";
import { useSocket } from "@/contexts/SocketContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BellRing, AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";

export function GlobalNotificationModal() {
  const { socket } = useSocket();
  const [isOpen, setIsOpen] = useState(false);
  const [notification, setNotification] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    if (!socket) return;

    const handlePing = (data: any) => {
      console.log("Received Ping:", data);
      setNotification(data);
      setIsOpen(true);
      
      // Play a sound (optional but good for ping)
      try {
        const audio = new Audio('/sounds/ping.mp3');
        audio.play().catch(e => console.log('Audio play failed', e));
      } catch (e) {}
    };

    const handleSlaWarning = (data: any) => {
      console.log("Received SLA Warning:", data);
      setNotification(data);
      setIsOpen(true);
    };

    socket.on("notification:ping", handlePing);
    socket.on("notification:sla_warning", handleSlaWarning);

    return () => {
      socket.off("notification:ping", handlePing);
      socket.off("notification:sla_warning", handleSlaWarning);
    };
  }, [socket]);

  const handleAction = () => {
    setIsOpen(false);
    if (notification?.metadata?.applicationId) {
      router.push(`/dashboard/validate/${notification.metadata.applicationId}`);
    }
  };

  if (!notification) return null;

  const isWarning = notification.type === 'SLA_WARNING' || notification.urgencyLevel === 'high';

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-md border-t-4 border-t-amber-500 shadow-2xl p-6 bg-card rounded-2xl">
        <DialogHeader className="mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isWarning ? 'bg-amber-100 text-amber-600' : 'bg-primary/10 text-primary'}`}>
              {isWarning ? <AlertTriangle className="w-6 h-6" /> : <BellRing className="w-6 h-6 animate-pulse" />}
            </div>
            <DialogTitle className="text-xl font-bold tracking-tight">
              {notification.title || "Notifikasi Baru"}
            </DialogTitle>
          </div>
        </DialogHeader>
        
        <div className="bg-muted/30 p-4 rounded-xl border border-border/50 mb-6">
          <p className="text-sm font-medium text-foreground leading-relaxed">
            {notification.message}
          </p>
          {notification.metadata?.referenceNumber && (
            <div className="mt-3 text-xs text-muted-foreground font-mono bg-background p-2 rounded-md border inline-block">
              Ref: {notification.metadata.referenceNumber}
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2 sm:justify-end">
          <Button variant="outline" onClick={() => setIsOpen(false)} className="rounded-xl px-6">
            Tutup
          </Button>
          <Button onClick={handleAction} className="rounded-xl px-6 bg-primary hover:bg-primary/90">
            Lihat Berkas
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
