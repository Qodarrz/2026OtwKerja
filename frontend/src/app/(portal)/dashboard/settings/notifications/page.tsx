"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Bell,
  Mail,
  Smartphone,
  ShieldAlert,
  Clock,
  CheckCircle2,
  Zap,
  Volume2,
  Loader2,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { usersService } from "@/services/users.service";

export default function NotificationSettingsPage() {
  const [settings, setSettings] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function fetchSettings() {
      try {
        const data = await usersService.getSettings();
        setSettings(data);
      } catch (error) {
        console.error("Failed to fetch settings", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchSettings();
  }, []);

  const toggle = (key: string) => {
    setSettings((prev: any) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { id, userId, updatedAt, ...payload } = settings;
      await usersService.updateSettings(payload);
      toast.success("Pengaturan berhasil disimpan!");
    } catch (error) {
      toast.error("Gagal menyimpan pengaturan");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-10 animate-in fade-in duration-500">
        <header className="space-y-2">
          <div className="h-4 w-32 bg-muted rounded-md animate-pulse" />
          <div className="h-10 w-64 bg-muted rounded-md animate-pulse" />
          <div className="h-4 w-96 bg-muted rounded-md animate-pulse" />
        </header>

        <div className="max-w-4xl space-y-8">
          {/* Focus Mode Skeleton */}
          <div className="h-32 w-full bg-muted rounded-2xl animate-pulse" />
          
          {/* Category Skeletons */}
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-4">
              <div className="h-48 w-full bg-muted rounded-2xl animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const categories = [
    {
      title: "Peringatan SLA",
      description: "Notifikasi terkait ambang batas waktu pengerjaan berkas.",
      icon: Clock,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
      items: [
        { key: "emailSlaWarning", label: "Email (Mendekati Deadline)", icon: Mail },
        {
          key: "pushSlaOverdue",
          label: "Push Notification (Melewati SLA)",
          icon: Smartphone,
        },
      ],
    },
    {
      title: "Status Perizinan",
      description: "Pembaruan otomatis saat berkas disetujui atau ditolak.",
      icon: CheckCircle2,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      items: [
        { key: "emailStatusUpdate", label: "Email Konfirmasi Status", icon: Mail },
        {
          key: "appStatusUpdate",
          label: "Notifikasi Aplikasi",
          icon: Smartphone,
        },
      ],
    },
    {
      title: "Keamanan & Sistem",
      description: "Pesan penting terkait pemeliharaan sistem dan keamanan.",
      icon: ShieldAlert,
      color: "text-rose-500",
      bg: "bg-rose-500/10",
      items: [
        { key: "systemAlerts", label: "Alert Kritis Sistem", icon: Zap },
        {
          key: "browserNotifications",
          label: "Notifikasi Browser",
          icon: Volume2,
        },
      ],
    },
  ];

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <header className="space-y-1">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
            Konfigurasi Sistem
          </span>
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-foreground">
          Notifikasi Sistem
        </h1>
        <p className="text-muted-foreground font-medium">
          Atur bagaimana Anda menerima pembaruan dari FlowGov.
        </p>
      </header>

      <div className="max-w-4xl space-y-8">
        <Card className="border-none shadow-sm bg-primary text-primary-foreground overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-card/10 rounded-full -mr-32 -mt-32 blur-3xl opacity-50" />
          <CardContent className="p-8 relative z-10 flex flex-col md:flex-row items-center gap-6">
            <div className="w-16 h-16 rounded-2xl bg-card/20 flex items-center justify-center shrink-0">
              <Bell className="w-8 h-8 text-primary-foreground" />
            </div>
            <div className="space-y-1 text-center md:text-left">
              <h3 className="text-xl font-bold tracking-tight">
                Mode Fokus (Jangan Ganggu)
              </h3>
              <p className="text-blue-100 text-sm font-medium">
                Aktifkan untuk membisukan seluruh notifikasi di luar jam kerja
                (08:00 - 17:00).
              </p>
            </div>
            <div className="md:ml-auto">
              <Button 
                onClick={() => toggle("focusModeActive")}
                className={cn(
                  "rounded-xl font-bold transition-all",
                  settings.focusModeActive 
                    ? "bg-emerald-500 text-white hover:bg-emerald-600" 
                    : "bg-white text-primary hover:bg-white/90"
                )}
              >
                {settings.focusModeActive ? "Aktif" : "Aktifkan Sekarang"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {categories.map((cat, i) => (
          <Card
            key={i}
            className="border-none shadow-sm bg-card overflow-hidden"
          >
            <div className="p-8 border-b border-border flex flex-col md:flex-row md:items-center gap-4">
              <div
                className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0",
                  cat.bg,
                )}
              >
                <cat.icon className={cn("w-6 h-6", cat.color)} />
              </div>
              <div>
                <h4 className="text-lg font-bold text-foreground tracking-tight">
                  {cat.title}
                </h4>
                <p className="text-sm text-muted-foreground font-medium">
                  {cat.description}
                </p>
              </div>
            </div>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {cat.items.map((item) => (
                  <div
                    key={item.key}
                    className="flex items-center justify-between p-8 hover:bg-accent/30 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-background border border-border rounded-lg text-muted-foreground">
                        <item.icon className="w-4 h-4" />
                      </div>
                      <span className="font-bold text-foreground">
                        {item.label}
                      </span>
                    </div>
                    <button
                      onClick={() => toggle(item.key)}
                      className={cn(
                        "w-12 h-6 rounded-full transition-all relative",
                        settings[item.key]
                          ? "bg-primary"
                          : "bg-muted",
                      )}
                    >
                      <div
                        className={cn(
                          "absolute top-1 w-4 h-4 bg-card rounded-full transition-all",
                          settings[item.key]
                            ? "right-1"
                            : "left-1",
                        )}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}

        <div className="flex justify-end pt-4">
          <Button 
            disabled={isSaving}
            onClick={handleSave}
            className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-bold px-10 h-12 shadow-lg shadow-primary/20 active:scale-95 transition-all"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Simpan Pengaturan
          </Button>
        </div>
      </div>
    </div>
  );
}
