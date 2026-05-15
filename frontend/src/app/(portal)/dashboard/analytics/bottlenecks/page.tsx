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
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  Users,
  Target,
} from "lucide-react";
import { analyticsService } from "@/services/analytics.service";
import { cn } from "@/lib/utils";
export default function BottleneckAnalysisPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    async function fetchData() {
      try {
        const result = await analyticsService.getBottlenecks();
        setData(result);
      } catch (error) {
        console.error("Failed to fetch bottlenecks", error);
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
        <header className="space-y-2">
          {" "}
          <div className="h-8 w-48 bg-secondary rounded-md animate-pulse" />{" "}
          <div className="h-4 w-96 bg-muted rounded-md animate-pulse" />{" "}
        </header>{" "}
        <div className="grid grid-cols-1 gap-6">
          {" "}
          {[1, 2].map((i) => (
            <Card key={i} className="border-border shadow-sm overflow-hidden">
              {" "}
              <div className="flex flex-col md:flex-row h-48">
                {" "}
                <div className="p-8 md:w-1/3 border-b md:border-b-0 md:border-r border-border bg-muted/50 flex flex-col justify-center gap-4">
                  {" "}
                  <div className="h-4 w-24 bg-slate-200 rounded animate-pulse" />{" "}
                  <div className="h-8 w-40 bg-slate-200 rounded animate-pulse" />{" "}
                </div>{" "}
                <div className="p-8 md:w-2/3 grid grid-cols-2 gap-8">
                  {" "}
                  <div className="space-y-4">
                    {" "}
                    <div className="h-12 w-32 bg-secondary rounded animate-pulse" />{" "}
                    <div className="h-4 w-full bg-secondary rounded animate-pulse" />{" "}
                  </div>{" "}
                  <div className="space-y-4">
                    {" "}
                    <div className="h-16 w-full bg-secondary rounded animate-pulse" />{" "}
                    <div className="h-16 w-full bg-secondary rounded animate-pulse" />{" "}
                  </div>{" "}
                </div>{" "}
              </div>{" "}
            </Card>
          ))}{" "}
        </div>{" "}
      </div>
    );
  }
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {" "}
      <header>
        {" "}
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Analisis Bottleneck
        </h1>{" "}
        <p className="text-muted-foreground mt-1">
          Identifikasi titik hambatan pada setiap tahapan alur kerja untuk
          optimalisasi layanan.
        </p>{" "}
      </header>{" "}
      <div className="grid grid-cols-1 gap-6">
        {" "}
        {data.map((item, index) => (
          <motion.div
            key={item.stage}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            {" "}
            <Card className="shadow-sm overflow-hidden group">
              {" "}
              <div className="flex flex-col md:flex-row">
                {" "}
                <div
                  className={cn(
                    "p-8 md:w-1/3 border-b md:border-b-0 md:border-r border-border flex flex-col justify-center relative",
                    item.overdueCount > 0 ? "bg-rose-50/50" : "bg-muted/50",
                  )}
                >
                  {" "}
                  <h3 className="text-xs font-semibold uppercase text-muted-foreground mb-2">
                    Tahapan Proses
                  </h3>{" "}
                  <h2 className="text-xl font-bold text-foreground">
                    {item.stage.replace("_", " ")}
                  </h2>{" "}
                  <div className="mt-6 flex items-center gap-2 text-sm font-medium text-foreground bg-background py-2 px-3 rounded-lg shadow-sm border border-border w-fit">
                    {" "}
                    <Users className="w-4 h-4 text-primary" /> {item.staffCount}{" "}
                    Staf Aktif{" "}
                  </div>{" "}
                </div>{" "}
                <div className="p-8 md:w-2/3 grid grid-cols-1 sm:grid-cols-2 gap-8">
                  {" "}
                  <div className="space-y-6">
                    {" "}
                    <div>
                      {" "}
                      <p className="text-xs font-semibold uppercase text-muted-foreground mb-1">
                        Durasi Rata-rata
                      </p>{" "}
                      <div className="flex items-end gap-2">
                        {" "}
                        <span className="text-3xl font-bold text-foreground leading-none">
                          {item.averageDurationHours.toFixed(1)}
                        </span>{" "}
                        <span className="text-sm font-medium text-muted-foreground mb-1">
                          Jam
                        </span>{" "}
                      </div>{" "}
                      <div className="flex items-center gap-2 mt-2 text-xs font-medium text-muted-foreground">
                        {" "}
                        <Target className="w-3.5 h-3.5" /> Target SLA:{" "}
                        {item.maxDurationHours} Jam{" "}
                      </div>{" "}
                    </div>{" "}
                    <div>
                      {" "}
                      <div className="flex justify-between items-center mb-2">
                        {" "}
                        <span className="text-xs font-medium text-foreground">
                          Utilisasi Beban Kerja
                        </span>{" "}
                        <span className="text-xs font-bold">
                          {item.utilizationPercentage}%
                        </span>{" "}
                      </div>{" "}
                      <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                        {" "}
                        <div
                          className={cn(
                            "h-full rounded-full transition-all duration-1000",
                            item.utilizationPercentage > 100
                              ? "bg-destructive"
                              : item.utilizationPercentage > 75
                                ? "bg-amber-500"
                                : "bg-primary",
                          )}
                          style={{
                            width: `${Math.min(item.utilizationPercentage, 100)}%`,
                          }}
                        />{" "}
                      </div>{" "}
                    </div>{" "}
                  </div>{" "}
                  <div className="space-y-6 flex flex-col justify-between">
                    {" "}
                    <div className="grid grid-cols-2 gap-4">
                      {" "}
                      <div className="p-4 bg-amber-50 rounded-xl border border-amber-100/50">
                        {" "}
                        <p className="text-xs font-semibold uppercase text-amber-600/70 mb-1">
                          Warning
                        </p>{" "}
                        <p className="text-xl font-bold text-amber-600">
                          {item.warningCount}
                        </p>{" "}
                      </div>{" "}
                      <div className="p-4 bg-rose-50 rounded-xl border border-rose-100/50">
                        {" "}
                        <p className="text-xs font-semibold uppercase text-rose-600/70 mb-1">
                          Overdue
                        </p>{" "}
                        <p className="text-xl font-bold text-rose-600">
                          {item.overdueCount}
                        </p>{" "}
                      </div>{" "}
                    </div>{" "}
                    <div className="bg-muted p-4 rounded-xl border border-border">
                      {" "}
                      <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">
                        Rekomendasi AI
                      </p>{" "}
                      <p className="text-sm font-medium text-foreground">
                        {item.recommendedAction}
                      </p>{" "}
                    </div>{" "}
                  </div>{" "}
                </div>{" "}
              </div>{" "}
            </Card>{" "}
          </motion.div>
        ))}{" "}
        {data.length === 0 && (
          <div className="py-20 text-center flex flex-col items-center gap-4">
            {" "}
            <div className="p-4 bg-emerald-50 rounded-full">
              {" "}
              <CheckCircle2 className="w-8 h-8 text-emerald-500" />{" "}
            </div>{" "}
            <p className="text-lg font-bold text-foreground tracking-tight">
              Tidak ada hambatan terdeteksi.
            </p>{" "}
          </div>
        )}{" "}
      </div>{" "}
    </div>
  );
}
