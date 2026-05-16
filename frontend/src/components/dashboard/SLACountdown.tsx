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
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const percentage = Math.min(100, (remainingHours / maxHours) * 100);

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          {status === 'OVERDUE' ? (
            <AlertCircle className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
          ) : status === 'WARNING' ? (
            <Clock className="w-3.5 h-3.5 text-amber-500" />
          ) : (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          )}
          <span className={cn(
            "text-[10px] font-bold uppercase tracking-widest",
            status === 'OVERDUE' ? "text-rose-600" : status === 'WARNING' ? "text-amber-600" : "text-emerald-600"
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
            status === 'OVERDUE' ? "bg-rose-500" : status === 'WARNING' ? "bg-amber-500" : "bg-emerald-500"
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
