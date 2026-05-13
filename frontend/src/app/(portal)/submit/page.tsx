"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { 
  Building2, 
  Map as MapIcon, 
  FileCheck, 
  ChevronRight, 
  ChevronLeft,
  AlertTriangle,
  CheckCircle2,
  Wallet,
  ShieldCheck
} from "lucide-react";
import dynamic from "next/dynamic";
import { cn, formatCurrency } from "@/lib/utils";

// Dynamically import map to avoid SSR issues
const MapPicker = dynamic(() => import("@/components/map/MapPicker"), { 
  ssr: false,
  loading: () => <div className="w-full h-[500px] bg-muted animate-pulse rounded-3xl flex items-center justify-center">Loading Map...</div>
});

const STEPS = [
  { id: 1, title: "Informasi", icon: Building2 },
  { id: 2, title: "Pemetaan", icon: MapIcon },
  { id: 3, title: "Review", icon: FileCheck },
];

export default function SubmitPermitPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    type: "Residensial",
    address: "",
    area: 0,
    points: [] as [number, number][],
  });

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  const estimatedNJOP = formData.area * 2500000; // Mock calculation
  const hasOverlap = formData.area > 5000; // Mock logic

  return (
    <div className="space-y-10">
      <div className="max-w-4xl mx-auto">
        {/* Stepper */}
        <div className="flex justify-between mb-12 relative">
          <div className="absolute top-1/2 left-0 w-full h-[2px] bg-muted -z-10 -translate-y-1/2" />
          {STEPS.map((step) => {
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;
            return (
              <div key={step.id} className="flex flex-col items-center gap-3">
                <div 
                  className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 border-2",
                    isActive ? "bg-primary border-primary text-white scale-110 shadow-lg shadow-primary/20" : 
                    isCompleted ? "bg-emerald-500 border-emerald-500 text-white" : 
                    "bg-background border-muted text-muted-foreground"
                  )}
                >
                  {isCompleted ? <CheckCircle2 className="w-6 h-6" /> : <step.icon className="w-6 h-6" />}
                </div>
                <span className={cn("text-xs font-bold uppercase tracking-wider", isActive ? "text-primary" : "text-muted-foreground")}>
                  {step.title}
                </span>
              </div>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {currentStep === 1 && (
              <Card>
                <CardHeader>
                  <CardTitle>Detail Bangunan</CardTitle>
                  <CardDescription>Masukkan informasi dasar mengenai rencana pembangunan Anda.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold">Nama Proyek</label>
                    <Input 
                      placeholder="Contoh: Rumah Tinggal Bp. Budi" 
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-bold">Tipe Bangunan</label>
                      <select 
                        className="w-full h-12 rounded-xl border border-input bg-background px-4 py-2"
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      >
                        <option>Residensial</option>
                        <option>Komersial</option>
                        <option>Industri</option>
                        <option>Sosial & Budaya</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold">Luas Perkiraan (m²)</label>
                      <Input type="number" placeholder="Contoh: 100" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold">Alamat Lokasi</label>
                    <Input 
                      placeholder="Jl. Thamrin No. 1, Jakarta Pusat" 
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {currentStep === 2 && (
              <Card>
                <CardHeader>
                  <CardTitle>Pemetaan Interaktif</CardTitle>
                  <CardDescription>Gambarkan batas lahan Anda pada peta di bawah ini untuk kalkulasi presisi.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <MapPicker 
                    onAreaChange={(points, area) => setFormData({ ...formData, points, area })} 
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div className="p-4 rounded-2xl bg-muted/50 border border-border">
                      <span className="text-xs font-bold text-muted-foreground uppercase">Luas Lahan Terdeteksi</span>
                      <p className="text-2xl font-bold">{Math.round(formData.area).toLocaleString()} m²</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {currentStep === 3 && (
              <div className="space-y-6">
                <Card className={cn(hasOverlap ? "border-destructive/50 bg-destructive/5" : "border-emerald-500/50 bg-emerald-50/5")}>
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      {hasOverlap ? (
                        <>
                          <div className="p-3 bg-destructive/10 rounded-2xl text-destructive">
                            <AlertTriangle className="w-8 h-8" />
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-destructive">Konflik Lahan Terdeteksi</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                              Sistem mendeteksi area yang Anda pilih tumpang tindih dengan Hak Guna Bangunan (HGB) milik PT. Pembangunan Jaya.
                            </p>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="p-3 bg-emerald-100 rounded-2xl text-emerald-600">
                            <CheckCircle2 className="w-8 h-8" />
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-emerald-700">Lahan Clean & Clear</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                              Tidak ditemukan tumpang tindih dengan hak tanah orang lain.
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Wallet className="w-6 h-6 text-primary" />
                      Estimasi Biaya & NJOP
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between p-4 rounded-2xl bg-muted/30">
                      <span className="text-muted-foreground">Estimasi NJOP Lahan</span>
                      <span className="font-bold">{formatCurrency(estimatedNJOP)}</span>
                    </div>
                    <div className="pt-4 border-t border-dashed flex justify-between items-center">
                      <span className="text-lg font-bold">Total Pembayaran Awal</span>
                      <span className="text-2xl font-black text-primary">{formatCurrency(estimatedNJOP)}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-12">
          <Button 
            variant="ghost" 
            onClick={prevStep} 
            disabled={currentStep === 1}
            className="rounded-xl"
          >
            <ChevronLeft className="mr-2 w-4 h-4" /> Kembali
          </Button>
          
          {currentStep < STEPS.length ? (
            <Button onClick={nextStep} className="rounded-xl group">
              Lanjut
              <ChevronRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          ) : (
            <Button variant="premium" className="rounded-xl shadow-xl" disabled={hasOverlap}>
              Kirim Pengajuan Sekarang
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
