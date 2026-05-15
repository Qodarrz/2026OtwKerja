"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Star,
  Send,
  Loader2,
  CheckCircle2,
  MessageSquare,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import api from "@/lib/axios";
interface FeedbackFormProps {
  applicationId: string;
  onSuccess?: () => void;
}
export function FeedbackForm({ applicationId, onSuccess }: FeedbackFormProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [type, setType] = useState<
    "GENERAL" | "BOTTLENECK_REPORT" | "APPRECIATION" | "COMPLAINT"
  >("GENERAL");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      setError("Mohon berikan rating bintang.");
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      await api.post("/feedback", { applicationId, rating, comment, type });
      setIsSuccess(true);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || "Gagal mengirim feedback.");
    } finally {
      setIsSubmitting(false);
    }
  };
  if (isSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-12 space-y-4"
      >
        {" "}
        <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-emerald-500">
          {" "}
          <CheckCircle2 className="w-8 h-8" />{" "}
        </div>{" "}
        <h3 className="text-xl font-extrabold text-foreground">
          Terima Kasih!
        </h3>{" "}
        <p className="text-muted-foreground text-sm max-w-xs mx-auto">
          {" "}
          Feedback Anda sangat berharga bagi kami untuk meningkatkan kualitas
          layanan publik.{" "}
        </p>{" "}
      </motion.div>
    );
  }
  return (
    <Card className="border-none shadow-md overflow-hidden bg-card/80 backdrop-blur-md">
      {" "}
      <CardHeader className="bg-muted/50 border-b border-border">
        {" "}
        <div className="flex items-center gap-3">
          {" "}
          <div className="p-2 bg-primary/10 rounded-xl">
            {" "}
            <MessageSquare className="w-5 h-5 text-primary" />{" "}
          </div>{" "}
          <div>
            {" "}
            <CardTitle className="text-lg font-extrabold tracking-tight">
              Kirim Feedback
            </CardTitle>{" "}
            <CardDescription className="text-xs font-medium">
              Bantu kami meningkatkan transparansi dan kecepatan layanan.
            </CardDescription>{" "}
          </div>{" "}
        </div>{" "}
      </CardHeader>{" "}
      <CardContent className="p-6">
        {" "}
        <form onSubmit={handleSubmit} className="space-y-6">
          {" "}
          <div className="space-y-3">
            {" "}
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              Bagaimana Pengalaman Anda?
            </label>{" "}
            <div className="flex gap-2">
              {" "}
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(star)}
                  className="transition-all duration-200 transform hover:scale-110"
                >
                  {" "}
                  <Star
                    className={cn(
                      "w-8 h-8",
                      (hoverRating || rating) >= star
                        ? "fill-amber-400 text-amber-400"
                        : "text-slate-200",
                    )}
                  />{" "}
                </button>
              ))}{" "}
            </div>{" "}
          </div>{" "}
          <div className="space-y-3">
            {" "}
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              Kategori Feedback
            </label>{" "}
            <div className="flex flex-wrap gap-2">
              {" "}
              {[
                { id: "GENERAL", label: "Umum" },
                { id: "APPRECIATION", label: "Apresiasi" },
                { id: "BOTTLENECK_REPORT", label: "Lapor Hambatan" },
                { id: "COMPLAINT", label: "Keluhan" },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setType(t.id as any)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border",
                    type === t.id
                      ? "bg-primary text-primary-foreground border-primary shadow-lg "
                      : "bg-muted text-muted-foreground border-border hover:bg-card",
                  )}
                >
                  {" "}
                  {t.label}{" "}
                </button>
              ))}{" "}
            </div>{" "}
          </div>{" "}
          <div className="space-y-3">
            {" "}
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              Komentar Tambahan
            </label>{" "}
            <Textarea
              placeholder="Ceritakan pengalaman Anda atau berikan saran perbaikan..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="min-h-[100px] rounded-xl border-border focus:ring-primary/20 bg-muted/50"
            />{" "}
          </div>{" "}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-rose-50 text-rose-600 rounded-xl text-xs font-bold border border-rose-100 animate-in fade-in slide-in-from-top-1">
              {" "}
              <AlertCircle className="w-4 h-4" /> {error}{" "}
            </div>
          )}{" "}
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-background hover:bg-muted text-primary-foreground font-black h-12 transition-all active:scale-[0.98] shadow-md "
          >
            {" "}
            {isSubmitting ? (
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            ) : (
              <Send className="w-4 h-4 mr-2" />
            )}{" "}
            Kirim Feedback Sekarang{" "}
          </Button>{" "}
        </form>{" "}
      </CardContent>{" "}
    </Card>
  );
}
