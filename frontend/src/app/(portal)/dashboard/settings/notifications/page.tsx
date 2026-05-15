"use client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Bell,
  Mail,
  MessageSquare,
  Smartphone,
  ShieldAlert,
  Clock,
  CheckCircle2,
  Zap,
  Volume2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
export default function NotificationSettingsPage() {
  const [settings, setSettings] = useState({
    email_sla: true,
    push_sla: true,
    email_approval: true,
    push_approval: true,
    system_alerts: true,
    browser_notifications: false,
  });
  const toggle = (key: keyof typeof settings) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };
  const categories = [
    {
      title: "Peringatan SLA",
      description: "Notifikasi terkait ambang batas waktu pengerjaan berkas.",
      icon: Clock,
      color: "text-amber-600",
      bg: "bg-amber-50",
      items: [
        { key: "email_sla", label: "Email (Mendekati Deadline)", icon: Mail },
        {
          key: "push_sla",
          label: "Push Notification (Melewati SLA)",
          icon: Smartphone,
        },
      ],
    },
    {
      title: "Status Perizinan",
      description: "Pembaruan otomatis saat berkas disetujui atau ditolak.",
      icon: CheckCircle2,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      items: [
        { key: "email_approval", label: "Email Konfirmasi Status", icon: Mail },
        {
          key: "push_approval",
          label: "Notifikasi Aplikasi",
          icon: Smartphone,
        },
      ],
    },
    {
      title: "Keamanan & Sistem",
      description: "Pesan penting terkait pemeliharaan sistem dan keamanan.",
      icon: ShieldAlert,
      color: "text-rose-600",
      bg: "bg-rose-50",
      items: [
        { key: "system_alerts", label: "Alert Kritis Sistem", icon: Zap },
        {
          key: "browser_notifications",
          label: "Notifikasi Browser",
          icon: Volume2,
        },
      ],
    },
  ];
  return (
    <div className="space-y-10">
      {" "}
      <header className="space-y-1">
        {" "}
        <div className="flex items-center gap-2 mb-2">
          {" "}
          <div className="w-2 h-2 rounded-full bg-primary" />{" "}
          <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-muted-foreground">
            Konfigurasi Sistem
          </span>{" "}
        </div>{" "}
        <h1 className="text-4xl font-extrabold tracking-tight text-foreground">
          Notifikasi Sistem
        </h1>{" "}
        <p className="text-muted-foreground font-medium">
          Atur bagaimana Anda menerima pembaruan dari FlowGov.
        </p>{" "}
      </header>{" "}
      <div className="max-w-4xl space-y-8">
        {" "}
        <Card className="border-none shadow-sm bg-primary text-primary-foreground overflow-hidden relative">
          {" "}
          <div className="absolute top-0 right-0 w-64 h-64 bg-card/10 rounded-full -mr-32 -mt-32 blur-3xl opacity-50" />{" "}
          <CardContent className="p-8 relative z-10 flex flex-col md:flex-row items-center gap-6">
            {" "}
            <div className="w-16 h-16 rounded-2xl bg-card/20 flex items-center justify-center shrink-0">
              {" "}
              <Bell className="w-8 h-8 text-primary-foreground" />{" "}
            </div>{" "}
            <div className="space-y-1 text-center md:text-left">
              {" "}
              <h3 className="text-xl font-black tracking-tight">
                Mode Fokus (Jangan Ganggu)
              </h3>{" "}
              <p className="text-blue-100 text-sm font-medium">
                Aktifkan untuk membisukan seluruh notifikasi di luar jam kerja
                (08:00 - 17:00).
              </p>{" "}
            </div>{" "}
            <div className="md:ml-auto">
              {" "}
              <Button className="bg-card text-primary hover:bg-card/90 rounded-xl font-bold">
                Aktifkan Sekarang
              </Button>{" "}
            </div>{" "}
          </CardContent>{" "}
        </Card>{" "}
        {categories.map((cat, i) => (
          <Card
            key={i}
            className="border-none shadow-sm bg-card overflow-hidden"
          >
            {" "}
            <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row md:items-center gap-4">
              {" "}
              <div
                className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0",
                  cat.bg,
                )}
              >
                {" "}
                <cat.icon className={cn("w-6 h-6", cat.color)} />{" "}
              </div>{" "}
              <div>
                {" "}
                <h4 className="text-lg font-extrabold text-foreground tracking-tight">
                  {cat.title}
                </h4>{" "}
                <p className="text-sm text-muted-foreground font-medium">
                  {cat.description}
                </p>{" "}
              </div>{" "}
            </div>{" "}
            <CardContent className="p-0">
              {" "}
              <div className="divide-y divide-slate-50">
                {" "}
                {cat.items.map((item) => (
                  <div
                    key={item.key}
                    className="flex items-center justify-between p-8 hover:bg-accent/50 transition-colors"
                  >
                    {" "}
                    <div className="flex items-center gap-4">
                      {" "}
                      <div className="p-2 bg-secondary rounded-lg text-muted-foreground">
                        {" "}
                        <item.icon className="w-4 h-4" />{" "}
                      </div>{" "}
                      <span className="font-bold text-slate-700">
                        {item.label}
                      </span>{" "}
                    </div>{" "}
                    <button
                      onClick={() => toggle(item.key as keyof typeof settings)}
                      className={cn(
                        "w-12 h-6 rounded-full transition-all relative",
                        settings[item.key as keyof typeof settings]
                          ? "bg-primary"
                          : "bg-slate-200",
                      )}
                    >
                      {" "}
                      <div
                        className={cn(
                          "absolute top-1 w-4 h-4 bg-card rounded-full transition-all",
                          settings[item.key as keyof typeof settings]
                            ? "right-1"
                            : "left-1",
                        )}
                      />{" "}
                    </button>{" "}
                  </div>
                ))}{" "}
              </div>{" "}
            </CardContent>{" "}
          </Card>
        ))}{" "}
        <div className="flex justify-end pt-4">
          {" "}
          <Button className="rounded-xl bg-background hover:bg-muted font-bold px-10 h-12 shadow-lg ">
            Simpan Pengaturan
          </Button>{" "}
        </div>{" "}
      </div>{" "}
    </div>
  );
}
