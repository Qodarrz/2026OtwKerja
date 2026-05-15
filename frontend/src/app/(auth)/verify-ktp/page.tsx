'use client';

import React, { useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { 
  ShieldCheck, 
  Upload, 
  Camera, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Scan,
  User,
  MapPin,
  Calendar,
  CreditCard,
  ArrowRight
} from 'lucide-react';

interface KtpData {
  nik: string;
  fullName: string;
  birthDate: string;
  birthPlace: string;
  gender: string;
  address: string;
  ktpImageUrl: string;
}

export default function VerifyKtpPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [step, setStep] = useState<'upload' | 'scanning' | 'confirm'>('upload');
  const [extractedData, setExtractedData] = useState<KtpData | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const { user, login } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
      setError(null);
    }
  };

  const startScanning = async () => {
    if (!file) {  
      setError('Silakan pilih foto KTP terlebih dahulu.');
      return;
    }

    setStep('scanning');
    setIsScanning(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/auth/ktp/upload`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      if (!response.ok) throw new Error('Gagal memproses KTP');

      const result = await response.json();
      setExtractedData(result.data);
      setStep('confirm');
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat memproses OCR.');
      setStep('upload');
    } finally {
      setIsScanning(false);
    }
  };

  const confirmVerification = async () => {
    if (!extractedData) return;

    setIsConfirming(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/auth/ktp/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(extractedData)
      });

      if (!response.ok) throw new Error('Gagal memverifikasi KTP');

      const result = await response.json();
      
      
      if (result.access_token && result.user) {
        login(result.access_token, result.user);
      }
      
      router.push('/submit');
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat konfirmasi.');
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 font-sans">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-10 space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 bjg-indigo-600 rounded-2xl shadow-md shadow-sm mb-4">
            <ShieldCheck className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Verifikasi Identitas</h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            Satu langkah lagi untuk mengaktifkan akun Anda secara penuh. Silakan verifikasi KTP Anda.
          </p>
        </div>
        <div className="bg-card rounded-3xl shadow-lg shadow-sm overflow-hidden border border-border">
          <div className="h-1.5 w-full bg-secondary flex">
            <div className={`h-full transition-all duration-500 bg-primary ${step === 'upload' ? 'w-1/3' : step === 'scanning' ? 'w-2/3' : 'w-full'}`} />
          </div>

          <div className="p-8 sm:p-10">
            {step === 'upload' && (
              <div className="space-y-8">
                <div className="text-center">
                  <h2 className="text-xl font-bold text-foreground mb-2">Unggah Foto KTP</h2>
                  <p className="text-sm text-muted-foreground">Pastikan foto terlihat jelas, tidak blur, dan tidak terpotong.</p>
                </div>

                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative group cursor-pointer border-2 border-dashed rounded-3xl p-10 transition-all duration-300 flex flex-col items-center justify-center space-y-4 ${preview ? 'border-primary bg-indigo-50/30' : 'border-border hover:border-indigo-400 hover:bg-accent'}`}
                >
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    accept="image/*" 
                    className="hidden" 
                  />
                  
                  {preview ? (
                    <div className="relative w-full aspect-[3/2] max-w-sm rounded-2xl overflow-hidden shadow-lg border-4 border-white">
                      <img src={preview} alt="KTP Preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-foreground/20 group-hover:bg-foreground/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <Camera className="w-8 h-8 text-primary-foreground" />
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <Upload className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                      <div className="text-center">
                        <p className="text-base font-semibold text-foreground">Klik untuk pilih atau tarik file</p>
                        <p className="text-xs text-muted-foreground mt-1">PNG, JPG atau JPEG (Maks. 5MB)</p>
                      </div>
                    </>
                  )}
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-2xl text-sm font-medium flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    {error}
                  </div>
                )}

                <div className="pt-4 space-y-3">
                  <button
                    onClick={startScanning}
                    disabled={!file || isScanning}
                    className="w-full h-14 bg-primary hover:bg-primary/90 disabled:bg-gray-200 disabled:text-muted-foreground text-primary-foreground font-bold rounded-2xl transition-all flex items-center justify-center gap-3 shadow-lg shadow-sm active:scale-[0.98]"
                  >
                    {isScanning ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Mulai Verifikasi <ArrowRight className="w-5 h-5" /></>}
                  </button>
                  <button
                    onClick={() => router.push('/submit')}
                    className="w-full h-12 bg-card hover:bg-accent text-muted-foreground font-medium rounded-2xl transition-all border border-border flex items-center justify-center"
                  >
                    Lewati untuk sekarang
                  </button>
                </div>
              </div>
            )}

            {step === 'scanning' && (
              <div className="py-12 space-y-10 text-center">
                <div className="relative w-48 h-48 mx-auto">
                  {/* Pulse Effect */}
                  <div className="absolute inset-0 bg-primary/10 rounded-full animate-ping" />
                  <div className="absolute inset-4 bg-primary/20 rounded-full animate-pulse" />
                  
                  <div className="relative z-10 w-full h-full bg-card rounded-full border-4 border-indigo-50 flex items-center justify-center overflow-hidden">
                    <Scan className="w-20 h-20 text-primary animate-pulse" />
                    {/* Scanning Line */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-primary shadow-[0_0_15px_rgba(79,70,229,0.5)] animate-scan" />
                  </div>
                </div>
                
                <div className="space-y-3">
                  <h2 className="text-2xl font-bold text-foreground">Menganalisa Data...</h2>
                  <p className="text-muted-foreground">Sistem AI kami sedang mengekstrak informasi dari KTP Anda secara otomatis.</p>
                </div>

                <div className="flex justify-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}

            {step === 'confirm' && extractedData && (
              <div className="space-y-8">
                <div className="flex items-center gap-4 bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
                  <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-bold text-emerald-900 text-sm">Data Berhasil Diekstrak</h3>
                    <p className="text-emerald-700 text-xs">Silakan periksa kembali kecocokan data Anda.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-primary" /> NIK
                    </label>
                    <input 
                      type="text"
                      value={extractedData.nik}
                      onChange={(e) => setExtractedData({...extractedData, nik: e.target.value})}
                      className="w-full h-12 bg-muted border border-border rounded-xl px-4 text-sm font-semibold focus:ring-2 focus:ring-primary outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                      <User className="w-4 h-4 text-primary" /> Nama Lengkap
                    </label>
                    <input 
                      type="text"
                      value={extractedData.fullName}
                      onChange={(e) => setExtractedData({...extractedData, fullName: e.target.value})}
                      className="w-full h-12 bg-muted border border-border rounded-xl px-4 text-sm font-semibold focus:ring-2 focus:ring-primary outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-primary" /> Tempat Lahir
                    </label>
                    <input 
                      type="text"
                      value={extractedData.birthPlace}
                      onChange={(e) => setExtractedData({...extractedData, birthPlace: e.target.value})}
                      className="w-full h-12 bg-muted border border-border rounded-xl px-4 text-sm font-semibold focus:ring-2 focus:ring-primary outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-primary" /> Tanggal Lahir
                    </label>
                    <input 
                      type="text"
                      value={extractedData.birthDate}
                      onChange={(e) => setExtractedData({...extractedData, birthDate: e.target.value})}
                      className="w-full h-12 bg-muted border border-border rounded-xl px-4 text-sm font-semibold focus:ring-2 focus:ring-primary outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                      <FileText className="w-4 h-4 text-primary" /> Jenis Kelamin
                    </label>
                    <select 
                      value={extractedData.gender}
                      onChange={(e) => setExtractedData({...extractedData, gender: e.target.value})}
                      className="w-full h-12 bg-muted border border-border rounded-xl px-4 text-sm font-semibold focus:ring-2 focus:ring-primary outline-none transition-all appearance-none"
                    >
                      <option value="LAKI-LAKI">LAKI-LAKI</option>
                      <option value="PEREMPUAN">PEREMPUAN</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2 space-y-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-primary" /> Alamat
                    </label>
                    <textarea 
                      value={extractedData.address}
                      onChange={(e) => setExtractedData({...extractedData, address: e.target.value})}
                      rows={3}
                      className="w-full bg-muted border border-border rounded-xl p-4 text-sm font-semibold focus:ring-2 focus:ring-primary outline-none transition-all resize-none"
                    />
                  </div>
                </div>

                <div className="pt-4 space-y-3">
                  <button
                    onClick={confirmVerification}
                    disabled={isConfirming}
                    className="w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-sm active:scale-[0.98]"
                  >
                    {isConfirming ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Konfirmasi & Selesai <CheckCircle2 className="w-5 h-5" /></>}
                  </button>
                  <button
                    onClick={() => setStep('upload')}
                    disabled={isConfirming}
                    className="w-full h-12 bg-card hover:bg-accent text-muted-foreground font-semibold rounded-2xl transition-all border border-border"
                  >
                    Foto Ulang
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Security Notice */}
        <p className="mt-8 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
          <ShieldCheck className="w-3 h-3" /> Data identitas Anda dienkripsi dan disimpan secara aman sesuai kebijakan privasi.
        </p>
      </div>

      <style jsx global>{`
        @keyframes scan {
          0% { top: 0%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        .animate-scan {
          animation: scan 2s linear infinite;
        }
      `}</style>
    </div>
  );
}

function DataField({ label, value, icon }: { label: string, value: string, icon: React.ReactNode }) {
  return (
    <div className="p-4 bg-muted rounded-2xl border border-border space-y-1">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-sm font-bold text-foreground truncate">{value}</p>
    </div>
  );
}
