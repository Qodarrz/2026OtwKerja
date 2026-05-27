"use client";

import { useEffect, useState } from "react";
import { feedbackService } from "@/services/feedback.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, MessageSquare, Star, Reply, User } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

export default function FeedbacksPage() {
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [replyDialogOpen, setReplyDialogOpen] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState<any>(null);
  const [replyText, setReplyText] = useState("");

  const fetchFeedbacks = async () => {
    try {
      setIsLoading(true);
      const res = await feedbackService.getAll({ limit: 50 });
      setFeedbacks(res.data || []);
    } catch (error) {
      console.error("Failed to fetch feedbacks:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const handleReplyClick = (feedback: any) => {
    setSelectedFeedback(feedback);
    setReplyText(feedback.response || "");
    setReplyDialogOpen(true);
  };

  const submitReply = async () => {
    if (!selectedFeedback || !replyText.trim()) return;
    
    try {
      setIsSubmitting(true);
      await feedbackService.reply(selectedFeedback.id, replyText);
      setReplyDialogOpen(false);
      fetchFeedbacks(); // refresh list
    } catch (error) {
      console.error("Failed to submit reply:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight mb-2">Ulasan & Feedback</h1>
        <p className="text-muted-foreground">Kelola ulasan dari masyarakat dan berikan respons.</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="border-none shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <div className="flex gap-4 mt-2">
                      <Skeleton className="h-3 w-20" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                  <Skeleton className="h-8 w-20 rounded-md" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : feedbacks.length === 0 ? (
        <Card className="bg-muted/50 border-dashed">
          <CardContent className="flex flex-col items-center justify-center h-48 text-muted-foreground">
            <MessageSquare className="w-10 h-10 mb-4 opacity-20" />
            <p>Belum ada feedback yang masuk</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {feedbacks.map((fb) => (
            <Card key={fb.id} className={fb.response ? "border-primary/20 bg-primary/5" : ""}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="flex items-center text-amber-500">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={`w-4 h-4 ${i < fb.rating ? "fill-amber-500" : "text-muted opacity-50"}`} />
                        ))}
                      </div>
                      <span className="text-xs font-medium px-2 py-0.5 bg-muted rounded-full">
                        {fb.type}
                      </span>
                    </div>
                    
                    <p className="text-sm font-medium leading-relaxed">
                      "{fb.comment}"
                    </p>
                    
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><User className="w-3 h-3" /> {fb.user?.name || "Anonim"}</span>
                      <span>Ref: {fb.application?.referenceNumber}</span>
                      <span>{new Date(fb.createdAt).toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    </div>
                    
                    {fb.response && (
                      <div className="mt-4 p-4 rounded-xl bg-background border border-border/50 space-y-2">
                        <div className="flex items-center gap-2 text-xs font-bold text-primary">
                          <Reply className="w-3 h-3" /> Balasan dari {fb.respondedBy?.name || "Admin"}
                        </div>
                        <p className="text-sm text-foreground/80">{fb.response}</p>
                      </div>
                    )}
                  </div>
                  
                  {!fb.response && (
                    <Button onClick={() => handleReplyClick(fb)} size="sm" variant="outline" className="shrink-0 gap-2">
                      <Reply className="w-4 h-4" /> Balas
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={replyDialogOpen} onOpenChange={setReplyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Balas Feedback</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-3 bg-muted rounded-lg text-sm italic">
              "{selectedFeedback?.comment}"
            </div>
            <Textarea 
              placeholder="Ketik balasan Anda di sini..." 
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              className="min-h-[120px]"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReplyDialogOpen(false)} disabled={isSubmitting}>Batal</Button>
            <Button onClick={submitReply} disabled={isSubmitting || !replyText.trim()}>
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Kirim Balasan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
