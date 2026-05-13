"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authService } from "@/services/auth.service";
import { 
  User as UserIcon, 
  Mail, 
  Phone, 
  MapPin, 
  Shield, 
  Camera,
  CheckCircle2,
  Loader2
} from "lucide-react";
import { motion } from "framer-motion";

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await authService.getProfile();
        setProfile(response);
      } catch (error) {
        console.error('Failed to fetch profile', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-10">
      
      <div className="max-w-4xl mx-auto">
        <header className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight">Profil Pengguna</h1>
          <p className="text-muted-foreground mt-1">Kelola informasi pribadi dan pengaturan keamanan Anda.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Avatar Section */}
          <div className="md:col-span-1">
            <Card className="text-center">
              <CardContent className="pt-8 pb-8 flex flex-col items-center">
                <div className="relative group cursor-pointer">
                  <div className="w-32 h-32 rounded-full bg-gradient-to-tr from-primary to-accent p-1">
                    <div className="w-full h-full rounded-full bg-background flex items-center justify-center overflow-hidden border-4 border-background">
                      {profile?.userDetail?.ktpImageUrl ? (
                        <img src={profile.userDetail.ktpImageUrl} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <UserIcon className="w-16 h-16 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                  <div className="absolute bottom-0 right-0 p-2 bg-primary text-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="w-4 h-4" />
                  </div>
                </div>
                <h3 className="text-xl font-bold mt-4">{profile?.name || "User"}</h3>
                <p className="text-sm text-muted-foreground">Warga Negara Indonesia</p>
                
                {profile?.isKtpVerified ? (
                  <div className="mt-6 flex items-center gap-2 px-4 py-1.5 bg-emerald-500/10 text-emerald-600 rounded-full border border-emerald-500/20">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Terverifikasi KTP</span>
                  </div>
                ) : (
                  <div className="mt-6 flex items-center gap-2 px-4 py-1.5 bg-amber-500/10 text-amber-600 rounded-full border border-amber-500/20">
                    <Shield className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Belum Verifikasi KTP</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Form Section */}
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Informasi Dasar</CardTitle>
                  <CardDescription>Detail identitas Anda sesuai KTP/Paspor.</CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="rounded-xl"
                  onClick={() => setIsEditing(!isEditing)}
                >
                  {isEditing ? "Batal" : "Edit Profil"}
                </Button>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase">Nama Lengkap</label>
                    <div className="relative">
                      <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input disabled={true} value={profile?.name || "kosong"} className="pl-10 bg-muted/30" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input disabled={true} value={profile?.email || ""} className="pl-10 bg-muted/30" />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Alamat Sesuai Domisili</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-4 w-4 h-4 text-muted-foreground" />
                    <textarea 
                      disabled={!isEditing} 
                      className="w-full min-h-[100px] bg-background border border-border rounded-xl p-3 pl-10 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all disabled:opacity-50"
                      value={profile?.userDetail?.address || ""}
                      readOnly={!isEditing}
                    />
                  </div>
                </div>

                {isEditing && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }} 
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-end"
                  >
                    <Button variant="premium">Simpan Perubahan</Button>
                  </motion.div>
                )}
              </CardContent>
            </Card>

            <Card className="border-destructive/20 bg-destructive/5">
              <CardHeader>
                <CardTitle className="text-destructive">Zona Bahaya</CardTitle>
                <CardDescription>Tindakan permanen untuk akun Anda.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="destructive" className="rounded-xl">Hapus Akun & Data Pribadi</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
