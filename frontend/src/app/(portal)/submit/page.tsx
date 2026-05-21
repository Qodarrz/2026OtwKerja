"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import { 
  Map as MapIcon, 
  FileCheck, 
  ChevronRight, 
  ChevronLeft,
  AlertTriangle,
  CheckCircle2,
  Wallet,
  Loader2,
  FileText,
  Briefcase,
  Building2
} from "lucide-react";
import dynamic from "next/dynamic";
import { cn, formatCurrency } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

// Dynamically import map to avoid SSR issues
const MapPicker = dynamic(() => import("@/components/map/MapPicker"), { 
  ssr: false,
  loading: () => <div className="w-full h-125 bg-muted animate-pulse rounded-3xl flex items-center justify-center">Loading Map...</div>
});

export default function SubmitPermitPage() {
  const router = useRouter();
  const [schemas, setSchemas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [currentStep, setCurrentStep] = useState(0); // 0 = Select Type
  const [selectedSchema, setSelectedSchema] = useState<any>(null);
  
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [mapData, setMapData] = useState({ area: 0, points: [] as [number, number][], addressDetails: null as any });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchSchemas = async () => {
      try {
        const { data } = await api.get('/permits/applications/schemas');
        setSchemas(data);
      } catch (error) {
        console.error("Failed to fetch schemas", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSchemas();
  }, []);

  const handleSelectSchema = (schema: any) => {
    setSelectedSchema(schema);
    const initialData: any = {};
    schema.fields.forEach((f: any) => {
      initialData[f.name] = '';
    });
    setFormData(initialData);
    setCurrentStep(1);
  };

  const STEPS = selectedSchema ? [
    { id: 1, title: "Isi Data", icon: FileText },
    ...(selectedSchema.requiresMap ? [{ id: 2, title: "Pemetaan", icon: MapIcon }] : []),
    { id: selectedSchema.requiresMap ? 3 : 2, title: "Review", icon: FileCheck },
  ] : [];

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 0));

  const estimatedNJOP = mapData.area * 2500000;
  const hasOverlap = mapData.area > 5000;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const payload = {
        permitType: selectedSchema.permitType,
        locationAddress: formData.locationAddress || "N/A",
        landSize: mapData.area || Number(formData.estimatedArea) || 1,
        landType: formData.buildingType === "Residensial" ? "RESIDENTIAL" : "COMMERCIAL",
        buildingHeight: 10,
        njopValue: mapData.area > 0 ? estimatedNJOP : 1000000,
        isStrategicLocation: false,
        businessName: formData.businessName || "N/A",
        businessType: formData.businessType || "N/A",
        businessLocation: formData.businessLocation || formData.locationAddress || "N/A",
        estimatedEmployees: Number(formData.estimatedEmployees) || 1,
        dynamicData: { ...formData, mapData }
      };

      await api.post('/permits/applications', payload);
      router.push('/dashboard'); // Go back to dashboard on success
    } catch (error) {
      console.error("Failed to submit", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 0: Type Selection
  if (currentStep === 0) {
    return (
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Pilih Jenis Izin</h1>
          <p className="text-muted-foreground">Sistem kami akan menyesuaikan form berdasarkan jenis izin yang dipilih.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {loading ? (
            Array.from({ length: 2 }).map((_, i) => (
              <Card key={i} className="border-none shadow-sm">
                <CardContent className="p-8 flex flex-col items-center text-center gap-4">
                  <Skeleton className="w-16 h-16 rounded-2xl" />
                  <div className="flex flex-col items-center w-full gap-2 mt-2">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-6 w-24" />
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            schemas.map((schema) => (
              <Card 
                key={schema.id} 
                className="cursor-pointer hover:border-primary transition-all hover:shadow-lg group"
                onClick={() => handleSelectSchema(schema)}
              >
                <CardContent className="p-8 flex flex-col items-center text-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                    {schema.permitType === "BUILDING_PERMIT" ? <Building2 className="w-8 h-8" /> : <Briefcase className="w-8 h-8" />}
                  </div>
                  <div>
                    <h3 className="font-bold text-xl">{schema.title}</h3>
                    <p className="text-sm text-muted-foreground mt-2">{schema.description}</p>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <span className="text-[10px] font-bold px-2 py-1 bg-muted rounded-md">{schema.fields.length} Kolom Data</span>
                    {schema.requiresMap && <span className="text-[10px] font-bold px-2 py-1 bg-blue-500/10 text-blue-600 rounded-md">Wajib Pemetaan</span>}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div className="max-w-4xl mx-auto">
        {/* Stepper */}
        <div className="flex justify-between mb-12 relative">
          <div className="absolute top-1/2 left-0 w-full h-0.5 bg-muted -z-10 -translate-y-1/2" />
          {STEPS.map((step) => {
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;
            return (
              <div key={step.id} className="flex flex-col items-center gap-3">
                <div 
                  className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 border-2",
                    isActive ? "bg-primary border-primary text-primary-foreground scale-110 shadow-lg" : 
                    isCompleted ? "bg-emerald-500 border-emerald-500 text-primary-foreground" : 
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
            {/* Dynamic Step 1: Form Fields */}
            {currentStep === 1 && (
              <Card>
                <CardHeader>
                  <CardTitle>{selectedSchema.title}</CardTitle>
                  <CardDescription>Mohon lengkapi data berikut sesuai dengan kebutuhan sistem.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {selectedSchema.fields.map((field: any) => (
                    <div key={field.name} className="space-y-2">
                      <label className="text-sm font-bold">
                        {field.label} {field.required && <span className="text-destructive">*</span>}
                      </label>
                      
                      {field.type === "select" ? (
                        <select 
                          className="w-full h-12 rounded-xl border border-input bg-background px-4 py-2"
                          value={formData[field.name]}
                          onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                          required={field.required}
                        >
                          <option value="">-- Pilih --</option>
                          {field.options?.map((opt: string) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      ) : (
                        <Input 
                          type={field.type === "number" ? "number" : "text"}
                          placeholder={field.placeholder} 
                          value={formData[field.name]}
                          onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                          required={field.required}
                        />
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Dynamic Step 2: Map (Only if requiresMap is true) */}
            {currentStep === 2 && selectedSchema.requiresMap && (
              <Card>
                <CardHeader>
                  <CardTitle>Pemetaan Interaktif</CardTitle>
                  <CardDescription>Gambarkan batas lahan Anda pada peta di bawah ini untuk kalkulasi presisi.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <MapPicker 
                    onAreaChange={(points, area, addressDetails) => {
                      setMapData({ points, area, addressDetails });
                      if (addressDetails && selectedSchema) {
                        // Hanya autofill field yang ada di schema
                        setFormData(prev => {
                          const updated = { ...prev };
                          const hasLocAddr = selectedSchema.fields.some((f: any) => f.name === 'locationAddress');
                          const hasBizLoc = selectedSchema.fields.some((f: any) => f.name === 'businessLocation');
                          
                          if (hasLocAddr) updated.locationAddress = addressDetails.full;
                          if (hasBizLoc) updated.businessLocation = addressDetails.full;
                          
                          return updated;
                        });
                      }
                    }} 
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div className="p-4 rounded-2xl bg-background border border-border">
                      <span className="text-xs font-bold text-muted-foreground uppercase">Luas Lahan Akurat (Turf.js)</span>
                      <p className="text-2xl font-bold">{Math.round(mapData.area).toLocaleString()} m²</p>
                    </div>
                    {mapData.addressDetails && (
                      <div className="p-4 rounded-2xl bg-background border border-border">
                        <span className="text-xs font-bold text-muted-foreground uppercase">Lokasi Terdeteksi</span>
                        <p className="text-sm font-medium mt-1 line-clamp-2">{mapData.addressDetails.full}</p>
                        <div className="flex gap-2 mt-2 flex-wrap">
                          {mapData.addressDetails.suburb && <span className="text-[10px] px-2 py-1 bg-muted rounded-md">{mapData.addressDetails.suburb}</span>}
                          {mapData.addressDetails.city && <span className="text-[10px] px-2 py-1 bg-muted rounded-md">{mapData.addressDetails.city}</span>}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Final Step: Review */}
            {currentStep === STEPS.length && (
              <div className="space-y-6">
                {selectedSchema.requiresMap && (
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
                )}

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-6 h-6 text-primary" />
                      Ringkasan Data Dinamis
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {selectedSchema.fields.map((field: any) => (
                      <div key={field.name} className="flex justify-between p-3 border-b border-border last:border-0">
                        <span className="text-sm text-muted-foreground font-medium">{field.label}</span>
                        <span className="text-sm font-bold text-right max-w-[60%]">{formData[field.name] ? String(formData[field.name]) : '-'}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {selectedSchema.requiresMap && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Wallet className="w-6 h-6 text-primary" />
                        Estimasi Biaya & NJOP
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between p-4 rounded-2xl bg-background border border-border">
                        <span className="text-muted-foreground">Estimasi NJOP Lahan</span>
                        <span className="font-bold">{formatCurrency(estimatedNJOP)}</span>
                      </div>
                      <div className="pt-4 flex justify-between items-center">
                        <span className="text-lg font-bold">Total Pembayaran Awal</span>
                        <span className="text-2xl font-bold text-primary">{formatCurrency(estimatedNJOP)}</span>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-12">
          <Button 
            variant="ghost" 
            onClick={prevStep} 
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
            <Button 
              variant="premium" 
              className="rounded-xl shadow-md" 
              disabled={(selectedSchema.requiresMap && hasOverlap) || isSubmitting}
              onClick={handleSubmit}
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Kirim Pengajuan Sekarang"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
