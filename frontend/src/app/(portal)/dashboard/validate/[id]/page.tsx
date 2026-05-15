"use client";
import { useEffect, useState } from "react";
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
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import api from "@/lib/axios";
export default function ValidatePermitPage() {
  const params = useParams();
  const router = useRouter();
  const [application, setApplication] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    async function fetchDetails() {
      try {
        const data = await permitService.getApplicationDetails(
          params.id as string,
        );
        setApplication(data);
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
  const handleApprove = async () => {
    setIsSubmitting(true);
    try {
      const payload = {
        notes,
        ...(application?.status === "FIELD_INSPECTION"
          ? { inspectionNotes: notes || "Telah diinspeksi" }
          : {}),
      };
      await api.post(`/permits/applications/${params.id}/approve`, payload);
      router.push("/dashboard/tasks");
    } catch (err: any) {
      setError(err.response?.data?.message || "Gagal menyetujui pengajuan.");
      setIsSubmitting(false);
    }
  };
  const handleReject = async () => {
    if (!notes) {
      setError("Alasan penolakan wajib diisi.");
      return;
    }
    setIsSubmitting(true);
    try {
      await api.post(`/permits/applications/${params.id}/reject`, {
        reason: notes,
        notes,
      });
      router.push("/dashboard/tasks");
    } catch (err: any) {
      setError(err.response?.data?.message || "Gagal menolak pengajuan.");
      setIsSubmitting(false);
    }
  };
  if (loading) return <DashboardSkeleton />;
  if (error && !application) {
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
        <p className="text-muted-foreground font-medium">{error}</p>{" "}
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
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-3">
            {" "}
            Validasi Berkas{" "}
            <span
              className={cn(
                "text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-lg border",
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
            <CardHeader className="border-b border-slate-50 bg-muted/50">
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
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  {" "}
                  <Building className="w-3.5 h-3.5" /> Tipe Izin{" "}
                </p>{" "}
                <p className="font-extrabold text-foreground">
                  {application.permitType.replace(/_/g, " ")}
                </p>{" "}
              </div>{" "}
              <div className="space-y-2">
                {" "}
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  {" "}
                  <User className="w-3.5 h-3.5" /> Pemohon{" "}
                </p>{" "}
                <p className="font-extrabold text-foreground">
                  {application.applicant?.name || "Unknown"}
                </p>{" "}
                <p className="text-xs text-muted-foreground font-medium">
                  {application.applicant?.email}
                </p>{" "}
              </div>{" "}
              <div className="space-y-2 md:col-span-2">
                {" "}
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
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
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    Luas Lahan
                  </p>{" "}
                  <p className="font-extrabold text-foreground">
                    {application.landSize} m²
                  </p>{" "}
                </div>
              )}{" "}
              {application.njopValue && (
                <div className="space-y-2">
                  {" "}
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    Nilai NJOP
                  </p>{" "}
                  <p className="font-extrabold text-foreground">
                    {formatCurrency(application.njopValue)}
                  </p>{" "}
                </div>
              )}{" "}
            </CardContent>{" "}
          </Card>{" "}
          <Card className="border-none shadow-sm ">
            {" "}
            <CardHeader className="border-b border-slate-50 bg-muted/50">
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
                            "font-extrabold text-lg tracking-tight",
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
            <CardHeader className="border-b border-slate-50 bg-background rounded-t-xl text-primary-foreground">
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
                  <h3 className="font-extrabold text-foreground">
                    Proses Selesai
                  </h3>{" "}
                  <p className="text-sm font-medium text-muted-foreground">
                    Berkas ini sudah mendapatkan keputusan akhir dan tidak bisa
                    diubah lagi.
                  </p>{" "}
                </div>
              ) : !application.canAction ? (
                <div className="p-6 bg-amber-50 rounded-xl text-center space-y-2 border border-amber-100">
                  {" "}
                  <div className="w-12 h-12 rounded-full mx-auto flex items-center justify-center bg-amber-100 text-amber-600 mb-4">
                    {" "}
                    <ShieldCheck className="w-6 h-6" />{" "}
                  </div>{" "}
                  <h3 className="font-extrabold text-amber-900">
                    Menunggu Validasi
                  </h3>{" "}
                  <p className="text-sm font-medium text-amber-700">
                    Tahap ini memerlukan validasi dari staf dengan peran yang
                    sesuai.
                  </p>{" "}
                </div>
              ) : (
                <>
                  {" "}
                  <div className="space-y-3">
                    {" "}
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                      Catatan Validasi
                    </label>{" "}
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Tambahkan catatan untuk pemohon atau staf selanjutnya..."
                      className="w-full bg-muted border border-border rounded-xl p-4 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all resize-none min-h-[120px]"
                    />{" "}
                  </div>{" "}
                  <div className="flex flex-col gap-3">
                    {" "}
                    <Button
                      onClick={handleApprove}
                      disabled={isSubmitting}
                      className="w-full rounded-xl bg-emerald-500 hover:bg-emerald-600 text-primary-foreground font-extrabold h-12 shadow-lg "
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
                      className="w-full rounded-xl border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 font-extrabold h-12"
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
