"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usersService } from "@/services/users.service";
import {
  User as UserIcon,
  Mail,
  MapPin,
  Shield,
  Camera,
  CheckCircle2,
  Loader2,
  History,
  Activity,
  ChevronRight,
  Clock
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profileData, historyData] = await Promise.all([
          usersService.getProfile(),
          usersService.getActivityHistory()
        ]);
        setProfile(profileData);
        setHistory(historyData);
      } catch (error) {
        console.error('Failed to fetch profile data', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-10 animate-in fade-in duration-500">
        <div className="max-w-6xl mx-auto">
          <header className="mb-10 space-y-2">
            <div className="h-10 w-64 bg-muted rounded-md animate-pulse" />
            <div className="h-4 w-96 bg-muted rounded-md animate-pulse" />
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-6">
              <div className="h-80 w-full bg-muted rounded-2xl animate-pulse" />
              <div className="h-40 w-full bg-muted rounded-2xl animate-pulse" />
            </div>
            <div className="lg:col-span-2 space-y-8">
              <div className="h-125 w-full bg-muted rounded-2xl animate-pulse" />
              <div className="h-48 w-full bg-muted rounded-2xl animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const formatAction = (action: string) => {
    switch (action) {
      case 'CREATE': return 'Membuat';
      case 'UPDATE': return 'Memperbarui';
      case 'DELETE': return 'Menghapus';
      case 'APPROVE': return 'Menyetujui';
      case 'REJECT': return 'Menolak';
      default: return action;
    }
  };

  const getEntityLabel = (entityType: string) => {
    switch (entityType) {
      case 'PermitApplication': return 'Permohonan';
      case 'User': return 'Pengguna';
      default: return entityType;
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="max-w-6xl mx-auto">
        <header className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Profil Pengguna</h1>
          <p className="text-muted-foreground mt-1 font-medium">Kelola informasi pribadi dan pantau riwayat aktivitas Anda.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Profile Card */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="text-center border-none shadow-sm bg-card overflow-hidden">
              <CardContent className="pt-0 pb-8 flex flex-col items-center mt-12">
                <div className="relative group cursor-pointer">
                  <div className="w-32 h-32 rounded-full bg-background p-1 border border-border shadow-xl">
                    <div className="w-full h-full rounded-full bg-secondary flex items-center justify-center overflow-hidden">
                      <UserIcon className="w-16 h-16 text-muted-foreground" />
                    </div>
                  </div>
                  <div className="absolute bottom-1 right-1 p-2 bg-primary text-primary-foreground rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all transform group-hover:scale-110">
                    <Camera className="w-4 h-4" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold mt-4 text-foreground">{profile?.name || "User"}</h3>
                <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest mt-1">
                  {profile?.roles?.[0]?.replace('_', ' ') || 'Warga Negara'}
                </p>

                {profile?.isKtpVerified ? (
                  <div className="mt-6 flex items-center gap-2 px-4 py-1.5 bg-emerald-500/10 text-emerald-500 rounded-full border border-emerald-500/20">
                    <span className="text-[10px] font-bold uppercase tracking-wider">Terverifikasi KTP</span>
                  </div>
                ) : (
                  <div className="mt-6 flex items-center gap-2 px-4 py-1.5 bg-amber-500/10 text-amber-500 rounded-full border border-amber-500/20">
                    <span className="text-[10px] font-bold uppercase tracking-wider">Belum Verifikasi</span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm bg-card">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Informasi Kontak</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs font-bold"
                  onClick={async () => {
                    if (isEditing) {
                      try {
                        const updated = await usersService.updateProfile({
                          phone: profile.userDetail?.phone,
                          address: profile.userDetail?.address
                        });
                        setProfile(updated);
                      } catch (e) {
                        console.error(e);
                      }
                    }
                    setIsEditing(!isEditing);
                  }}
                >
                  {isEditing ? 'Simpan' : 'Edit'}
                </Button>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <div className="flex items-center gap-3">
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Email</p>
                    <p className="text-sm font-bold">{profile?.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">NIK</p>
                    <p className="text-sm font-bold">{profile?.userDetail?.nik || "Belum diatur"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">No. Telepon</p>
                    {isEditing ? (
                      <Input
                        className="h-8 mt-1"
                        value={profile?.userDetail?.phone || ''}
                        onChange={(e) => setProfile({
                          ...profile,
                          userDetail: { ...profile.userDetail, phone: e.target.value }
                        })}
                      />
                    ) : (
                      <p className="text-sm font-bold">{profile?.userDetail?.phone || "Belum diatur"}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Domisili</p>
                    {isEditing ? (
                      <Input
                        className="h-8 mt-1"
                        value={profile?.userDetail?.address || profile?.userDetail?.ktpAddress || ''}
                        onChange={(e) => setProfile({
                          ...profile,
                          userDetail: { ...profile.userDetail, address: e.target.value }
                        })}
                      />
                    ) : (
                      <p className="text-sm font-bold">{profile?.userDetail?.address || profile?.userDetail?.ktpAddress || "Belum diatur"}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: History & Details */}
          <div className="lg:col-span-2 space-y-8">
            <Card className="border-none shadow-sm bg-card overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between border-b border-border bg-background">
                <div>
                  <CardTitle className="text-xl">Riwayat Aktivitas</CardTitle>
                  <CardDescription>Daftar tindakan terakhir yang Anda lakukan di sistem.</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border max-h-[400px] overflow-y-auto">
                  {history.length > 0 ? history.map((log, i) => (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="p-6 flex items-start justify-between hover:bg-accent/30 transition-colors group"
                    >
                      <div className="flex items-start gap-4">
                        <div className="p-2.5 bg-background border border-border rounded-xl mt-1">
                          <History className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                        <div>
                          <p className="font-bold text-foreground">
                            {formatAction(log.action)} {getEntityLabel(log.entityType)}
                          </p>
                          <div className="flex items-center gap-3 mt-1.5">
                            <span className="flex items-center text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                              <Clock className="w-3 h-3 mr-1" />
                              {new Date(log.createdAt).toLocaleString('id-ID')}
                            </span>
                            <span className="w-1 h-1 rounded-full bg-border" />
                            <span className="text-[10px] font-bold text-primary uppercase tracking-widest">ID: {log.entityId.split('-')[0]}</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )) : (
                    <div className="py-20 text-center flex flex-col items-center gap-4">
                      <div className="p-4 bg-background border border-border rounded-full">
                        <History className="w-8 h-8 text-muted-foreground/20" />
                      </div>
                      <p className="text-sm font-bold text-muted-foreground">Belum ada riwayat aktivitas tercatat.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm bg-card">
              <CardHeader className="border-b border-border">
                <CardTitle>Keamanan Akun</CardTitle>
                <CardDescription>Kelola kredensial dan akses akun Anda.</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="flex items-center justify-between p-4 bg-background border border-border rounded-2xl hover:border-primary/30 transition-colors">
                  <div>
                    <p className="font-bold text-foreground">Kata Sandi</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Terakhir diperbarui 3 bulan yang lalu</p>
                  </div>
                  <Button variant="outline" size="sm" className="rounded-xl font-bold h-9">Ubah</Button>
                </div>

                <div className="flex items-center justify-between p-4 bg-rose-500/5 border border-rose-500/10 rounded-2xl group hover:border-rose-500/30 transition-colors">
                  <div>
                    <p className="font-bold text-rose-500">Hapus Akun</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Semua data akan dihapus secara permanen</p>
                  </div>
                  <Button variant="ghost" size="sm" className="rounded-xl font-bold h-9 text-rose-500 hover:bg-rose-500 hover:text-white">Tutup Akun</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
