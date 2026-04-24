"use client";

import React, { useState } from "react";
import { authService } from "@/services/auth.service";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  UserPlus, 
  Mail, 
  Lock, 
  User as UserIcon, 
  ArrowRight, 
  Loader2, 
  ShieldCheck 
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      await authService.register(email, name, password);
      router.push("/login?registered=true");
    } catch (err: any) {
      setError(err.response?.data?.message || "Pendaftaran gagal. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen w-full bg-background flex overflow-hidden font-sans">
      {/* Left Section: Form */}
      <div className="w-full lg:w-[480px] xl:w-[550px] flex flex-col h-full bg-card relative z-10 border-r border-border">
        <div className="flex-1 flex flex-col justify-center px-8 sm:px-12 md:px-16 lg:px-14 xl:px-20 overflow-y-auto custom-scrollbar py-8">
          <div className="w-full max-w-sm mx-auto space-y-8">
            {/* Logo and Header */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
                  <ShieldCheck className="w-6 h-6 text-white" />
                </div>
                <span className="font-bold text-2xl tracking-tight">Flow<span className="text-indigo-600">Gov</span></span>
              </div>
              <div>
                <h1 className="text-2xl xl:text-3xl font-bold">Daftar Akun</h1>
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
                  <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 xl:h-5 xl:w-5 text-muted-foreground group-focus-within:text-indigo-600 transition-colors" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-transparent border border-border rounded-xl py-3.5 pl-11 xl:pl-12 pr-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-600 transition-all text-sm"
                    placeholder="Masukkan nama lengkap anda"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label className="text-xs xl:text-sm font-semibold text-foreground">Email</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 xl:h-5 xl:w-5 text-muted-foreground group-focus-within:text-indigo-600 transition-colors" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-transparent border border-border rounded-xl py-3.5 pl-11 xl:pl-12 pr-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-600 transition-all text-sm"
                    placeholder="Masukkan alamat email anda"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label className="text-xs xl:text-sm font-semibold text-foreground">Kata Sandi</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 xl:h-5 xl:w-5 text-muted-foreground group-focus-within:text-indigo-600 transition-colors" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-transparent border border-border rounded-xl py-3.5 pl-11 xl:pl-12 pr-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-600 transition-all text-sm"
                    placeholder="Buat kata sandi baru"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                variant="premium"
                className="w-full h-12 shadow-indigo-200"
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
                  <Link href="/login" className="font-bold text-indigo-600 hover:text-indigo-700">Masuk</Link>
                </p>
              </div>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 text-center border-t border-border hidden lg:block">
          <p className="text-[10px] text-muted-foreground font-medium tracking-tight">© 2026 FlowGov Portal Perizinan. Hak Cipta Dilindungi.</p>
        </div>
      </div>

      {/* Right Section: Banner */}
      <div className="hidden lg:block relative flex-1 h-full bg-muted overflow-hidden">
        <div className="absolute inset-0 bg-indigo-900/60 z-10" />
        <img 
          alt="Government Banner" 
          className="absolute inset-0 w-full h-full object-cover rounded-tl-[60px]" 
          src="https://images.unsplash.com/photo-1596422846543-75c6fc18a594?q=80&w=2070&auto=format&fit=crop"
        />
        <div className="absolute bottom-16 left-16 right-16 text-white space-y-6 z-20">
          <div className="inline-flex items-center space-x-2 px-3 py-1.5 bg-white/10 backdrop-blur-md rounded-full border border-white/20">
            <span className="text-[10px] xl:text-xs font-bold uppercase tracking-wider">Registrasi Mandiri</span>
          </div>
          <h2 className="text-4xl xl:text-5xl font-bold leading-tight">
            Kemudahan Akses <br/>Dalam Genggaman.
          </h2>
          <p className="text-base xl:text-lg text-indigo-50/90 font-sans max-w-lg">Satu akun untuk semua kebutuhan perizinan dan layanan publik Anda.</p>
        </div>
      </div>
    </div>
  );
}
