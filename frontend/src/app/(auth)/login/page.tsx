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
  Building2,
  User,
  ShieldCheck,
  Building
} from 'lucide-react';

import { motion } from 'framer-motion';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [accType, setAccType] = useState('perorangan');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
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
      
      const internalRoles = ['ADMIN', 'DOCUMENT_VALIDATOR', 'FIELD_INSPECTOR', 'LEGALIZER'];
      const hasInternalRole = response.user.roles.some(role => internalRoles.includes(role));
      
      if (hasInternalRole) {
        router.push('/dashboard');
      } else {
        router.push('/submit');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
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

      {/* Left Section: Form */}
      <motion.div 
        initial={{ x: -50, y: -50, opacity: 0 }}
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
                <h1 className="text-2xl xl:text-3xl font-bold text-foreground">Masuk Akun</h1>
                <p className="text-sm xl:text-base text-muted-foreground mt-2 leading-relaxed">Silakan masuk untuk melanjutkan akses ke layanan publik.</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-destructive/10 border border-destructive/20 text-destructive p-4 rounded-xl text-sm font-medium flex items-start gap-3 animate-shake">
                  <Shield className="w-5 h-5 shrink-0" />
                  {error}
                </div>
              )}
              {success && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-4 rounded-xl text-sm font-medium">
                  {success}
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
                  Masuk dengan Google
                </button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-3 bg-card text-muted-foreground text-xs font-medium uppercase tracking-wider">Atau masuk dengan email</span>
                  </div>
                </div>
              </div>

              {/* Account Type Selection */}
              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Jenis Akun</label>
                <div className="grid grid-cols-2 gap-3 p-1 bg-muted rounded-xl">
                  <button 
                    type="button" 
                    onClick={() => setAccType('perorangan')}
                    className={`py-2.5 px-4 text-xs xl:text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${accType === 'perorangan' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    <UserIcon className="w-4 h-4" />
                    Perorangan
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setAccType('usaha')}
                    className={`py-2.5 px-4 text-xs xl:text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${accType === 'usaha' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    <Building className="w-4 h-4" />
                    Badan Usaha
                  </button>
                </div>
              </div>

              {/* Email / Identifier */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Email atau NIK</label>
                <div className="relative group">
                  <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-foreground transition-colors" />
                  <input
                    type="text"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="clean-input pl-12"
                    placeholder="Masukkan Email atau NIK"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium text-foreground">Kata Sandi</label>
                  <Link href="/forgot-password" size="sm" className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors">
                    Lupa sandi?
                  </Link>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-foreground transition-colors" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="clean-input pl-12 pr-12"
                    placeholder="••••••••"
                  />
                  <button type="button" className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                    <Eye className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Security Code Mock */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Kode Keamanan</label>
                <div className="flex space-x-3">
                  <div className="w-24 h-12 bg-muted rounded-xl flex items-center justify-center font-bold text-lg tracking-widest text-foreground select-none border border-border">
                    5 + 3
                  </div>
                  <div className="flex-1">
                    <input 
                      type="text" 
                      className="clean-input text-center font-bold text-lg h-12" 
                      placeholder="?" 
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl transition-all flex items-center justify-center gap-2 group active:scale-[0.98]"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Masuk
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>

              <div className="text-center pt-2">
                <p className="text-sm text-muted-foreground">
                  Belum memiliki akun?{' '}
                  <Link href="/register" className="font-semibold text-foreground hover:underline underline-offset-4 decoration-2 decoration-accent/50">Daftar disini</Link>
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

      {/* Right Section: Banner (Image with gap and curve) */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="hidden lg:flex relative flex-1 h-full bg-background pb-6"
      >
        {/* Container for the image that creates the gap ONLY at bottom */}
        <motion.div 
          initial={{ x: 50, y: 50, opacity: 0 }}
          animate={{ x: 0, y: 0, opacity: 1 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
          className="relative w-full h-full bg-secondary rounded-bl-[6rem] overflow-hidden"
        >
          <div className="absolute inset-0 bg-primary/10 z-10 mix-blend-multiply" />
          <img 
            alt="Government Building" 
            className="absolute inset-0 w-full h-full object-cover object-center" 
            src="/images/government-building.jpg"
          />
          
          {/* Subtle gradient overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          
          <div className="absolute bottom-12 left-12 right-12 text-white space-y-4 z-20">
            <div className="inline-flex items-center space-x-2 px-3 py-1.5 bg-white/10 backdrop-blur-md rounded-full border border-white/20">
              <span className="text-[10px] xl:text-xs font-bold uppercase tracking-wider">Pelayanan Publik Prima</span>
            </div>
            <h2 className="text-4xl xl:text-5xl font-extrabold leading-tight">
              Solusi Perizinan <br/>Cepat & Terpercaya.
            </h2>
            <p className="text-base xl:text-lg text-white/90 font-sans max-w-md">Membangun masa depan layanan publik yang lebih efisien bagi seluruh masyarakat.</p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
