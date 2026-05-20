"use client";

import { useEffect, useState } from "react";
import { Clock, AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SLACountdownProps {
  remainingHours: number;
  maxHours: number;
  status: 'ON_TIME' | 'WARNING' | 'OVERDUE';
}

export function SLACountdown({ remainingHours, maxHours, status }: SLACountdownProps) {
  const [timeLeft, setTimeLeft] = useState(remainingHours * 3600); // convert to seconds

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1); // Allow going negative for OVERDUE
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const isNegative = seconds < 0;
    const absSeconds = Math.abs(seconds);
    const h = Math.floor(absSeconds / 3600);
    const m = Math.floor((absSeconds % 3600) / 60);
    const s = Math.floor(absSeconds % 60);
    const sign = isNegative ? "+" : "";
    return `${sign}${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const percentage = Math.max(0, Math.min(100, (remainingHours / maxHours) * 100));

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          {status === 'OVERDUE' ? (
            <AlertCircle className="w-3.5 h-3.5 text-destructive animate-pulse" />
          ) : status === 'WARNING' ? (
            <Clock className="w-3.5 h-3.5 text-warning" />
          ) : (
            <CheckCircle2 className="w-3.5 h-3.5 text-success" />
          )}
          <span className={cn(
            "text-[10px] font-bold uppercase tracking-widest",
            status === 'OVERDUE' ? "text-destructive" : status === 'WARNING' ? "text-warning" : "text-success"
          )}>
            {status.replace('_', ' ')}
          </span>
        </div>
        <span className="text-xs font-mono font-bold text-slate-700">
          {formatTime(timeLeft)}
        </span>
      </div>
      <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
        <div 
          className={cn(
            "h-full transition-all duration-1000 rounded-full",
            status === 'OVERDUE' ? "bg-destructive" : status === 'WARNING' ? "bg-warning" : "bg-success"
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
