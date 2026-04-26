'use client';

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
  ShieldCheck,
  Building2,
  CheckCircle2,
  Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";

import { motion } from 'framer-motion';

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
    <div className="h-screen w-full bg-background flex flex-col lg:flex-row overflow-hidden font-sans bg-topography">
      
      {/* Mobile Image Header */}
      <div className="lg:hidden h-[25vh] w-full relative shrink-0">
        <img 
          alt="Government Building" 
          className="absolute inset-0 w-full h-full object-cover" 
          src="/images/government-building.jpg"
        />
        <div className="absolute inset-0 bg-primary/20 mix-blend-multiply" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-transparent" />
      </div>

      {/* Left Section: Banner (Image with gap and curve) - MOVED TO LEFT FOR REGISTER */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="hidden lg:flex relative flex-1 h-full bg-background pt-6"
      >
        {/* Container for the image that creates the gap ONLY at top */}
        <motion.div 
          initial={{ x: -50, y: -50, opacity: 0 }}
          animate={{ x: 0, y: 0, opacity: 1 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
          className="relative w-full h-full bg-secondary rounded-tr-[6rem] overflow-hidden"
        >
          <div className="absolute inset-0 bg-primary/10 z-10 mix-blend-multiply" />
          <img 
            alt="Government Building" 
            className="absolute inset-0 w-full h-full object-cover object-center" 
            src="/images/government-building.jpg"
          />
          
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          
          <div className="absolute bottom-12 left-12 right-12 text-white space-y-4 z-20">
            <div className="inline-flex items-center space-x-2 px-3 py-1.5 bg-white/10 backdrop-blur-md rounded-full border border-white/20">
              <span className="text-[10px] xl:text-xs font-bold uppercase tracking-wider">Akses Penuh Layanan</span>
            </div>
            <h2 className="text-4xl xl:text-5xl font-extrabold leading-tight">
              Satu Akun <br/>Beragam Manfaat.
            </h2>
            <p className="text-base xl:text-lg text-white/90 font-sans max-w-md">Mulai perjalanan Anda dengan membuat akun. Dapatkan kemudahan melacak dokumen, mengecek tata ruang, dan berkonsultasi langsung.</p>
          </div>
        </motion.div>
      </motion.div>

      {/* Right Section: Form - MOVED TO RIGHT FOR REGISTER */}
      <motion.div 
        initial={{ x: 50, y: 50, opacity: 0 }}
        animate={{ x: 0, y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="w-full lg:w-[480px] xl:w-[500px] flex flex-col h-full bg-card relative z-10 lg:rounded-none rounded-t-[2rem] -mt-8 lg:mt-0 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] lg:shadow-none"
      >
        <div className="flex-1 flex flex-col justify-center px-8 sm:px-12 lg:px-12 xl:px-14 overflow-y-auto custom-scrollbar py-8">
          <div className="w-full max-w-sm mx-auto space-y-8">
            {/* Logo and Header */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-8">
                <img 
                  src="/images/logo-gov.svg" 
                  alt="Logo Instansi" 
                  className="w-12 h-12"
                />
                <div className="flex flex-col">
                  <span className="font-extrabold text-xl tracking-tight text-foreground leading-none">
                    Portal<span className="text-primary font-medium">Perizinan</span>
                  </span>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">Republik Indonesia</span>
                </div>
              </div>
              <div>
                <h1 className="text-2xl xl:text-3xl font-bold text-foreground">Daftar Akun</h1>
                <p className="text-sm xl:text-base text-muted-foreground mt-2 leading-relaxed">Buat akun baru untuk mulai mengakses layanan publik.</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-destructive/10 border border-destructive/20 text-destructive p-4 rounded-xl text-sm font-medium flex items-start gap-3 animate-shake">
                  <Shield className="w-5 h-5 shrink-0" />
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <button
                  type="button"
                  onClick={() => window.location.href = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/auth/google`}
                  className="w-full h-12 bg-card border border-border hover:bg-muted text-foreground font-medium rounded-xl transition-all flex items-center justify-center gap-3"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Daftar dengan Google
                </button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-3 bg-card text-muted-foreground text-xs font-medium uppercase tracking-wider">Atau daftar dengan email</span>
                  </div>
                </div>
              </div>

              {/* Name */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Nama Lengkap</label>
                <div className="relative group">
                  <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-foreground transition-colors" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="clean-input pl-12"
                    placeholder="Sesuai identitas resmi"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Email</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-foreground transition-colors" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="clean-input pl-12"
                    placeholder="contoh@email.com"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Kata Sandi</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-foreground transition-colors" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="clean-input pl-12 pr-12"
                    placeholder="Minimal 8 karakter"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Daftar Sekarang
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </Button>

              <div className="text-center pt-2">
                <p className="text-sm text-muted-foreground">
                  Sudah memiliki akun?{" "}
                  <Link href="/login" className="font-semibold text-foreground hover:underline underline-offset-4 decoration-2 decoration-accent/50">Masuk disini</Link>
                </p>
              </div>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 text-center border-t border-border hidden lg:block">
          <p className="text-[10px] text-muted-foreground font-medium tracking-tight">© 2026 Portal Pelayanan Publik Perizinan. Hak Cipta Dilindungi.</p>
        </div>
      </motion.div>
    </div>
  );
}
