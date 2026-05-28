"use client";

import React, { useState, useEffect } from "react";
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
  ChevronLeft,
  Eye,
  EyeOff
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [num1, setNum1] = useState(0);
  const [num2, setNum2] = useState(0);
  const [captchaInput, setCaptchaInput] = useState('');

  useEffect(() => {
    setNum1(Math.floor(Math.random() * 10) + 1);
    setNum2(Math.floor(Math.random() * 10) + 1);
  }, []);

  const { login } = useAuth();
  const router = useRouter();

  const handleGoogleLogin = () => {
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/auth/google`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (parseInt(captchaInput) !== num1 + num2) {
      setError('Jawaban kode keamanan salah.');
      setIsLoading(false);
      return;
    }

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
      <div className="w-full lg:w-120 xl:w-137.5 flex flex-col h-full bg-card relative z-10 border-border lg:border-l">
        <div className="flex-1 flex flex-col justify-center px-8 sm:px-12 md:px-16 lg:px-14 xl:px-20 overflow-y-auto custom-scrollbar py-8">
          <div className="w-full max-sm mx-auto space-y-8">

            {/* Logo and Header */}
            <div className="space-y-4">
              <Link
                href="/"
                className="flex items-center gap-2 rounded-xl text-xs font-bold text-muted-foreground hover:text-primary hover:border-primary transition-all group"
              >
                <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                Kembali
              </Link>
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
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-transparent border border-border rounded-xl py-3.5 pl-11 xl:pl-12 pr-11 xl:pr-12 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all text-sm"
                    placeholder="Masukkan kata sandi"
                  />
                  <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors">
                    {showPassword ? <EyeOff className="w-4 h-4 xl:h-5 xl:w-5" /> : <Eye className="w-4 h-4 xl:h-5 xl:w-5" />}
                  </button>
                </div>
              </div>

              {/* Security Code */}
              <div className="space-y-2">
                <label className="text-xs xl:text-sm font-semibold text-foreground">Kode Keamanan</label>
                <div className="flex space-x-3">
                  <div className="w-1/2 h-11 xl:h-12 bg-muted rounded-xl flex items-center justify-center font-bold text-base xl:text-lg tracking-widest text-muted-foreground select-none border-2 border-dashed border-border">
                    {num1} + {num2}
                  </div>
                  <div className="w-1/2">
                    <input
                      type="number"
                      required
                      value={captchaInput}
                      onChange={(e) => setCaptchaInput(e.target.value)}
                      className="w-full h-11 xl:h-12 bg-transparent border border-border rounded-xl px-4 focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all text-center font-bold"
                      placeholder="Hasil"
                    />
                  </div>
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

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border"></div>
                </div>
                <div className="relative flex justify-center text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                  <span className="bg-card px-2">Atau</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGoogleLogin}
                className="w-full h-11 xl:h-12 bg-transparent border border-border hover:bg-muted text-foreground font-bold rounded-xl transition-all flex items-center justify-center gap-2 active:scale-[0.98] shadow-sm"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Daftar dengan Google
              </button>

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
      <div className="hidden lg:block relative flex-1 h-full bg-card overflow-hidden pt-10">
        <div className="relative h-full w-full rounded-tr-[60px] overflow-hidden">
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
              Kemudahan Akses <br />Dalam Genggaman.
            </h2>
            <p className="text-base xl:text-lg text-primary-foreground/80 font-sans max-w-lg">Satu akun untuk semua kebutuhan perizinan dan layanan publik Anda.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
