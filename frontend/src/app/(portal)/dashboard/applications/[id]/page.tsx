"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  FileText,
  MapPin,
  AlertTriangle,
  History,
  Activity,
  ChevronRight,
  Loader2,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SLACountdown } from "@/components/dashboard/SLACountdown";
import { FeedbackForm } from "@/components/dashboard/FeedbackForm";
import { permitService } from "@/services/permit.service";
import { cn, formatCurrency } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import dynamic from "next/dynamic";

const ReadOnlyMap = dynamic(() => import("@/components/map/ReadOnlyMap"), {
  ssr: false,
  loading: () => <div className="h-[300px] w-full rounded-2xl bg-muted animate-pulse flex items-center justify-center text-muted-foreground">Memuat Peta...</div>
});
export default function ApplicationDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [application, setApplication] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    async function fetchDetails() {
      try {
        const data = await permitService.getApplicationDetails(id as string);
        setApplication(data);
      } catch (error) {
        console.error("Failed to fetch application details", error);
      } finally {
        setLoading(false);
      }
    }
    fetchDetails();
  }, [id]);
  if (loading) {
    return (
      <div className="space-y-10 animate-in fade-in duration-500">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <Skeleton className="w-10 h-10 rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-8 w-48" />
            </div>
          </div>
          <Skeleton className="h-10 w-32 rounded-2xl" />
        </header>

        <Card className="border-none shadow-sm bg-card overflow-hidden">
          <CardContent className="p-8">
            <div className="flex justify-between items-center gap-8">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex flex-col items-center gap-4">
                  <Skeleton className="w-12 h-12 rounded-2xl" />
                  <Skeleton className="h-3 w-20" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Card className="border-none shadow-sm">
              <CardHeader className="border-b border-slate-50">
                <Skeleton className="h-6 w-48" />
              </CardHeader>
              <CardContent className="p-8">
                <Skeleton className="h-32 w-full rounded-3xl" />
              </CardContent>
            </Card>
            <Card className="border-none shadow-sm">
              <CardHeader className="border-b border-slate-50">
                <Skeleton className="h-6 w-48" />
              </CardHeader>
              <CardContent className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-5 w-full" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
          <div className="space-y-8">
            <Card className="border-none shadow-sm">
              <CardContent className="p-6">
                <Skeleton className="h-64 w-full" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }
  if (!application) {
    return (
      <div className="text-center py-24">
        {" "}
        <h2 className="text-2xl font-bold">Pengajuan tidak ditemukan.</h2>{" "}
        <Button onClick={() => router.back()} className="mt-4">
          Kembali
        </Button>{" "}
      </div>
    );
  }
  const stages = [
    { id: "DOCUMENT_CHECK", label: "Cek Dokumen", icon: CheckCircle2 },
    { id: "FIELD_INSPECTION", label: "Inspeksi Lapangan", icon: MapPin },
    { id: "LEGALIZATION", label: "Legalitas", icon: Activity },
    { id: "APPROVED", label: "Selesai", icon: Sparkles },
  ];
  const currentStageIndex = stages.findIndex(
    (s) => s.id === application.currentStage,
  );
  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {" "}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        {" "}
        <div className="flex items-center gap-4">
          {" "}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="rounded-xl hover:bg-secondary"
          >
            {" "}
            <ArrowLeft className="w-5 h-5" />{" "}
          </Button>{" "}
          <div>
            {" "}
            <div className="flex items-center gap-2 mb-1">
              {" "}
              <span className="text-[10px] font-bold uppercase tracking-widest text-primary bg-primary/5 px-2 py-0.5 rounded-md">
                {" "}
                {application.referenceNumber}{" "}
              </span>{" "}
              <span className="text-[10px] font-bold text-muted-foreground">
                •
              </span>{" "}
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                {" "}
                {new Date(application.createdAt).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}{" "}
              </span>{" "}
            </div>{" "}
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              {" "}
              {application.permitType.replace("_", " ")}{" "}
            </h1>{" "}
          </div>{" "}
        </div>{" "}
        <div
          className={cn(
            "px-6 py-3 rounded-2xl border text-sm font-bold uppercase tracking-widest shadow-sm",
            application.status === "APPROVED"
              ? "bg-emerald-50 text-emerald-600 border-emerald-100"
              : application.status === "REJECTED"
                ? "bg-rose-50 text-rose-600 border-rose-100"
                : "bg-amber-50 text-amber-600 border-amber-100",
          )}
        >
          {" "}
          {application.status.replace("_", " ")}{" "}
        </div>{" "}
      </header>{" "}
      {/* Workflow Stepper */}{" "}
      <Card className="border-none shadow-sm bg-card overflow-hidden">
        {" "}
        <CardContent className="p-8">
          {" "}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 relative">
            {" "}
            <div className="absolute top-5.5 left-6 right-6 h-0.5 bg-muted z-0 hidden md:block" />{" "}
            {stages.map((stage, idx) => {
              const isPast = idx < currentStageIndex;
              const isCurrent = idx === currentStageIndex;
              const isFuture = idx > currentStageIndex;
              return (
                <div
                  key={stage.id}
                  className="flex flex-row md:flex-col items-center gap-4 relative z-10 w-full md:w-auto"
                >
                  {" "}
                  <div
                    className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 border-2",
                      isPast
                        ? "bg-emerald-500 border-emerald-500 text-primary-foreground"
                        : isCurrent
                          ? "bg-primary border-primary text-primary-foreground scale-110 shadow-lg "
                          : "bg-card border-border text-slate-300",
                    )}
                  >
                    {" "}
                    {isPast ? (
                      <CheckCircle2 className="w-6 h-6" />
                    ) : (
                      <stage.icon className="w-6 h-6" />
                    )}{" "}
                  </div>{" "}
                  <div className="flex flex-col md:items-center">
                    {" "}
                    <span
                      className={cn(
                        "text-[10px] font-bold uppercase tracking-widest",
                        isCurrent ? "text-primary" : "text-muted-foreground",
                      )}
                    >
                      {" "}
                      {stage.label}{" "}
                    </span>{" "}
                    {isCurrent && (
                      <span className="text-[9px] font-bold text-amber-500 bg-amber-50 px-1.5 py-0.5 rounded mt-1 animate-pulse">
                        {" "}
                        Sedang Diproses{" "}
                      </span>
                    )}{" "}
                  </div>{" "}
                </div>
              );
            })}{" "}
          </div>{" "}
        </CardContent>{" "}
      </Card>{" "}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {" "}
        <div className="lg:col-span-2 space-y-8">
          {" "}
          <Card className="border-none shadow-sm bg-card">
            {" "}
            <CardHeader className="border-b border-slate-50">
              {" "}
              <CardTitle className="text-xl font-bold flex items-center gap-3">
                {" "}
                <Clock className="w-6 h-6 text-primary" /> Estimasi Waktu
                (SLA){" "}
              </CardTitle>{" "}
            </CardHeader>{" "}
            <CardContent className="p-8">
              {" "}
              {application.status !== "APPROVED" &&
                application.status !== "REJECTED" ? (
                <div className="space-y-6">
                  {" "}
                  <p className="text-sm font-medium text-muted-foreground leading-relaxed">
                    {" "}
                    Sistem sedang memantau performa internal birokrasi. Berikut
                    adalah sisa waktu maksimal untuk tahap{" "}
                    <strong>
                      {application.currentStage.replace("_", " ")}
                    </strong>{" "}
                    agar sesuai standar layanan.{" "}
                  </p>{" "}
                  <div className="p-8 bg-muted rounded-3xl border border-border">
                    {" "}
                    <SLACountdown
                      remainingHours={application.remainingHours}
                      maxHours={application.maxHours}
                      status={application.slaStatus}
                    />{" "}
                  </div>{" "}
                </div>
              ) : (
                <div className="text-center py-8">
                  {" "}
                  <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-500">
                    {" "}
                    <CheckCircle2 className="w-8 h-8" />{" "}
                  </div>{" "}
                  <p className="font-bold text-foreground">
                    Proses Selesai
                  </p>{" "}
                  <p className="text-sm text-muted-foreground mt-1">
                    Seluruh tahapan telah dilalui sesuai standar prosedur.
                  </p>{" "}
                </div>
              )}{" "}
            </CardContent>{" "}
          </Card>{" "}
          <Card className="border-none shadow-sm bg-card overflow-hidden">
            {" "}
            <CardHeader className="border-b border-slate-50">
              {" "}
              <CardTitle className="text-xl font-bold">
                Informasi Pengajuan
              </CardTitle>{" "}
            </CardHeader>{" "}
            <CardContent className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
              {" "}
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  Alamat Lokasi
                </p>
                <div className="flex flex-col items-start gap-1">
                  <p className="font-bold text-foreground leading-tight">
                    {application.locationAddress || "-"}
                  </p>
                  {application.locationAddress && (
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(application.locationAddress)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-xs font-bold text-primary hover:underline"
                    >
                      <MapPin className="w-3 h-3 mr-1" /> Buka di Maps
                    </a>
                  )}
                </div>
              </div>
              
              {application.landSize !== null && application.landSize !== undefined && (
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    Luas Lahan
                  </p>
                  <p className="font-bold text-foreground">
                    {application.landSize || 0} m²
                  </p>
                </div>
              )}

              {application.landType && (
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    Tipe Lahan
                  </p>
                  <p className="font-bold text-foreground">
                    {application.landType || "-"}
                  </p>
                </div>
              )}
              
              {application.dynamicData && (application.dynamicData as any).mapPoints && (application.dynamicData as any).mapPoints.length > 0 && (
                <div className="col-span-1 md:col-span-2 mt-4">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">
                    Visualisasi Lahan
                  </p>
                  <ReadOnlyMap points={(application.dynamicData as any).mapPoints} />
                </div>
              )}
              
              {application.dynamicData && Object.entries(application.dynamicData as Record<string, any>).map(([key, value]) => {
                if (key === 'mapPoints') return null; // Skip map points from textual list
                
                // Map common keys to better labels if needed, or just format the key
                const formattedKey = key
                  .replace(/([A-Z])/g, ' $1')
                  .replace(/^./, str => str.toUpperCase());
                  
                return (
                  <div key={key} className="space-y-1">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                      {formattedKey}
                    </p>
                    <p className="font-bold text-foreground line-clamp-2">
                      {String(value || "-")}
                    </p>
                  </div>
                );
              })}
              <div className="space-y-1">
                {" "}
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  Estimasi Biaya
                </p>{" "}
                <p className="font-bold text-primary text-lg">
                  {formatCurrency(application.totalCost || 0)}
                </p>{" "}
              </div>{" "}
            </CardContent>{" "}
          </Card>{" "}
        </div>{" "}
        <div className="space-y-8">
          {" "}
          <FeedbackForm applicationId={application.id} feedbacks={application.feedbacks} />{" "}
          <Card className="bg-background text-primary-foreground border-none shadow-md">
            {" "}
            <CardContent className="p-8 space-y-4">
              {" "}
              <h3 className="text-lg font-bold text-foreground tracking-tight">
                Butuh Bantuan?
              </h3>{" "}
              <p className="text-sm text-muted-foreground leading-relaxed">
                {" "}
                Jika Anda merasa ada hambatan yang tidak wajar atau butuh
                klarifikasi teknis, hubungi layanan bantuan kami.{" "}
              </p>{" "}
              <Button
                variant="outline"
                className="w-full bg-primary text-white rounded-xl hover:text-white hover:bg-primary font-bold h-11"
              >
                {" "}
                Chat Support{" "}
              </Button>{" "}
            </CardContent>{" "}
          </Card>{" "}
        </div>{" "}
      </div>{" "}
    </div>
  );
}
import { Sparkles } from "lucide-react";
