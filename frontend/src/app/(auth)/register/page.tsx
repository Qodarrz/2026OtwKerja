"use client";

import React, { useState } from "react";
import { authService } from "@/services/auth.service";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  UserPlus, 
  Mail, 
  Lock, 
  User as UserIcon, 
  ArrowRight, 
  Loader2, 
  ShieldCheck,
  ChevronLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await authService.register(email, name, password);
      if (response.access_token && response.user) {
        login(response.access_token, response.user);
        router.push(`/verify-otp?email=${encodeURIComponent(email)}`);
      } else {
        router.push(`/login?registered=true&email=${encodeURIComponent(email)}`);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Pendaftaran gagal. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen w-full bg-background flex overflow-hidden font-sans transition-colors duration-300 lg:flex-row-reverse">
      {/* Back to Home Button */}
      <Link 
        href="/" 
        className="absolute top-8 left-8 z-50 flex items-center gap-2 px-4 py-2 bg-card/80 backdrop-blur-md border border-border rounded-xl text-xs font-bold text-muted-foreground hover:text-primary hover:border-primary transition-all group"
      >
        <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Kembali ke Beranda
      </Link>

      {/* Left Section: Form */}
      <div className="w-full lg:w-[480px] xl:w-[550px] flex flex-col h-full bg-card relative z-10 border-border lg:border-l">
        <div className="flex-1 flex flex-col justify-center px-8 sm:px-12 md:px-16 lg:px-14 xl:px-20 overflow-y-auto custom-scrollbar py-8">
          <div className="w-full max-sm mx-auto space-y-8">
            {/* Logo and Header */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="font-bold text-2xl tracking-tight text-foreground">Flow<span className="text-primary">Gov</span></span>
              </div>
              <div>
                <h1 className="text-2xl xl:text-3xl font-bold text-foreground">Daftar Akun</h1>
                <p className="text-sm xl:text-base text-muted-foreground mt-1">Buat akun baru untuk mulai mengakses layanan publik.</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-destructive/10 border border-destructive/20 text-destructive p-4 rounded-xl text-sm font-medium">
                  {error}
                </div>
              )}

              {/* Name */}
              <div className="space-y-2">
                <label className="text-xs xl:text-sm font-semibold text-foreground">Nama Lengkap</label>
                <div className="relative group">
                  <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 xl:h-5 xl:w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <input
                    type="text"
                    name="name"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-transparent border border-border rounded-xl py-3.5 pl-11 xl:pl-12 pr-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all text-sm"
                    placeholder="Masukkan nama lengkap anda"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label className="text-xs xl:text-sm font-semibold text-foreground">Email</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 xl:h-5 xl:w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <input
                    type="email"
                    name="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-transparent border border-border rounded-xl py-3.5 pl-11 xl:pl-12 pr-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all text-sm"
                    placeholder="Masukkan alamat email anda"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label className="text-xs xl:text-sm font-semibold text-foreground">Kata Sandi</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 xl:h-5 xl:w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <input
                    type="password"
                    name="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-transparent border border-border rounded-xl py-3.5 pl-11 xl:pl-12 pr-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all text-sm"
                    placeholder="Buat kata sandi baru"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                variant="premium"
                className="w-full h-12 shadow-sm"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Daftar Sekarang
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </Button>

              <div className="text-center">
                <p className="text-xs xl:text-sm text-muted-foreground">
                  Sudah punya akun?{" "}
                  <Link href="/login" className="font-bold text-primary hover:text-primary/80">Masuk</Link>
                </p>
              </div>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 text-center border-t border-border hidden lg:block bg-card">
          <p className="text-[10px] text-muted-foreground font-medium tracking-tight">© 2026 FlowGov Portal Perizinan. Hak Cipta Dilindungi.</p>
        </div>
      </div>

      {/* Right Section: Banner */}
      <div className="hidden lg:block relative flex-1 h-full bg-muted overflow-hidden pt-10">
        <div className="relative h-[calc(100%-2.5rem)] w-full rounded-tr-[60px] overflow-hidden">
          <img
            alt="Government Banner"
            className="absolute inset-0 w-full h-full object-cover"
            src="https://images.unsplash.com/photo-1541746972996-4e0b0f43e02a?q=80&w=2070&auto=format&fit=crop"
          />
          <div className="absolute bottom-16 left-16 right-16 text-primary-foreground space-y-6 z-20">
            <div className="inline-flex items-center space-x-2 px-3 py-1.5 bg-card/10 backdrop-blur-md rounded-full border border-white/20">
              <span className="text-[10px] xl:text-xs font-bold uppercase tracking-wider">Registrasi Mandiri</span>
            </div>
            <h2 className="text-4xl xl:text-5xl font-bold leading-tight">
              Kemudahan Akses <br/>Dalam Genggaman.
            </h2>
            <p className="text-base xl:text-lg text-primary-foreground/80 font-sans max-w-lg">Satu akun untuk semua kebutuhan perizinan dan layanan publik Anda.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
