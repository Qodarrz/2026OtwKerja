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
  ShieldCheck
} from 'lucide-react';

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
    <div className="h-screen w-full bg-white flex overflow-hidden font-sans">
      {/* Left Section: Form */}
      <div className="w-full lg:w-[480px] xl:w-[550px] flex flex-col h-full bg-white relative z-10">
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
                <h1 className="text-2xl xl:text-3xl font-bold text-gray-900">Masuk Akun</h1>
                <p className="text-sm xl:text-base text-gray-500 mt-1">Silakan masuk untuk melanjutkan akses ke portal perizinan.</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-xl text-sm font-medium">
                  {error}
                </div>
              )}
              {success && (
                <div className="bg-emerald-50 border border-emerald-100 text-emerald-600 p-4 rounded-xl text-sm font-medium">
                  {success}
                </div>
              )}

              {/* Account Type Selection */}
              <div className="space-y-3">
                <label className="text-xs xl:text-sm font-semibold text-gray-700">Jenis Akun</label>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    type="button" 
                    onClick={() => setAccType('perorangan')}
                    className={`py-2.5 px-4 text-xs xl:text-sm font-medium rounded-xl border transition-all ${accType === 'perorangan' ? 'bg-blue-50 border-blue-600 text-blue-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                  >
                    Perorangan
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setAccType('usaha')}
                    className={`py-2.5 px-4 text-xs xl:text-sm font-medium rounded-xl border transition-all ${accType === 'usaha' ? 'bg-blue-50 border-blue-600 text-blue-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                  >
                    Badan Usaha
                  </button>
                </div>
              </div>

              {/* Email / Identifier */}
              <div className="space-y-2">
                <label className="text-xs xl:text-sm font-semibold text-gray-700">Email atau NIK</label>
                <div className="relative group">
                  <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 xl:h-5 xl:w-5 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                  <input
                    type="text"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-transparent border border-gray-200 rounded-xl py-3.5 pl-11 xl:pl-12 pr-4 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-600 transition-all text-sm"
                    placeholder="Masukkan Email atau NIK anda"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs xl:text-sm font-semibold text-gray-700">Kata Sandi</label>
                  <Link href="/forgot-password" size="sm" className="text-[10px] xl:text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors">
                    Lupa sandi?
                  </Link>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 xl:h-5 xl:w-5 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-transparent border border-gray-200 rounded-xl py-3.5 pl-11 xl:pl-12 pr-11 xl:pr-12 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-600 transition-all text-sm"
                    placeholder="Masukkan kata sandi"
                  />
                  <button type="button" className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600 transition-colors">
                    <Eye className="w-4 h-4 xl:h-5 xl:w-5" />
                  </button>
                </div>
              </div>

              {/* Security Code Mock */}
              <div className="space-y-2">
                <label className="text-xs xl:text-sm font-semibold text-gray-700">Kode Keamanan</label>
                <div className="flex space-x-3">
                  <div className="w-1/2 h-11 xl:h-12 bg-gray-50 rounded-xl flex items-center justify-center font-bold text-base xl:text-lg tracking-widest text-gray-700 select-none border-2 border-dashed border-gray-200/60">
                    5 + 3
                  </div>
                  <div className="w-1/2">
                    <input 
                      type="text" 
                      className="w-full h-11 xl:h-12 bg-transparent border border-gray-200 rounded-xl px-4 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-600 transition-all text-center font-bold" 
                      placeholder="Hasil" 
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 xl:h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 group active:scale-[0.98] shadow-lg shadow-indigo-200"
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
                <p className="text-xs xl:text-sm text-gray-500 font-sans">
                  Belum punya akun?{' '}
                  <Link href="/register" className="font-bold text-blue-600 hover:text-blue-700">Daftar</Link>
                </p>
              </div>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 text-center border-t border-gray-50 hidden lg:block">
          <p className="text-[10px] text-gray-400 font-medium tracking-tight">© 2026 FlowGov Portal Perizinan. Hak Cipta Dilindungi.</p>
        </div>
      </div>

      {/* Right Section: Banner */}
      <div className="hidden lg:block relative flex-1 h-full bg-gray-100 overflow-hidden">
        {/* Placeholder for city image */}
        <div className="absolute inset-0 bg-blue-900/60 z-10" />
        <img 
          alt="Government Banner" 
          className="absolute inset-0 w-full h-full object-cover rounded-tl-[60px]" 
          src="https://images.unsplash.com/photo-1596422846543-75c6fc18a594?q=80&w=2070&auto=format&fit=crop"
        />
        <div className="absolute bottom-16 left-16 right-16 text-white space-y-6 z-20">
          <div className="inline-flex items-center space-x-2 px-3 py-1.5 bg-white/10 backdrop-blur-md rounded-full border border-white/20">
            <span className="text-[10px] xl:text-xs font-bold uppercase tracking-wider">Pelayanan Publik Prima</span>
          </div>
          <h2 className="text-4xl xl:text-5xl font-bold leading-tight">
            Solusi Perizinan <br/>Cepat & Terpercaya.
          </h2>
          <p className="text-base xl:text-lg text-indigo-50/90 font-sans max-w-lg">Membangun masa depan layanan publik yang lebih efisien bagi seluruh masyarakat.</p>
        </div>
      </div>
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
