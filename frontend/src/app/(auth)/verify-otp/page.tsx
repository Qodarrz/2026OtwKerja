"use client";

import React, { useState, useEffect, Suspense } from "react";
import { authService } from "@/services/auth.service";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { 
  ShieldCheck, 
  Mail, 
  ArrowRight, 
  Loader2, 
  RefreshCcw,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";

function VerifyOtpForm() {
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [countdown, setCountdown] = useState(0);
  
  const { user, login, token } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailParam = searchParams.get("email") || user?.email || "";

  useEffect(() => {
    if (!emailParam && !user) {
      router.push("/login");
    }
  }, [emailParam, user, router]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length < 6) {
      setError("Kode OTP harus 6 digit.");
      return;
    }

    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await authService.verifyOtp(emailParam, otp);
      setSuccess("Email berhasil diverifikasi!");
      
      // Update user state with the new token
      if (response.access_token && response.user) {
        login(response.access_token, response.user);
      }

      setTimeout(() => {
        router.push("/verify-ktp");
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || "Verifikasi gagal. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;

    setIsResending(true);
    setError("");
    setSuccess("");

    try {
      await authService.resendOtp(emailParam);
      setSuccess("Kode OTP baru telah dikirim ke email Anda.");
      setCountdown(60); // 1 minute cooldown
    } catch (err: any) {
      setError(err.response?.data?.message || "Gagal mengirim ulang OTP.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="h-screen w-full bg-background flex overflow-hidden font-sans">
      <div className="w-full lg:w-[480px] xl:w-[550px] flex flex-col h-full bg-card relative z-10 border-r border-border">
        <div className="flex-1 flex flex-col justify-center px-8 sm:px-12 md:px-16 lg:px-14 xl:px-20 overflow-y-auto custom-scrollbar py-8">
          <div className="w-full max-w-sm mx-auto space-y-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="font-bold text-2xl tracking-tight">Flow<span className="text-primary">Gov</span></span>
              </div>
              <div>
                <h1 className="text-2xl xl:text-3xl font-bold">Verifikasi Email</h1>
                <p className="text-sm xl:text-base text-muted-foreground mt-1">
                  Kami telah mengirimkan kode OTP 6-digit ke <span className="font-semibold text-foreground">{emailParam}</span>
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-destructive/10 border border-destructive/20 text-destructive p-4 rounded-xl text-sm font-medium flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  {error}
                </div>
              )}
              {success && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 p-4 rounded-xl text-sm font-medium flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                  {success}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-xs xl:text-sm font-semibold text-foreground">Kode OTP</label>
                <div className="relative group">
                  <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 xl:h-5 xl:w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <input
                    type="text"
                    maxLength={6}
                    required
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    className="w-full bg-transparent border border-border rounded-xl py-3.5 pl-11 xl:pl-12 pr-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all text-center text-2xl tracking-[0.5em] font-bold"
                    placeholder="000000"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading || otp.length < 6}
                variant="premium"
                className="w-full h-12 shadow-primary/20"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Verifikasi Kode
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </Button>

              <div className="text-center space-y-4">
                <p className="text-xs xl:text-sm text-muted-foreground">
                  Tidak menerima kode?{" "}
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={isResending || countdown > 0}
                    className="font-bold text-primary hover:text-primary/80 disabled:text-muted-foreground transition-colors inline-flex items-center gap-1"
                  >
                    {isResending ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <RefreshCcw className="w-3 h-3" />
                    )}
                    {countdown > 0 ? `Kirim ulang dalam ${countdown}s` : "Kirim Ulang"}
                  </button>
                </p>
                <Link href="/login" className="block text-xs font-medium text-muted-foreground hover:text-primary transition-colors">
                  Kembali ke Halaman Masuk
                </Link>
              </div>
            </form>
          </div>
        </div>

        <div className="p-6 text-center border-t border-border hidden lg:block">
          <p className="text-[10px] text-muted-foreground font-medium tracking-tight">© 2026 FlowGov Portal Perizinan. Hak Cipta Dilindungi.</p>
        </div>
      </div>

      <div className="hidden lg:block relative flex-1 h-full bg-muted overflow-hidden">
        <img 
          alt="Verification Banner" 
          className="absolute inset-0 w-full h-full object-cover" 
          src="https://images.unsplash.com/photo-1563986768609-322da13575f3?q=80&w=2070&auto=format&fit=crop"
        />
        <div className="absolute bottom-16 left-16 right-16 text-white space-y-6 z-20">
          <div className="inline-flex items-center space-x-2 px-3 py-1.5 bg-white/10 backdrop-blur-md rounded-full border border-white/20">
            <span className="text-[10px] xl:text-xs font-bold uppercase tracking-wider">Keamanan Akun</span>
          </div>
          <h2 className="text-4xl xl:text-5xl font-bold leading-tight">
            Langkah Terakhir <br/>Verifikasi Anda.
          </h2>
          <p className="text-base xl:text-lg text-white/80 font-sans max-w-lg">Kami menjaga keamanan data Anda dengan verifikasi dua langkah yang mudah dan cepat.</p>
        </div>
      </div>
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    }>
      <VerifyOtpForm />
    </Suspense>
  );
}
