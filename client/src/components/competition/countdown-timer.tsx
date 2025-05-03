import { useState, useEffect } from "react";
import { calculateTimeRemaining } from "@/lib/utils";
import { Calendar, Clock, Hourglass, Timer } from "lucide-react";
import { cn } from "@/lib/utils";

interface CountdownTimerProps {
  drawDate: Date | string;
  variant?: "compact" | "full" | "detailed";
  className?: string;
  onExpire?: () => void;
}

export function CountdownTimer({
  drawDate,
  variant = "compact",
  className,
  onExpire
}: CountdownTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState(calculateTimeRemaining(drawDate));
  
  useEffect(() => {
    const timer = setInterval(() => {
      const newTimeRemaining = calculateTimeRemaining(drawDate);
      setTimeRemaining(newTimeRemaining);
      
      if (newTimeRemaining.isExpired && onExpire) {
        onExpire();
        clearInterval(timer);
      }
    }, 1000);
    
    return () => clearInterval(timer);
  }, [drawDate, onExpire]);
  
  if (variant === "detailed") {
    return (
      <div className={cn(
        "bg-white p-4 border-2 border-primary shadow-[0_0_15px_rgba(5,138,99,0.5)] rounded-lg", 
        className
      )}>
        <div className="flex items-center justify-between">
          <div className="text-primary font-semibold">TIME REMAINING</div>
          <div className="text-xs bg-accent text-white px-2 py-1 rounded-md animate-pulse">LIVE</div>
        </div>
        <div className="grid grid-cols-4 gap-2 mt-3">
          <div className="bg-gray-100 border border-primary/20 rounded-lg p-2 text-center shadow-sm">
            <div className="text-primary text-xl font-bold">{String(timeRemaining.days).padStart(2, '0')}</div>
            <div className="text-primary/70 text-xs font-medium">DAYS</div>
          </div>
          <div className="bg-gray-100 border border-primary/20 rounded-lg p-2 text-center shadow-sm">
            <div className="text-primary text-xl font-bold">{String(timeRemaining.hours).padStart(2, '0')}</div>
            <div className="text-primary/70 text-xs font-medium">HRS</div>
          </div>
          <div className="bg-gray-100 border border-primary/20 rounded-lg p-2 text-center shadow-sm">
            <div className="text-primary text-xl font-bold">{String(timeRemaining.minutes).padStart(2, '0')}</div>
            <div className="text-primary/70 text-xs font-medium">MIN</div>
          </div>
          <div className="bg-gray-100 border border-primary/20 rounded-lg p-2 text-center shadow-sm">
            <div className="text-primary text-xl font-bold">{String(timeRemaining.seconds).padStart(2, '0')}</div>
            <div className="text-primary/70 text-xs font-medium">SEC</div>
          </div>
        </div>
        <div className="text-gray-600 text-xs text-center mt-2">
          Drawing on {new Date(drawDate).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          })}
        </div>
      </div>
    );
  }
  
  if (variant === "full") {
    return (
      <div className={cn("flex space-x-2", className)}>
        <div className="bg-gray-100 border border-primary/20 rounded-lg px-3 py-2 text-center min-w-[70px] shadow-sm">
          <div className="text-primary font-bold text-xl">{String(timeRemaining.days).padStart(2, '0')}</div>
          <div className="text-xs text-primary/70 font-medium">Days</div>
        </div>
        <div className="bg-gray-100 border border-primary/20 rounded-lg px-3 py-2 text-center min-w-[70px] shadow-sm">
          <div className="text-primary font-bold text-xl">{String(timeRemaining.hours).padStart(2, '0')}</div>
          <div className="text-xs text-primary/70 font-medium">Hours</div>
        </div>
        <div className="bg-gray-100 border border-primary/20 rounded-lg px-3 py-2 text-center min-w-[70px] shadow-sm">
          <div className="text-primary font-bold text-xl">{String(timeRemaining.minutes).padStart(2, '0')}</div>
          <div className="text-xs text-primary/70 font-medium">Minutes</div>
        </div>
        <div className="bg-gray-100 border border-primary/20 rounded-lg px-3 py-2 text-center min-w-[70px] shadow-sm">
          <div className="text-primary font-bold text-xl">{String(timeRemaining.seconds).padStart(2, '0')}</div>
          <div className="text-xs text-primary/70 font-medium">Seconds</div>
        </div>
      </div>
    );
  }
  
  // Default compact variant
  return (
    <div className={cn("flex items-center space-x-1", className)}>
      <div className="bg-white border border-primary/30 text-xs text-primary px-2 py-1 rounded-md shadow-sm flex items-center">
        <Calendar className="h-3 w-3 mr-1 text-primary" />
        <span>{String(timeRemaining.days).padStart(2, '0')}</span>
      </div>
      <div className="bg-white border border-primary/30 text-xs text-primary px-2 py-1 rounded-md shadow-sm flex items-center">
        <Clock className="h-3 w-3 mr-1 text-primary" />
        <span>{String(timeRemaining.hours).padStart(2, '0')}</span>
      </div>
      <div className="bg-white border border-primary/30 text-xs text-primary px-2 py-1 rounded-md shadow-sm flex items-center">
        <Hourglass className="h-3 w-3 mr-1 text-primary" />
        <span>{String(timeRemaining.minutes).padStart(2, '0')}</span>
      </div>
      <div className="bg-white border border-primary/30 text-xs text-primary px-2 py-1 rounded-md shadow-sm flex items-center">
        <Timer className="h-3 w-3 mr-1 text-primary" />
        <span>{String(timeRemaining.seconds).padStart(2, '0')}</span>
      </div>
    </div>
  );
}
