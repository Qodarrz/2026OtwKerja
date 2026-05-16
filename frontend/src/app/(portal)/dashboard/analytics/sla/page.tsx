"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Loader2,
  Activity,
  Zap,
  ShieldAlert,
  BarChart3,
  Clock,
  AlertCircle,
} from "lucide-react";
import { analyticsService } from "@/services/analytics.service";
import { cn } from "@/lib/utils";
export default function SLAReportPage() {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    async function fetchData() {
      try {
        const result = await analyticsService.getDashboardMetrics();
        setMetrics(result);
      } catch (error) {
        console.error("Failed to fetch SLA metrics", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);
  if (loading) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        {" "}
        <header className="flex justify-between gap-6">
          {" "}
          <div className="space-y-2">
            {" "}
            <div className="h-8 w-48 bg-secondary rounded-md animate-pulse" />{" "}
            <div className="h-4 w-96 bg-muted rounded-md animate-pulse" />{" "}
          </div>{" "}
          <div className="h-16 w-32 bg-secondary rounded-xl animate-pulse" />{" "}
        </header>{" "}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {" "}
          {[1, 2, 3].map((i) => (
            <Card key={i} className="shadow-sm">
              {" "}
              <CardContent className="p-6">
                {" "}
                <div className="h-10 w-10 bg-secondary rounded-lg animate-pulse mb-4" />{" "}
                <div className="h-8 w-24 bg-secondary rounded-md animate-pulse mb-2" />{" "}
                <div className="h-4 w-32 bg-muted rounded-md animate-pulse" />{" "}
              </CardContent>{" "}
            </Card>
          ))}{" "}
        </div>{" "}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {" "}
          {[1, 2].map((i) => (
            <Card
              key={i}
              className="shadow-sm h-64 animate-pulse bg-background"
            />
          ))}{" "}
        </div>{" "}
      </div>
    );
  }
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {" "}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        {" "}
        <div>
          {" "}
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Laporan SLA
          </h1>{" "}
          <p className="text-muted-foreground mt-1">
            Evaluasi kepatuhan Service Level Agreement secara komprehensif.
          </p>{" "}
        </div>{" "}
        <div className="flex items-center gap-4 bg-background px-5 py-3 rounded-2xl border border-border shadow-sm">
          {" "}
          <div className="text-right">
            {" "}
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Impact Score
            </p>{" "}
            <p className="text-2xl font-bold text-primary leading-none mt-1">
              {metrics?.impactScore || 0}%
            </p>{" "}
          </div>{" "}
          <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center">
            {" "}
            <Activity className="w-6 h-6 text-primary" />{" "}
          </div>{" "}
        </div>{" "}
      </header>{" "}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {" "}
        <Card className="shadow-sm group hover:shadow-md transition-all">
          {" "}
          <CardContent className="p-6">
            {" "}
            <div className="flex items-center justify-between mb-4">
              {" "}
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                {" "}
                <Zap className="w-6 h-6" />{" "}
              </div>{" "}
            </div>{" "}
            <p className="text-3xl font-bold text-foreground">
              {metrics?.onTimePercentage || 0}%
            </p>{" "}
            <p className="text-sm font-medium text-muted-foreground mt-1">
              SLA Compliance Rate
            </p>{" "}
            <div className="mt-4 h-1.5 w-full bg-secondary rounded-full overflow-hidden">
              {" "}
              <div
                className="h-full bg-emerald-500 rounded-full"
                style={{ width: `${metrics?.onTimePercentage || 0}%` }}
              />{" "}
            </div>{" "}
          </CardContent>{" "}
        </Card>{" "}
        <Card className="shadow-sm group hover:shadow-md transition-all">
          {" "}
          <CardContent className="p-6">
            {" "}
            <div className="flex items-center justify-between mb-4">
              {" "}
              <div className="p-3 bg-primary/10 text-primary rounded-2xl">
                {" "}
                <Clock className="w-6 h-6" />{" "}
              </div>{" "}
            </div>{" "}
            <div className="flex items-end gap-2">
              {" "}
              <p className="text-3xl font-bold text-foreground">
                {metrics?.averageProcessingTimeHours || 0}
              </p>{" "}
              <span className="text-sm font-medium text-muted-foreground mb-1">
                Jam
              </span>{" "}
            </div>{" "}
            <p className="text-sm font-medium text-muted-foreground mt-1">
              Rata-rata Waktu Proses
            </p>{" "}
            <div className="mt-4 h-1.5 w-full bg-secondary rounded-full overflow-hidden">
              {" "}
              <div className="h-full bg-primary rounded-full w-1/2" />{" "}
            </div>{" "}
          </CardContent>{" "}
        </Card>{" "}
        <Card className="shadow-sm group hover:shadow-md transition-all">
          {" "}
          <CardContent className="p-6">
            {" "}
            <div className="flex items-center justify-between mb-4">
              {" "}
              <div className="p-3 bg-destructive/10 text-destructive rounded-2xl">
                {" "}
                <ShieldAlert className="w-6 h-6" />{" "}
              </div>{" "}
            </div>{" "}
            <p className="text-3xl font-bold text-foreground">
              {metrics?.overdueCount || 0}
            </p>{" "}
            <p className="text-sm font-medium text-muted-foreground mt-1">
              Berkas Overdue
            </p>{" "}
            <div className="mt-4 h-1.5 w-full bg-secondary rounded-full overflow-hidden">
              {" "}
              <div className="h-full bg-rose-500 rounded-full w-1/4" />{" "}
            </div>{" "}
          </CardContent>{" "}
        </Card>{" "}
      </div>{" "}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {" "}
        <Card className="shadow-sm overflow-hidden">
          {" "}
          <CardHeader className="border-b border-border bg-background">
            {" "}
            <CardTitle className="text-xl">
              Distribusi Berdasarkan Tipe
            </CardTitle>{" "}
            <CardDescription>
              Rata-rata waktu proses untuk setiap jenis layanan perizinan.
            </CardDescription>{" "}
          </CardHeader>{" "}
          <CardContent className="p-6 space-y-6">
            {" "}
            {metrics?.byPermitType?.map((type: any) => (
              <div key={type.permitType} className="space-y-2">
                {" "}
                <div className="flex justify-between items-center text-sm font-semibold text-foreground">
                  {" "}
                  <span>{type.permitType.replace("_", " ")}</span>{" "}
                  <span>{type.averageDurationHours.toFixed(1)} Jam</span>{" "}
                </div>{" "}
                <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                  {" "}
                  <div
                    className="h-full bg-primary rounded-full"
                    style={{
                      width: `${Math.min((type.averageDurationHours / 48) * 100, 100)}%`,
                    }}
                  />{" "}
                </div>{" "}
              </div>
            ))}{" "}
          </CardContent>{" "}
        </Card>{" "}
        <Card className="shadow-sm overflow-hidden">
          {" "}
          <CardHeader className="border-b border-border bg-background">
            {" "}
            <CardTitle className="text-xl">Efisiensi Tahapan</CardTitle>{" "}
            <CardDescription>
              Kecepatan layanan pada masing-masing tahapan birokrasi.
            </CardDescription>{" "}
          </CardHeader>{" "}
          <CardContent className="p-6 space-y-6">
            {" "}
            {metrics?.byStage?.map((stage: any) => (
              <div key={stage.stage} className="space-y-2">
                {" "}
                <div className="flex justify-between items-center text-sm font-semibold text-foreground">
                  {" "}
                  <span className="uppercase text-xs tracking-wider text-muted-foreground">
                    {stage.stage.replace("_", " ")}
                  </span>{" "}
                  <span>{stage.averageDurationHours.toFixed(1)} Jam</span>{" "}
                </div>{" "}
                <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                  {" "}
                  <div
                    className={cn(
                      "h-full rounded-full",
                      stage.averageDurationHours > 24
                        ? "bg-destructive"
                        : "bg-emerald-500",
                    )}
                    style={{
                      width: `${Math.min((stage.averageDurationHours / 48) * 100, 100)}%`,
                    }}
                  />{" "}
                </div>{" "}
              </div>
            ))}{" "}
          </CardContent>{" "}
        </Card>{" "}
      </div>{" "}
    </div>
  );
}
