"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
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
  Building2,
  Lock,
  User as UserIcon,
  X
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
  const [documentFiles, setDocumentFiles] = useState<Record<string, File | string>>({});
  const [useVerifiedKtp, setUseVerifiedKtp] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingPolygons, setExistingPolygons] = useState<any[]>([]);

  const { user } = useAuth();
  const [showKtpModal, setShowKtpModal] = useState(false);
  const isKtpVerified = user?.isKtpVerified;

  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    // Tampilkan modal otomatis pas halaman submit diload kalau KTP belum diverifikasi
    if (user && !user.isKtpVerified && currentStep === 0) {
      setShowKtpModal(true);
    }

    // Fetch profile if KTP is verified to get userDetail
    if (user && user.isKtpVerified) {
      api.get('/auth/profile').then(res => {
        setUserProfile(res.data);
      }).catch(err => console.error("Failed to fetch profile", err));
    }
  }, [user, currentStep]);

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

  useEffect(() => {
    if (currentStep === 2 && selectedSchema?.requiresMap) {
      api.get('/permits/applications/polygons').then(res => {
        setExistingPolygons(res.data);
      }).catch(err => console.error("Failed to fetch polygons", err));
    }
  }, [currentStep, selectedSchema]);

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
    { id: selectedSchema.requiresMap ? 3 : 2, title: "Biodata", icon: UserIcon },
    { id: selectedSchema.requiresMap ? 4 : 3, title: "Dokumen", icon: FileCheck },
    { id: selectedSchema.requiresMap ? 5 : 4, title: "Review", icon: FileCheck },
  ] : [];

  const nextStep = () => {
    // Validate Step 1: Form Fields
    if (currentStep === 1) {
      let missingFields = false;
      for (const field of selectedSchema?.fields || []) {
        if (field.required && !formData[field.name]) {
          missingFields = true;
          break;
        }
      }
      if (missingFields) {
        alert("Mohon lengkapi semua data wajib yang ditandai dengan bintang merah (*).");
        return;
      }
    }

    // Validate Step 2: Map
    if (currentStep === 2 && selectedSchema?.requiresMap) {
      if (mapData.area <= 0) {
        alert("Anda wajib menggambar poligon pemetaan pada peta sebelum melanjutkan.");
        return;
      }
      if (hasOverlap) {
        alert("Terdapat konflik lahan pada pemetaan Anda. Silakan sesuaikan kembali area pemetaan.");
        return;
      }
    }

    // Validate required documents before proceeding to review
    const isDocStep = currentStep === (selectedSchema?.requiresMap ? 4 : 3);
    if (isDocStep) {
      let missingDocs = false;
      const requiredDocs = selectedSchema?.requiredDocuments || [];
      for (const doc of requiredDocs) {
        if (doc.id === 'ktp' && useVerifiedKtp && isKtpVerified) {
          continue;
        }
        if (doc.required && !documentFiles[doc.id]) {
          missingDocs = true;
          break;
        }
      }
      if (missingDocs) {
        alert("Mohon lengkapi semua dokumen persyaratan terlebih dahulu.");
        return;
      }
    }
    setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
  };
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 0));

  const estimatedRetribusi = mapData.area * 15000;
  const hasOverlap = !!formData.hasMapOverlap;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const payload = {
        permitType: selectedSchema.permitType,
        locationAddress: formData.locationAddress || "N/A",
        landSize: mapData.area || Number(formData.estimatedArea) || 1,
        landType: formData.buildingType === "Residensial" ? "RESIDENTIAL" : "COMMERCIAL",
        buildingHeight: 10,
        njopValue: mapData.area > 0 ? estimatedRetribusi : 1000000,
        isStrategicLocation: false,
        businessName: formData.businessName || "N/A",
        businessType: formData.businessType || "N/A",
        businessLocation: formData.businessLocation || formData.locationAddress || "N/A",
        estimatedEmployees: Number(formData.estimatedEmployees) || 1,
        dynamicData: {
          mapPoints: mapData.points || [],
        }
      };

      // Create the application in DRAFT state first
      const res = await api.post('/permits/applications', payload);

      if (res.data && res.data.id) {
        const appId = res.data.id;

        // Upload physical documents
        for (const [key, val] of Object.entries(documentFiles)) {
          if (val instanceof File) {
            const formDataUpload = new FormData();
            formDataUpload.append('file', val);

            // Post to document controller endpoint
            await api.post(`/permits/applications/${appId}/documents`, formDataUpload, {
              headers: {
                'Content-Type': 'multipart/form-data',
              },
            });
          }
        }

        // Immediately submit the application out of DRAFT
        await api.post(`/permits/applications/${appId}/submit`);
      }
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
            schemas.map((schema) => {
              const isDisabled = !isKtpVerified;

              return (
                <Card
                  key={schema.id}
                  className={cn(
                    "transition-all group relative overflow-hidden",
                    isDisabled ? "opacity-50 cursor-not-allowed border-dashed bg-muted/30 grayscale-[50%]" : "cursor-pointer hover:border-primary hover:shadow-lg"
                  )}
                  onClick={() => {
                    if (isDisabled) {
                      setShowKtpModal(true);
                    } else {
                      handleSelectSchema(schema);
                    }
                  }}
                >
                  {isDisabled && (
                    <div className="absolute top-4 right-4 bg-background border border-border p-2 rounded-full text-muted-foreground shadow-sm z-10">
                      <Lock className="w-4 h-4" />
                    </div>
                  )}
                  <CardContent className="p-8 flex flex-col items-center text-center gap-4 relative z-0">
                    <div className={cn(
                      "w-16 h-16 rounded-2xl flex items-center justify-center transition-transform",
                      isDisabled ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary group-hover:scale-110"
                    )}>
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
              )
            })
          )}
        </div>

        {/* Modal KYC Alert */}
        <AnimatePresence>
          {showKtpModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="bg-background border border-border p-8 rounded-3xl max-w-md w-full shadow-2xl relative overflow-hidden"
              >
                <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-6">
                  <AlertTriangle className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Data Diri Belum Lengkap!</h2>
                <p className="text-muted-foreground mb-8 text-sm leading-relaxed">
                  Untuk menjaga integritas data pengajuan izin, Anda diwajibkan untuk memverifikasi identitas menggunakan <b>KTP (Sistem OCR otomatis)</b> terlebih dahulu.
                </p>
                <div className="flex flex-col gap-3 w-full">
                  <Button variant="premium" className="w-full rounded-xl h-12" onClick={() => router.push('/verify-ktp')}>
                    Lengkapi Sekarang
                  </Button>
                  <Button variant="ghost" className="w-full rounded-xl h-12 text-muted-foreground" onClick={() => setShowKtpModal(false)}>
                    Atur Nanti
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

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
                    existingPolygons={existingPolygons}
                    onAreaChange={(points, area, addressDetails, isOverlap) => {
                      setMapData({ points, area, addressDetails });
                      
                      // Also store the overlap boolean if you want to block submission
                      if (isOverlap !== undefined) {
                        setFormData(prev => ({ ...prev, hasMapOverlap: isOverlap }));
                      }

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

                  {mapData.area > 0 && (
                    <div className={cn("mt-4 p-4 rounded-2xl flex items-start gap-4", hasOverlap ? "bg-destructive/10 text-destructive" : "bg-emerald-50 text-emerald-700 border border-emerald-200")}>
                      {hasOverlap ? (
                        <>
                          <AlertTriangle className="w-8 h-8 shrink-0" />
                          <div>
                            <h3 className="text-lg font-bold">Konflik Lahan Terdeteksi</h3>
                            <p className="text-sm mt-1">Sistem mendeteksi area yang Anda pilih tumpang tindih dengan hak kepemilikan pihak lain. Anda <b>tidak dapat</b> melanjutkan proses ini sebelum lahan dipastikan Clean & Clear.</p>
                          </div>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-8 h-8 shrink-0" />
                          <div>
                            <h3 className="text-lg font-bold">Lahan Clean & Clear</h3>
                            <p className="text-sm mt-1">Tidak ditemukan indikasi tumpang tindih dengan hak tanah orang lain. Lahan siap digunakan.</p>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Dynamic Step: Biodata (Read-only) */}
            {currentStep === (selectedSchema.requiresMap ? 3 : 2) && (
              <Card>
                <CardHeader>
                  <CardTitle>Biodata Pembuat Izin</CardTitle>
                  <CardDescription>Data ini ditarik secara otomatis dari hasil verifikasi KTP Anda dan tidak dapat diubah secara manual.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-muted-foreground uppercase">NIK</label>
                      <Input value={userProfile?.userDetail?.nik || '-'} disabled className="bg-muted font-bold text-foreground opacity-100" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-muted-foreground uppercase">Nama Lengkap</label>
                      <Input value={userProfile?.userDetail?.ktpFullName || '-'} disabled className="bg-muted font-bold text-foreground opacity-100" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-muted-foreground uppercase">Tempat Lahir</label>
                      <Input value={userProfile?.userDetail?.ktpBirthPlace || '-'} disabled className="bg-muted font-bold text-foreground opacity-100" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-muted-foreground uppercase">Tanggal Lahir</label>
                      <Input value={userProfile?.userDetail?.ktpBirthDate ? new Date(userProfile.userDetail.ktpBirthDate).toLocaleDateString('id-ID') : '-'} disabled className="bg-muted font-bold text-foreground opacity-100" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-muted-foreground uppercase">Jenis Kelamin</label>
                      <Input value={userProfile?.userDetail?.ktpGender || '-'} disabled className="bg-muted font-bold text-foreground opacity-100" />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <label className="text-xs font-bold text-muted-foreground uppercase">Alamat Sesuai KTP</label>
                      <textarea
                        value={userProfile?.userDetail?.ktpAddress || '-'}
                        disabled
                        rows={3}
                        className="w-full bg-muted border border-border rounded-xl p-4 text-sm font-bold text-foreground opacity-100 resize-none outline-none"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Dynamic Step 4: Document Upload */}
            {currentStep === (selectedSchema.requiresMap ? 4 : 3) && (
              <Card>
                <CardHeader>
                  <CardTitle>Upload Dokumen Persyaratan</CardTitle>
                  <CardDescription>Silakan unggah dokumen yang diperlukan untuk memproses perizinan ini.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {selectedSchema.requiredDocuments?.map((doc: any) => (
                    <div key={doc.id} className="space-y-3 p-4 border border-border rounded-xl bg-muted/20">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-bold flex items-center gap-2">
                          <FileCheck className="w-4 h-4 text-primary" /> {doc.label} {doc.required && <span className="text-destructive">*</span>}
                        </label>
                      </div>

                      {doc.id === 'ktp' ? (
                        <div className="space-y-4 mt-2">
                          <div className="p-4 bg-emerald-50 text-emerald-700 rounded-xl text-sm font-medium border border-emerald-200 flex items-center gap-3">
                            <CheckCircle2 className="w-5 h-5 shrink-0" />
                            KTP Pemohon sudah terverifikasi secara otomatis melalui sistem OCR. Identitas terjamin valid.
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <Input
                            type="file"
                            accept=".pdf,image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) setDocumentFiles(prev => ({ ...prev, [doc.id]: file }));
                            }}
                            required={doc.required && !documentFiles[doc.id]}
                          />
                          {documentFiles[doc.id] && documentFiles[doc.id] instanceof File && (
                            <div className="relative overflow-hidden rounded-xl border border-border bg-background">
                              {(documentFiles[doc.id] as File).type.startsWith('image/') ? (
                                <div className="w-full h-48 bg-muted/50 p-2 flex items-center justify-center">
                                  <img
                                    src={URL.createObjectURL(documentFiles[doc.id] as File)}
                                    alt="Preview"
                                    className="max-w-full max-h-full object-contain rounded-lg shadow-sm"
                                  />
                                </div>
                              ) : (
                                <div className="p-4 flex items-center gap-3">
                                  <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                                    <FileText className="w-6 h-6" />
                                  </div>
                                  <div className="overflow-hidden flex-1">
                                    <p className="text-sm font-bold truncate">{(documentFiles[doc.id] as File).name}</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">{((documentFiles[doc.id] as File).size / 1024 / 1024).toFixed(2)} MB • PDF Document</p>
                                  </div>
                                </div>
                              )}
                              <Button
                                variant="destructive"
                                size="sm"
                                className="absolute top-2 right-2 h-8 w-8 p-0 rounded-full"
                                onClick={() => {
                                  const newFiles = { ...documentFiles };
                                  delete newFiles[doc.id];
                                  setDocumentFiles(newFiles);
                                }}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Final Step: Review */}
            {currentStep === STEPS.length && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <UserIcon className="w-6 h-6 text-primary" />
                      Biodata Pembuat Izin (OCR KTP)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col border-b border-border pb-2">
                        <span className="text-xs text-muted-foreground font-medium uppercase">NIK</span>
                        <span className="text-sm font-bold">{userProfile?.userDetail?.nik || '-'}</span>
                      </div>
                      <div className="flex flex-col border-b border-border pb-2">
                        <span className="text-xs text-muted-foreground font-medium uppercase">Nama Lengkap</span>
                        <span className="text-sm font-bold">{userProfile?.userDetail?.ktpFullName || '-'}</span>
                      </div>
                      <div className="flex flex-col border-b border-border pb-2">
                        <span className="text-xs text-muted-foreground font-medium uppercase">Tempat, Tanggal Lahir</span>
                        <span className="text-sm font-bold">{userProfile?.userDetail?.ktpBirthPlace || '-'}, {userProfile?.userDetail?.ktpBirthDate ? new Date(userProfile.userDetail.ktpBirthDate).toLocaleDateString('id-ID') : '-'}</span>
                      </div>
                      <div className="flex flex-col border-b border-border pb-2">
                        <span className="text-xs text-muted-foreground font-medium uppercase">Jenis Kelamin</span>
                        <span className="text-sm font-bold">{userProfile?.userDetail?.ktpGender || '-'}</span>
                      </div>
                      <div className="flex flex-col col-span-2 border-b border-border pb-2">
                        <span className="text-xs text-muted-foreground font-medium uppercase">Alamat Sesuai KTP</span>
                        <span className="text-sm font-bold">{userProfile?.userDetail?.ktpAddress || '-'}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

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
                    {selectedSchema.requiresMap && mapData.area > 0 && (
                      <div className="flex justify-between p-3 border-b border-border last:border-0">
                        <span className="text-sm text-muted-foreground font-medium">Luas Lahan (Hasil Pemetaan)</span>
                        <span className="text-sm font-bold text-right text-primary">{Math.round(mapData.area).toLocaleString()} m²</span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {selectedSchema.requiresMap && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Wallet className="w-6 h-6 text-primary" />
                        Estimasi Retribusi Daerah
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between p-4 rounded-2xl bg-background border border-border">
                        <span className="text-muted-foreground">Estimasi Biaya Retribusi (Berdasarkan Luas)</span>
                        <span className="font-bold">{formatCurrency(estimatedRetribusi)}</span>
                      </div>
                      <div className="pt-4 flex justify-between items-center">
                        <span className="text-lg font-bold">Perhitungan Sementara</span>
                        <span className="text-2xl font-bold text-primary">{formatCurrency(estimatedRetribusi)}</span>
                      </div>
                      <div className="mt-4 p-4 bg-muted/50 rounded-xl border border-border text-sm text-muted-foreground leading-relaxed">
                        <span className="font-bold text-foreground">Catatan Birokrasi:</span> Angka di atas adalah estimasi sistem berdasarkan luasan poligon pemetaan. Tagihan retribusi resmi akan diterbitkan setelah proses verifikasi dokumen dan validasi teknis oleh petugas terkait selesai (Status: Menunggu Pembayaran).
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
              disabled={isSubmitting}
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
