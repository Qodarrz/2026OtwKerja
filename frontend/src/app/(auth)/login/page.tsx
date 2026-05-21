'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { authService } from '@/services/auth.service';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  LogIn,
  Mail,
  Lock,
  ArrowRight,
  Loader2,
  Shield,
  User as UserIcon,
  Eye,
  EyeOff,
  Building2,
  ShieldCheck,
  ChevronLeft
} from 'lucide-react';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [accType, setAccType] = useState('perorangan');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get('registered')) {
      setSuccess('Account created successfully! Please login.');
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await authService.login(email, password);
      login(response.access_token, response.user);

      // Let AuthContext handle the redirection via its useEffect
      // or provide a hint for immediate redirection
      const isInternal = response.user.roles.some(role =>
        ['ADMIN', 'DOCUMENT_VALIDATOR', 'FIELD_INSPECTOR', 'LEGALIZER'].includes(role)
      );

      if (!response.user.verify_gmail) {
        router.push(`/verify-otp?email=${encodeURIComponent(email)}`);
      } else if (isInternal) {
        router.push('/dashboard');
      } else if (!response.user.isKtpVerified) {
        router.push('/verify-ktp');
      } else {
        router.push('/');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
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
                <h1 className="text-2xl xl:text-3xl font-bold text-foreground">Masuk Akun</h1>
                <p className="text-sm xl:text-base text-muted-foreground mt-1">Silakan masuk untuk melanjutkan akses ke portal perizinan.</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-destructive/10 border border-destructive/20 text-destructive p-4 rounded-xl text-sm font-medium">
                  {error}
                </div>
              )}
              {success && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 p-4 rounded-xl text-sm font-medium">
                  {success}
                </div>
              )}

              {/* Account Type Selection */}
              <div className="space-y-3">
                <label className="text-xs xl:text-sm font-semibold text-muted-foreground">Jenis Akun</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setAccType('perorangan')}
                    className={`py-2.5 px-4 text-xs xl:text-sm font-medium rounded-xl border transition-all ${accType === 'perorangan' ? 'bg-primary/10 border-primary text-primary' : 'bg-transparent border-border text-muted-foreground hover:bg-muted'}`}
                  >
                    Perorangan
                  </button>
                  <button
                    type="button"
                    onClick={() => setAccType('usaha')}
                    className={`py-2.5 px-4 text-xs xl:text-sm font-medium rounded-xl border transition-all ${accType === 'usaha' ? 'bg-primary/10 border-primary text-primary' : 'bg-transparent border-border text-muted-foreground hover:bg-muted'}`}
                  >
                    Badan Usaha
                  </button>
                </div>
              </div>

              {/* Email / Identifier */}
              <div className="space-y-2">
                <label className="text-xs xl:text-sm font-semibold text-muted-foreground">Email atau NIK</label>
                <div className="relative group">
                  <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 xl:h-5 xl:w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <input
                    type="text"
                    name="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-transparent border border-border rounded-xl py-3.5 pl-11 xl:pl-12 pr-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all text-sm"
                    placeholder="Masukkan Email atau NIK anda"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs xl:text-sm font-semibold text-muted-foreground">Kata Sandi</label>
                  <Link href="/forgot-password" className="text-[10px] xl:text-xs font-bold text-primary hover:text-primary/80 transition-colors">
                    Lupa sandi?
                  </Link>
                </div>
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

              {/* Security Code Mock */}
              <div className="space-y-2">
                <label className="text-xs xl:text-sm font-semibold text-muted-foreground">Kode Keamanan</label>
                <div className="flex space-x-3">
                  <div className="w-1/2 h-11 xl:h-12 bg-muted rounded-xl flex items-center justify-center font-bold text-base xl:text-lg tracking-widest text-muted-foreground select-none border-2 border-dashed border-border">
                    5 + 3
                  </div>
                  <div className="w-1/2">
                    <input
                      type="text"
                      className="w-full h-11 xl:h-12 bg-transparent border border-border rounded-xl px-4 focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all text-center font-bold"
                      placeholder="Hasil"
                    />
                  </div>
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
                    Masuk Sekarang
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>

              <div className="text-center">
                <p className="text-xs xl:text-sm text-muted-foreground font-sans">
                  Belum punya akun?{' '}
                  <Link href="/register" className="font-bold text-primary hover:text-primary/80">Daftar</Link>
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
              Solusi Perizinan <br />Cepat & Terpercaya.
            </h2>
            <p className="text-base xl:text-lg text-primary-foreground/80 font-sans max-w-lg">Membangun masa depan layanan publik yang lebih efisien bagi seluruh masyarakat.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-card">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
