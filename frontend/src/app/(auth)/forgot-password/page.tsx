'use client';

import React, { useState } from 'react';
import { authService } from '@/services/auth.service';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Mail,
  Lock,
  ArrowRight,
  Loader2,
  ChevronLeft,
  KeyRound,
  Eye,
  EyeOff
} from 'lucide-react';
import { toast } from 'sonner';

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const router = useRouter();

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Email tidak boleh kosong');
      return;
    }
    
    setIsLoading(true);
    try {
      await authService.forgotPassword(email);
      toast.success('Jika email terdaftar, kode OTP telah dikirimkan!');
      setStep(2);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal mengirim OTP. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Kata sandi minimal 6 karakter.');
      return;
    }

    setIsLoading(true);
    try {
      await authService.resetPassword(email, otp, newPassword);
      toast.success('Kata sandi berhasil diubah! Silakan masuk kembali.');
      router.push('/login');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal mereset kata sandi. Periksa OTP Anda.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen w-full bg-background flex overflow-hidden font-sans transition-colors duration-300">
      {/* Left Section: Form */}
      <div className="w-full lg:w-120 xl:w-137.5 flex flex-col h-full bg-card relative z-10 border-r border-border">
        <div className="flex-1 flex flex-col justify-center px-8 sm:px-12 md:px-16 lg:px-14 xl:px-20 overflow-y-auto custom-scrollbar py-8">
          <div className="w-full max-w-sm mx-auto space-y-8">
            {/* Logo and Header */}
            <div className="space-y-4">
              <Link
                href="/login"
                className="flex items-center gap-2 rounded-xl text-xs font-bold text-muted-foreground hover:text-primary hover:border-primary transition-all group w-fit"
              >
                <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                Kembali ke Login
              </Link>
              <div className="flex items-center gap-2">
                <span className="font-bold text-2xl tracking-tight text-foreground">Flow<span className="text-primary">Gov</span></span>
              </div>
              <div>
                <h1 className="text-2xl xl:text-3xl font-bold text-foreground">Lupa Kata Sandi</h1>
                <p className="text-sm xl:text-base text-muted-foreground mt-1">
                  {step === 1 ? 'Masukkan email Anda untuk menerima kode OTP.' : 'Masukkan kode OTP dan kata sandi baru Anda.'}
                </p>
              </div>
            </div>

            {step === 1 ? (
              <form onSubmit={handleSendOtp} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs xl:text-sm font-semibold text-muted-foreground">Email Terdaftar</label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 xl:h-5 xl:w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-transparent border border-border rounded-xl py-3.5 pl-11 xl:pl-12 pr-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all text-sm"
                      placeholder="Masukkan alamat email Anda"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-11 xl:h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl transition-all flex items-center justify-center gap-2 group active:scale-[0.98] shadow-sm"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      Kirim Kode OTP
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs xl:text-sm font-semibold text-muted-foreground">Kode OTP</label>
                  <div className="relative group">
                    <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 xl:h-5 xl:w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <input
                      type="text"
                      required
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      className="w-full bg-transparent border border-border rounded-xl py-3.5 pl-11 xl:pl-12 pr-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all text-sm tracking-widest font-mono"
                      placeholder="Masukkan 6 digit OTP"
                      maxLength={6}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs xl:text-sm font-semibold text-muted-foreground">Kata Sandi Baru</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 xl:h-5 xl:w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full bg-transparent border border-border rounded-xl py-3.5 pl-11 xl:pl-12 pr-11 xl:pr-12 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all text-sm"
                      placeholder="Minimal 6 karakter"
                    />
                    <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors">
                      {showPassword ? <EyeOff className="w-4 h-4 xl:h-5 xl:w-5" /> : <Eye className="w-4 h-4 xl:h-5 xl:w-5" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs xl:text-sm font-semibold text-muted-foreground">Konfirmasi Kata Sandi Baru</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 xl:h-5 xl:w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full bg-transparent border border-border rounded-xl py-3.5 pl-11 xl:pl-12 pr-11 xl:pr-12 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all text-sm"
                      placeholder="Masukkan kembali kata sandi baru"
                    />
                    <button type="button" onClick={() => setShowConfirmPassword((v) => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors">
                      {showConfirmPassword ? <EyeOff className="w-4 h-4 xl:h-5 xl:w-5" /> : <Eye className="w-4 h-4 xl:h-5 xl:w-5" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-11 xl:h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl transition-all flex items-center justify-center gap-2 group active:scale-[0.98] shadow-sm"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      Ubah Kata Sandi
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 text-center border-t border-border hidden lg:block bg-card">
          <p className="text-[10px] text-muted-foreground font-medium tracking-tight">© 2026 FlowGov Portal Perizinan. Hak Cipta Dilindungi.</p>
        </div>
      </div>

      {/* Right Section: Banner */}
      <div className="hidden lg:block relative flex-1 h-full bg-card overflow-hidden pb-10">
        <div className="relative h-full w-full rounded-bl-[60px] overflow-hidden">
          <img
            alt="Government Banner"
            className="absolute inset-0 w-full h-full object-cover opacity-80"
            src="https://images.unsplash.com/photo-1449824913935-59a10b8d2000?q=80&w=2070&auto=format&fit=crop"
          />
          <div className="absolute bottom-16 left-16 right-16 text-primary-foreground space-y-6 z-20">
            <div className="inline-flex items-center space-x-2 px-3 py-1.5 bg-card/10 backdrop-blur-md rounded-full border border-white/20">
              <span className="text-[10px] xl:text-xs font-bold uppercase tracking-wider">Pelayanan Publik Prima</span>
            </div>
            <h2 className="text-4xl xl:text-5xl font-bold leading-tight">
              Akses Aman & <br />Perlindungan Data.
            </h2>
            <p className="text-base xl:text-lg text-primary-foreground/80 font-sans max-w-lg">Kami memprioritaskan keamanan akun Anda. Ikuti prosedur untuk memulihkan akses portal perizinan dengan mudah.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
