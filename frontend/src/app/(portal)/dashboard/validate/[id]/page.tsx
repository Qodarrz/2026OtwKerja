"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Role } from "@/types/auth";
import { useParams, useRouter } from "next/navigation";
import { permitService } from "@/services/permit.service";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  FileText,
  User,
  MapPin,
  Building,
  Loader2,
  Calendar,
  Activity,
  ShieldCheck,
  FileImage,
  ExternalLink,
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import api from "@/lib/axios";
import dynamic from "next/dynamic";

const ReadOnlyMap = dynamic(() => import("@/components/map/ReadOnlyMap"), {
  ssr: false,
  loading: () => <div className="h-[300px] w-full rounded-2xl bg-muted animate-pulse flex items-center justify-center text-muted-foreground">Memuat Peta...</div>
});

export default function ValidatePermitPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [application, setApplication] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [inspectionEvidenceFile, setInspectionEvidenceFile] = useState<File | null>(null);
  const [legalizedDocumentFile, setLegalizedDocumentFile] = useState<File | null>(null);
  const [inspectionEvidenceUrl, setInspectionEvidenceUrl] = useState("");
  const [legalizedDocumentUrl, setLegalizedDocumentUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [totalCost, setTotalCost] = useState("");

  useEffect(() => {
    async function fetchDetails() {
      try {
        const data = await permitService.getApplicationDetails(
          params.id as string,
        );
        setApplication(data);
        if (data.status === "ASSESSMENT" && data.totalCost) {
          setTotalCost(Math.round(Number(data.totalCost)).toString());
        }
      } catch (err) {
        console.error("Failed to fetch application details", err);
        setError(
          "Gagal memuat detail pengajuan atau Anda tidak memiliki akses.",
        );
      } finally {
        setLoading(false);
      }
    }
    fetchDetails();
  }, [params.id]);

  if (loading) return <DashboardSkeleton />;
  if (error || !application) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        {" "}
        <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center">
          {" "}
          <XCircle className="w-8 h-8" />{" "}
        </div>{" "}
        <h2 className="text-xl font-bold text-foreground">
          Akses Ditolak / Tidak Ditemukan
        </h2>{" "}
        <p className="text-muted-foreground font-medium">{error || "Data tidak ditemukan."}</p>{" "}
        <Button
          onClick={() => router.push("/dashboard/tasks")}
          className="mt-4 rounded-xl"
        >
          {" "}
          Kembali ke Antrean{" "}
        </Button>{" "}
      </div>
    );
  }

  const isCompleted =
    application.status === "APPROVED" || application.status === "REJECTED";

  const isFieldInspector = user?.roles?.includes(Role.FIELD_INSPECTOR) && application?.status === "FIELD_INSPECTION";
  const isLegalizer = user?.roles?.includes(Role.LEGALIZER) && application?.status === "LEGALIZATION";
  const isAssessor = user?.roles?.includes(Role.CS) && application?.status === "ASSESSMENT";
  const isWaitingPayment = user?.roles?.includes(Role.CS) && application?.status === "WAITING_FOR_PAYMENT";
  const isAdmin = user?.roles?.includes(Role.ADMIN);

  const handleApprove = async () => {
    if (isFieldInspector && !inspectionEvidenceFile) {
      toast.error("Bukti lapangan (Foto/Dokumen) wajib diunggah.");
      return;
    }
    if (isLegalizer && !legalizedDocumentFile) {
      toast.error("Dokumen Legal wajib diunggah.");
      return;
    }
    if (isAssessor && !totalCost) {
      toast.error("Total Biaya Retribusi wajib diisi.");
      return;
    }

    setIsSubmitting(true);
    try {
      let finalInspectionUrl = "";
      let finalLegalizedUrl = "";

      if (isFieldInspector && inspectionEvidenceFile) {
        const formData = new FormData();
        formData.append('file', inspectionEvidenceFile);
        const res = await api.post(`/permits/applications/${params.id}/documents`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        finalInspectionUrl = res.data.storagePath;
      }

      if (isLegalizer && legalizedDocumentFile) {
        const formData = new FormData();
        formData.append('file', legalizedDocumentFile);
        const res = await api.post(`/permits/applications/${params.id}/documents`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        finalLegalizedUrl = res.data.storagePath;
      }

      const payload = {
        notes,
        ...(application?.status === "FIELD_INSPECTION"
          ? { inspectionNotes: notes || "Telah diinspeksi", inspectionEvidenceUrl: finalInspectionUrl }
          : {}),
        ...(application?.status === "LEGALIZATION"
          ? { legalizedDocumentUrl: finalLegalizedUrl }
          : {}),
        ...(application?.status === "ASSESSMENT"
          ? { totalCost: Number(totalCost) }
          : {})
      };
      await api.post(`/permits/applications/${params.id}/approve`, payload);
      toast.success("Pengajuan berhasil diproses.");
      router.push("/dashboard/tasks");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Gagal menyetujui pengajuan.");
      setIsSubmitting(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'inspection' | 'legal') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post(`/permits/applications/${params.id}/documents`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (type === 'inspection') {
        setInspectionEvidenceUrl(response.data.storagePath);
      } else {
        setLegalizedDocumentUrl(response.data.storagePath);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Gagal mengunggah file");
    } finally {
      setIsUploading(false);
    }
  };

  const handleReject = async () => {
    if (!notes) {
      toast.error("Alasan penolakan wajib diisi.");
      return;
    }
    setIsSubmitting(true);
    try {
      await api.post(`/permits/applications/${params.id}/reject`, {
        reason: notes,
        notes,
      });
      toast.success("Pengajuan berhasil ditolak.");
      router.push("/dashboard/tasks");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Gagal menolak pengajuan.");
      setIsSubmitting(false);
    }
  };

  const handlePing = async () => {
    setIsSubmitting(true);
    try {
      await api.post(`/permits/applications/${params.id}/ping`);
      toast.success("Notifikasi peringatan (Ping) telah dikirim ke staf terkait.");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Gagal mengirim ping.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      {" "}
      <header className="flex items-center gap-4">
        {" "}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="rounded-full"
        >
          {" "}
          <ArrowLeft className="w-5 h-5" />{" "}
        </Button>{" "}
        <div>
          {" "}
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            {" "}
            Validasi Berkas{" "}
            <span
              className={cn(
                "text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-lg border",
                isCompleted
                  ? "bg-secondary text-muted-foreground border-border"
                  : "bg-primary/10 text-primary border-primary/20",
              )}
            >
              {" "}
              {application.status.replace(/_/g, " ")}{" "}
            </span>{" "}
          </h1>{" "}
          <p className="text-muted-foreground font-medium mt-1">
            Ref: {application.referenceNumber}
          </p>{" "}
        </div>{" "}
      </header>{" "}
      {error && (
        <div className="bg-rose-50 border border-rose-100 text-rose-600 p-4 rounded-xl text-sm font-bold">
          {" "}
          {error}{" "}
        </div>
      )}{" "}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {" "}
        <div className="lg:col-span-2 space-y-8">
          {" "}
          <Card className="border-none shadow-sm ">
            {" "}
            <CardHeader className="border-b border-slate-50 bg-background">
              {" "}
              <CardTitle className="text-xl flex items-center gap-2">
                {" "}
                <FileText className="w-5 h-5 text-primary" /> Detail
                Pengajuan{" "}
              </CardTitle>{" "}
            </CardHeader>{" "}
            <CardContent className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
              {" "}
              <div className="space-y-2">
                {" "}
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  {" "}
                  <Building className="w-3.5 h-3.5" /> Tipe Izin{" "}
                </p>{" "}
                <p className="font-bold text-foreground">
                  {application.permitType.replace(/_/g, " ")}
                </p>{" "}
              </div>{" "}
              <div className="space-y-2">
                {" "}
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  {" "}
                  <User className="w-3.5 h-3.5" /> Pemohon{" "}
                </p>{" "}
                <p className="font-bold text-foreground">
                  {application.applicant?.name || "Unknown"}
                </p>{" "}
                <p className="text-xs text-muted-foreground font-medium">
                  {application.applicant?.email}
                </p>{" "}
              </div>{" "}
              <div className="space-y-2 md:col-span-2">
                {" "}
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  {" "}
                  <MapPin className="w-3.5 h-3.5" /> Lokasi{" "}
                </p>{" "}
                <p className="font-bold text-slate-700 leading-relaxed">
                  {application.locationAddress || application.businessLocation}
                </p>{" "}
              </div>{" "}
              {application.landSize && (
                <div className="space-y-2">
                  {" "}
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Luas Lahan
                  </p>{" "}
                  <p className="font-bold text-foreground">
                    {Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 }).format(Number(application.landSize))} m²
                  </p>{" "}
                </div>
              )}{" "}
              {application.njopValue && (
                <div className="space-y-2">
                  {" "}
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Nilai NJOP per m²
                  </p>{" "}
                  <p className="font-bold text-foreground">
                    {formatCurrency(application.njopValue)}
                  </p>{" "}
                </div>
              )}{" "}
              {application.totalCost && (
                <div className="space-y-2">
                  {" "}
                  <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600">
                    Total Biaya Retribusi (Sistem)
                  </p>{" "}
                  <p className="font-bold text-emerald-700">
                    {formatCurrency(application.totalCost)}
                  </p>{" "}
                </div>
              )}{" "}

              {application.dynamicData && (application.dynamicData as any).mapPoints && (application.dynamicData as any).mapPoints.length > 0 && (
                <div className="md:col-span-2 mt-4 space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
                    Visualisasi Peta & Titik Lahan
                  </p>
                  <ReadOnlyMap points={(application.dynamicData as any).mapPoints} />
                </div>
              )}
            </CardContent>{" "}
          </Card>{" "}


          {application.documents && application.documents.length > 0 && (
            <Card className="border-none shadow-sm">
              <CardHeader className="border-b border-slate-50 bg-background">
                <CardTitle className="text-xl flex items-center gap-2">
                  <FileImage className="w-5 h-5 text-primary" /> Dokumen Lampiran
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {application.documents.map((doc: any) => (
                    <div key={doc.id} className="relative overflow-hidden rounded-xl border border-border bg-background flex flex-col">
                      {(doc.storagePath || doc.fileUrl)?.match(/\.(jpeg|jpg|gif|png|webp)$/i) || doc.mimeType?.startsWith('image/') ? (
                        <div className="w-full h-48 bg-muted/50 p-2 flex items-center justify-center">
                          <img
                            src={doc.storagePath || doc.fileUrl}
                            alt={doc.documentType}
                            className="max-w-full max-h-full object-contain rounded-lg shadow-sm"
                          />
                        </div>
                      ) : (
                        <div className="w-full h-48 bg-muted/50 p-2 flex flex-col items-center justify-center gap-3">
                          <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center shadow-sm">
                            <FileText className="w-8 h-8 text-primary" />
                          </div>
                          <span className="text-xs font-bold text-muted-foreground uppercase">{doc.documentType || 'Dokumen'}</span>
                        </div>
                      )}
                      <div className="p-4 border-t border-border flex items-center justify-between bg-muted/10 mt-auto">
                        <div className="overflow-hidden flex-1 mr-4">
                          <p className="text-sm font-bold truncate" title={doc.documentType || 'Dokumen'}>{(doc.documentType || 'Dokumen').replace(/_/g, ' ')}</p>
                        </div>
                        <Button variant="outline" size="sm" asChild className="shrink-0 rounded-full shadow-sm hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors">
                          <a href={doc.storagePath || doc.fileUrl} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="w-4 h-4 mr-2" /> Buka
                          </a>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Cumulative Flow Documents from Previous Stages */}
          {(application.inspectionEvidenceUrl || application.legalizedDocumentUrl) && (
            <Card className="border-none shadow-sm">
              <CardHeader className="border-b border-slate-50 bg-background">
                <CardTitle className="text-xl flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" /> Hasil Validasi Staf (Tahap Sebelumnya)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {application.inspectionEvidenceUrl && (
                    <div className="relative overflow-hidden rounded-xl border border-border bg-emerald-50/20 flex flex-col">
                      {application.inspectionEvidenceUrl.match(/\.(jpeg|jpg|gif|png|webp)$/i) ? (
                        <div className="w-full h-48 bg-muted/50 p-2 flex items-center justify-center">
                          <img src={application.inspectionEvidenceUrl} alt="Inspeksi Lapangan" className="max-w-full max-h-full object-contain rounded-lg shadow-sm" />
                        </div>
                      ) : (
                        <div className="w-full h-48 bg-muted/50 p-2 flex flex-col items-center justify-center gap-3">
                          <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center shadow-sm">
                            <FileText className="w-8 h-8 text-emerald-600" />
                          </div>
                          <span className="text-xs font-bold text-muted-foreground uppercase">Bukti Inspeksi</span>
                        </div>
                      )}
                      <div className="p-4 border-t border-border flex items-center justify-between bg-muted/10 mt-auto">
                        <div className="overflow-hidden flex-1 mr-4">
                          <p className="text-sm font-bold truncate text-emerald-800" title="Bukti Inspeksi Lapangan">Bukti Inspeksi Lapangan</p>
                        </div>
                        <Button variant="outline" size="sm" asChild className="shrink-0 rounded-full shadow-sm hover:bg-emerald-600 hover:text-white transition-colors border-emerald-200">
                          <a href={application.inspectionEvidenceUrl} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="w-4 h-4 mr-2" /> Buka
                          </a>
                        </Button>
                      </div>
                    </div>
                  )}

                  {application.legalizedDocumentUrl && (
                    <div className="relative overflow-hidden rounded-xl border border-border bg-purple-50/20 flex flex-col">
                      {application.legalizedDocumentUrl.match(/\.(jpeg|jpg|gif|png|webp)$/i) ? (
                        <div className="w-full h-48 bg-muted/50 p-2 flex items-center justify-center">
                          <img src={application.legalizedDocumentUrl} alt="Dokumen Legal" className="max-w-full max-h-full object-contain rounded-lg shadow-sm" />
                        </div>
                      ) : (
                        <div className="w-full h-48 bg-muted/50 p-2 flex flex-col items-center justify-center gap-3">
                          <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center shadow-sm">
                            <FileText className="w-8 h-8 text-purple-600" />
                          </div>
                          <span className="text-xs font-bold text-muted-foreground uppercase">Dokumen Legal</span>
                        </div>
                      )}
                      <div className="p-4 border-t border-border flex items-center justify-between bg-muted/10 mt-auto">
                        <div className="overflow-hidden flex-1 mr-4">
                          <p className="text-sm font-bold truncate text-purple-800" title="Surat Keputusan (SK) Legal">Surat Keputusan (SK) Legal</p>
                        </div>
                        <Button variant="outline" size="sm" asChild className="shrink-0 rounded-full shadow-sm hover:bg-purple-600 hover:text-white transition-colors border-purple-200">
                          <a href={application.legalizedDocumentUrl} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="w-4 h-4 mr-2" /> Buka
                          </a>
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="border-none shadow-sm ">
            {" "}
            <CardHeader className="border-b border-slate-50 bg-background">
              {" "}
              <CardTitle className="text-xl flex items-center gap-2">
                {" "}
                <Activity className="w-5 h-5 text-primary" /> Riwayat
                Status{" "}
              </CardTitle>{" "}
            </CardHeader>{" "}
            <CardContent className="p-8">
              {" "}
              <div className="space-y-8 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-secondary">
                {" "}
                {application.stageHistory?.map(
                  (history: any, index: number) => (
                    <div key={index} className="flex gap-6 relative">
                      {" "}
                      <div
                        className={cn(
                          "w-6 h-6 rounded-full border-4 border-white shadow-sm shrink-0 z-10 flex items-center justify-center",
                          history.completedAt
                            ? "bg-emerald-500"
                            : "bg-primary animate-pulse",
                        )}
                      >
                        {" "}
                      </div>{" "}
                      <div className="space-y-1">
                        {" "}
                        <p
                          className={cn(
                            "font-bold text-lg tracking-tight",
                            history.completedAt
                              ? "text-foreground"
                              : "text-primary",
                          )}
                        >
                          {" "}
                          {history.toStage.replace(/_/g, " ")}{" "}
                        </p>{" "}
                        <p className="text-xs text-muted-foreground font-bold flex items-center gap-1.5">
                          {" "}
                          <Calendar className="w-3.5 h-3.5" />{" "}
                          {history.completedAt
                            ? new Date(history.completedAt).toLocaleString(
                              "id-ID",
                            )
                            : "Sedang diproses..."}{" "}
                        </p>{" "}
                      </div>{" "}
                    </div>
                  ),
                )}{" "}
              </div>{" "}
            </CardContent>{" "}
          </Card>{" "}
        </div>{" "}
        <div className="space-y-6">
          {" "}
          <Card className="border-none shadow-sm sticky top-6">
            {" "}
            <CardHeader className="border-b border-slate-50 bg-background rounded-t-xl text-foreground">
              {" "}
              <CardTitle className="text-xl">Aksi Validasi</CardTitle>{" "}
              <CardDescription className="text-muted-foreground">
                Berikan catatan dan keputusan untuk berkas ini.
              </CardDescription>{" "}
            </CardHeader>{" "}
            <CardContent className="p-6 space-y-6">
              {" "}
              {isCompleted ? (
                <div className="p-6 bg-muted rounded-xl text-center space-y-2 border border-border">
                  {" "}
                  <div className="w-12 h-12 rounded-full mx-auto flex items-center justify-center bg-slate-200 text-muted-foreground mb-4">
                    {" "}
                    <CheckCircle2 className="w-6 h-6" />{" "}
                  </div>{" "}
                  <h3 className="font-bold text-foreground">
                    Proses Selesai
                  </h3>{" "}
                  <p className="text-sm font-medium text-muted-foreground">
                    Berkas ini sudah mendapatkan keputusan akhir dan tidak bisa
                    diubah lagi.
                  </p>{" "}
                </div>
              ) : !application.canAction ? (
                <div className="p-6 bg-amber-50 rounded-xl text-center space-y-4 border border-amber-100 flex flex-col items-center">
                  {" "}
                  <div className="w-12 h-12 rounded-full mx-auto flex items-center justify-center bg-amber-100 text-amber-600">
                    {" "}
                    <ShieldCheck className="w-6 h-6" />{" "}
                  </div>{" "}
                  <div>
                    <h3 className="font-bold text-amber-900">
                      Menunggu Validasi
                    </h3>{" "}
                    <p className="text-sm font-medium text-amber-700">
                      Tahap ini memerlukan validasi dari staf dengan peran yang
                      sesuai.
                    </p>{" "}
                  </div>
                  {isAdmin && (
                    <Button
                      onClick={handlePing}
                      disabled={isSubmitting}
                      variant="default"
                      className="mt-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold h-10 w-full"
                    >
                      {isSubmitting ? "Mengirim..." : "Ingatkan Staf (Ping)"}
                    </Button>
                  )}
                </div>
              ) : (
                <>
                  {isFieldInspector && (
                    <div className="space-y-3">
                      <label className="text-xs font-bold text-indigo-600 uppercase tracking-widest flex items-center gap-2">
                        <FileImage className="w-4 h-4" /> Bukti Lapangan (Wajib)
                      </label>
                      {inspectionEvidenceFile ? (
                        <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-xl flex items-center justify-between">
                          <span className="text-sm font-bold text-indigo-600 truncate pr-4">{inspectionEvidenceFile.name}</span>
                          <Button variant="ghost" size="sm" onClick={() => setInspectionEvidenceFile(null)} className="text-rose-500 hover:text-rose-600 hover:bg-rose-50">Hapus</Button>
                        </div>
                      ) : (
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          onChange={(e) => {
                            if (e.target.files?.[0]) setInspectionEvidenceFile(e.target.files[0]);
                          }}
                          className="w-full bg-indigo-50/50 border border-indigo-100 rounded-xl p-4 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all text-indigo-900 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-indigo-100 file:text-indigo-700 hover:file:bg-indigo-200"
                        />
                      )}
                    </div>
                  )}

                  {isLegalizer && (
                    <div className="space-y-3">
                      <label className="text-xs font-bold text-purple-600 uppercase tracking-widest flex items-center gap-2">
                        <FileText className="w-4 h-4" /> Dokumen Legal (Wajib)
                      </label>
                      {legalizedDocumentFile ? (
                        <div className="p-4 bg-purple-50/50 border border-purple-100 rounded-xl flex items-center justify-between">
                          <span className="text-sm font-bold text-purple-600 truncate pr-4">{legalizedDocumentFile.name}</span>
                          <Button variant="ghost" size="sm" onClick={() => setLegalizedDocumentFile(null)} className="text-rose-500 hover:text-rose-600 hover:bg-rose-50">Hapus</Button>
                        </div>
                      ) : (
                        <input
                          type="file"
                          accept="application/pdf,image/*"
                          onChange={(e) => {
                            if (e.target.files?.[0]) setLegalizedDocumentFile(e.target.files[0]);
                          }}
                          className="w-full bg-purple-50/50 border border-purple-100 rounded-xl p-4 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-purple-500/10 transition-all text-purple-900 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-purple-100 file:text-purple-700 hover:file:bg-purple-200"
                        />
                      )}
                    </div>
                  )}

                  {isAssessor && (
                    <div className="space-y-3">
                      <label className="text-xs font-bold text-amber-600 uppercase tracking-widest flex items-center gap-2">
                        <Activity className="w-4 h-4" /> Total Biaya Retribusi (Wajib)
                      </label>
                      <input
                        type="number"
                        value={totalCost}
                        onChange={(e) => setTotalCost(e.target.value)}
                        placeholder="Masukkan Jumlah Tagihan Rupiah (Contoh: 1500000)"
                        className="w-full bg-amber-50/50 border border-amber-100 rounded-xl p-4 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-amber-500/10 transition-all text-amber-900 placeholder:text-amber-300"
                      />
                      {totalCost && !isNaN(Number(totalCost)) && (
                        <p className="text-sm font-bold text-emerald-600 mt-2 px-2">
                          {formatCurrency(Number(totalCost))}
                        </p>
                      )}
                    </div>
                  )}

                  {isWaitingPayment && (
                    <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 mb-4">
                      <p className="text-sm font-bold text-emerald-800 text-center">
                        Konfirmasi bahwa warga telah menyelesaikan pembayaran di Kasir / Loket PTSP.
                      </p>
                    </div>
                  )}

                  <div className="space-y-3">
                    {" "}
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                      Catatan Validasi
                    </label>{" "}
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Tambahkan catatan untuk pemohon atau staf selanjutnya..."
                      className="w-full bg-muted border border-border rounded-xl p-4 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all resize-none min-h-30"
                    />{" "}
                  </div>{" "}
                  <div className="flex flex-col gap-3">
                    {" "}
                    <Button
                      onClick={handleApprove}
                      disabled={isSubmitting}
                      className="w-full rounded-xl bg-emerald-500 hover:bg-emerald-600 text-primary-foreground font-bold h-12 shadow-lg "
                    >
                      {" "}
                      {isSubmitting ? (
                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      ) : (
                        <CheckCircle2 className="w-5 h-5 mr-2" />
                      )}{" "}
                      Setujui Berkas{" "}
                    </Button>{" "}
                    <Button
                      onClick={handleReject}
                      disabled={isSubmitting}
                      variant="outline"
                      className="w-full rounded-xl border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 font-bold h-12"
                    >
                      {" "}
                      {isSubmitting ? (
                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      ) : (
                        <XCircle className="w-5 h-5 mr-2" />
                      )}{" "}
                      Tolak Berkas{" "}
                    </Button>{" "}
                  </div>{" "}
                </>
              )}{" "}
            </CardContent>{" "}
          </Card>{" "}
        </div>{" "}
      </div>{" "}
    </div>
  );
}
