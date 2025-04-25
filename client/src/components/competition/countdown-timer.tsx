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
        "bg-transparent p-4 border-2 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)] rounded-lg", 
        className
      )}>
        <div className="flex items-center justify-between">
          <div className="text-blue-400 font-semibold">TIME REMAINING</div>
          <div className="text-xs bg-blue-500 text-white px-2 py-1 rounded animate-pulse">LIVE</div>
        </div>
        <div className="grid grid-cols-4 gap-2 mt-3">
          <div className="bg-background/60 border border-blue-400/30 rounded-lg p-2 text-center backdrop-blur-sm">
            <div className="text-cyan-400 text-xl font-bold">{String(timeRemaining.days).padStart(2, '0')}</div>
            <div className="text-blue-300 text-xs font-medium">DAYS</div>
          </div>
          <div className="bg-background/60 border border-blue-400/30 rounded-lg p-2 text-center backdrop-blur-sm">
            <div className="text-cyan-400 text-xl font-bold">{String(timeRemaining.hours).padStart(2, '0')}</div>
            <div className="text-blue-300 text-xs font-medium">HRS</div>
          </div>
          <div className="bg-background/60 border border-blue-400/30 rounded-lg p-2 text-center backdrop-blur-sm">
            <div className="text-cyan-400 text-xl font-bold">{String(timeRemaining.minutes).padStart(2, '0')}</div>
            <div className="text-blue-300 text-xs font-medium">MIN</div>
          </div>
          <div className="bg-background/60 border border-blue-400/30 rounded-lg p-2 text-center backdrop-blur-sm">
            <div className="text-cyan-400 text-xl font-bold">{String(timeRemaining.seconds).padStart(2, '0')}</div>
            <div className="text-blue-300 text-xs font-medium">SEC</div>
          </div>
        </div>
        <div className="text-blue-200 text-xs text-center mt-2">
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
        <div className="bg-accent rounded px-3 py-2 text-center min-w-[60px]">
          <div className="text-foreground font-medium">{String(timeRemaining.days).padStart(2, '0')}</div>
          <div className="text-xs text-muted-foreground">Days</div>
        </div>
        <div className="bg-accent rounded px-3 py-2 text-center min-w-[60px]">
          <div className="text-foreground font-medium">{String(timeRemaining.hours).padStart(2, '0')}</div>
          <div className="text-xs text-muted-foreground">Hours</div>
        </div>
        <div className="bg-accent rounded px-3 py-2 text-center min-w-[60px]">
          <div className="text-foreground font-medium">{String(timeRemaining.minutes).padStart(2, '0')}</div>
          <div className="text-xs text-muted-foreground">Minutes</div>
        </div>
        <div className="bg-accent rounded px-3 py-2 text-center min-w-[60px]">
          <div className="text-foreground font-medium">{String(timeRemaining.seconds).padStart(2, '0')}</div>
          <div className="text-xs text-muted-foreground">Seconds</div>
        </div>
      </div>
    );
  }
  
  // Default compact variant
  return (
    <div className={cn("flex items-center space-x-1", className)}>
      <div className="bg-accent text-xs text-foreground px-2 py-1 rounded flex items-center">
        <Calendar className="h-3 w-3 mr-1" />
        <span>{String(timeRemaining.days).padStart(2, '0')}</span>
      </div>
      <div className="bg-accent text-xs text-foreground px-2 py-1 rounded flex items-center">
        <Clock className="h-3 w-3 mr-1" />
        <span>{String(timeRemaining.hours).padStart(2, '0')}</span>
      </div>
      <div className="bg-accent text-xs text-foreground px-2 py-1 rounded flex items-center">
        <Hourglass className="h-3 w-3 mr-1" />
        <span>{String(timeRemaining.minutes).padStart(2, '0')}</span>
      </div>
      <div className="bg-accent text-xs text-foreground px-2 py-1 rounded flex items-center">
        <Timer className="h-3 w-3 mr-1" />
        <span>{String(timeRemaining.seconds).padStart(2, '0')}</span>
      </div>
    </div>
  );
}
