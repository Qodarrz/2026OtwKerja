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
  TrendingUp,
  Users,
  CheckCircle2,
  Clock,
  Award,
} from "lucide-react";
import { analyticsService } from "@/services/analytics.service";
import { cn } from "@/lib/utils";
export default function PerformancePage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    async function fetchData() {
      try {
        const result = await analyticsService.getStaffPerformance();
        setData(result);
      } catch (error) {
        console.error("Failed to fetch staff performance", error);
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
        <Card className="border-border shadow-sm">
          {" "}
          <CardHeader className="border-b border-border bg-muted/50">
            {" "}
            <div className="h-6 w-40 bg-secondary rounded-md animate-pulse mb-2" />{" "}
            <div className="h-4 w-72 bg-secondary rounded-md animate-pulse" />{" "}
          </CardHeader>{" "}
          <CardContent className="p-6">
            {" "}
            <div className="space-y-4">
              {" "}
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="h-12 w-full bg-muted rounded-lg animate-pulse"
                />
              ))}{" "}
            </div>{" "}
          </CardContent>{" "}
        </Card>{" "}
      </div>
    );
  }
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {" "}
      <header>
        {" "}
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Performa Staf
        </h1>{" "}
        <p className="text-muted-foreground mt-1">
          Evaluasi dan monitoring kinerja individu dalam penyelesaian layanan.
        </p>{" "}
      </header>{" "}
      <div className="grid grid-cols-1 gap-6">
        {" "}
        <Card className="shadow-sm overflow-hidden">
          {" "}
          <CardHeader className="border-b border-slate-50 bg-muted/50">
            {" "}
            <CardTitle className="text-xl">Leaderboard Kinerja</CardTitle>{" "}
            <CardDescription>
              Peringkat staf berdasarkan volume penyelesaian dan ketepatan waktu
              SLA.
            </CardDescription>{" "}
          </CardHeader>{" "}
          <CardContent className="p-0">
            {" "}
            <div className="overflow-x-auto">
              {" "}
              <table className="w-full text-left">
                {" "}
                <thead className="bg-muted text-xs font-semibold uppercase text-muted-foreground border-b border-border">
                  {" "}
                  <tr>
                    {" "}
                    <th className="px-6 py-4">Nama Staf</th>{" "}
                    <th className="px-6 py-4 text-center">Total Diproses</th>{" "}
                    <th className="px-6 py-4 text-center">Tepat Waktu</th>{" "}
                    <th className="px-6 py-4 text-center">Overdue</th>{" "}
                    <th className="px-6 py-4 text-right">Skor SLA</th>{" "}
                  </tr>{" "}
                </thead>{" "}
                <tbody className="divide-y divide-slate-50">
                  {" "}
                  {data.map((staff, index) => (
                    <motion.tr
                      key={staff.staffId}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-accent/80 transition-colors group"
                    >
                      {" "}
                      <td className="px-6 py-4">
                        {" "}
                        <div className="flex items-center gap-3">
                          {" "}
                          <div
                            className={cn(
                              "w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm",
                              index === 0
                                ? "bg-amber-100 text-amber-600"
                                : index === 1
                                  ? "bg-slate-200 text-muted-foreground"
                                  : index === 2
                                    ? "bg-orange-100 text-orange-600"
                                    : "bg-primary/10 text-primary",
                            )}
                          >
                            {" "}
                            {index < 3 ? (
                              <Award className="w-5 h-5" />
                            ) : (
                              staff.staffName.charAt(0)
                            )}{" "}
                          </div>{" "}
                          <div>
                            {" "}
                            <p className="font-semibold text-foreground group-hover:text-primary transition-colors">
                              {staff.staffName}
                            </p>{" "}
                            <p className="text-xs font-medium text-muted-foreground uppercase">
                              {staff.roles[0]}
                            </p>{" "}
                          </div>{" "}
                        </div>{" "}
                      </td>{" "}
                      <td className="px-6 py-4 text-center">
                        {" "}
                        <span className="font-semibold text-foreground">
                          {staff.totalProcessed}
                        </span>{" "}
                      </td>{" "}
                      <td className="px-6 py-4 text-center">
                        {" "}
                        <span className="inline-flex items-center gap-1 text-emerald-600 font-medium bg-emerald-50 px-2 py-1 rounded-md text-xs">
                          {" "}
                          <CheckCircle2 className="w-3 h-3" />{" "}
                          {staff.onTimeCount}{" "}
                        </span>{" "}
                      </td>{" "}
                      <td className="px-6 py-4 text-center">
                        {" "}
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 font-medium px-2 py-1 rounded-md text-xs",
                            staff.overdueCount > 0
                              ? "text-destructive bg-destructive/10"
                              : "text-muted-foreground bg-muted",
                          )}
                        >
                          {" "}
                          <Clock className="w-3 h-3" />{" "}
                          {staff.overdueCount}{" "}
                        </span>{" "}
                      </td>{" "}
                      <td className="px-6 py-4 text-right">
                        {" "}
                        <div className="flex flex-col items-end gap-1">
                          {" "}
                          <span
                            className={cn(
                              "font-bold text-lg",
                              staff.onTimePercentage >= 90
                                ? "text-emerald-600"
                                : staff.onTimePercentage >= 75
                                  ? "text-amber-500"
                                  : "text-rose-600",
                            )}
                          >
                            {" "}
                            {staff.onTimePercentage}%{" "}
                          </span>{" "}
                          <div className="w-24 h-1.5 bg-secondary rounded-full overflow-hidden">
                            {" "}
                            <div
                              className={cn(
                                "h-full rounded-full",
                                staff.onTimePercentage >= 90
                                  ? "bg-emerald-500"
                                  : staff.onTimePercentage >= 75
                                    ? "bg-amber-500"
                                    : "bg-rose-500",
                              )}
                              style={{ width: `${staff.onTimePercentage}%` }}
                            />{" "}
                          </div>{" "}
                        </div>{" "}
                      </td>{" "}
                    </motion.tr>
                  ))}{" "}
                  {data.length === 0 && (
                    <tr>
                      {" "}
                      <td
                        colSpan={5}
                        className="py-12 text-center text-muted-foreground font-medium"
                      >
                        {" "}
                        Belum ada data performa staf.{" "}
                      </td>{" "}
                    </tr>
                  )}{" "}
                </tbody>{" "}
              </table>{" "}
            </div>{" "}
          </CardContent>{" "}
        </Card>{" "}
      </div>{" "}
    </div>
  );
}
