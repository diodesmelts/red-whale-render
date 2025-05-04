import { useState, useEffect } from "react";
import { calculateTimeRemaining } from "@/lib/utils";
import { Calendar, Clock, Hourglass, Timer } from "lucide-react";
import { cn } from "@/lib/utils";

interface CountdownTimerProps {
  drawDate: Date | string;
  variant?: "compact" | "full" | "detailed" | "card-header";
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
        "bg-[#002147] p-4 border-2 border-white shadow-[0_0_15px_rgba(255,255,255,0.3)] rounded-lg", 
        className
      )}>
        <div className="flex items-center justify-between">
          <div className="text-white font-semibold">TIME REMAINING</div>
          <div className="text-xs bg-[#bbd665] text-[#002147] font-bold px-2 py-1 rounded-md animate-pulse">LIVE</div>
        </div>
        <div className="grid grid-cols-4 gap-2 mt-3">
          <div className="bg-[#002147]/80 border border-white/50 rounded-lg p-2 text-center shadow-sm">
            <div className="text-[#bbd665] text-xl font-bold">{String(timeRemaining.days).padStart(2, '0')}</div>
            <div className="text-white text-xs font-medium">DAYS</div>
          </div>
          <div className="bg-[#002147]/80 border border-white/50 rounded-lg p-2 text-center shadow-sm">
            <div className="text-[#bbd665] text-xl font-bold">{String(timeRemaining.hours).padStart(2, '0')}</div>
            <div className="text-white text-xs font-medium">HRS</div>
          </div>
          <div className="bg-[#002147]/80 border border-white/50 rounded-lg p-2 text-center shadow-sm">
            <div className="text-[#bbd665] text-xl font-bold">{String(timeRemaining.minutes).padStart(2, '0')}</div>
            <div className="text-white text-xs font-medium">MIN</div>
          </div>
          <div className="bg-[#002147]/80 border border-white/50 rounded-lg p-2 text-center shadow-sm">
            <div className="text-[#bbd665] text-xl font-bold">{String(timeRemaining.seconds).padStart(2, '0')}</div>
            <div className="text-white text-xs font-medium">SEC</div>
          </div>
        </div>
        <div className="text-white/80 text-xs text-center mt-2">
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
        <div className="bg-[#002147] border border-white/80 rounded-lg px-3 py-2 text-center min-w-[70px] shadow-sm">
          <div className="text-[#bbd665] font-bold text-xl">{String(timeRemaining.days).padStart(2, '0')}</div>
          <div className="text-xs text-white font-medium">Days</div>
        </div>
        <div className="bg-[#002147] border border-white/80 rounded-lg px-3 py-2 text-center min-w-[70px] shadow-sm">
          <div className="text-[#bbd665] font-bold text-xl">{String(timeRemaining.hours).padStart(2, '0')}</div>
          <div className="text-xs text-white font-medium">Hours</div>
        </div>
        <div className="bg-[#002147] border border-white/80 rounded-lg px-3 py-2 text-center min-w-[70px] shadow-sm">
          <div className="text-[#bbd665] font-bold text-xl">{String(timeRemaining.minutes).padStart(2, '0')}</div>
          <div className="text-xs text-white font-medium">Minutes</div>
        </div>
        <div className="bg-[#002147] border border-white/80 rounded-lg px-3 py-2 text-center min-w-[70px] shadow-sm">
          <div className="text-[#bbd665] font-bold text-xl">{String(timeRemaining.seconds).padStart(2, '0')}</div>
          <div className="text-xs text-white font-medium">Seconds</div>
        </div>
      </div>
    );
  }
  
  if (variant === "card-header") {
    return (
      <div className={cn("flex flex-col bg-[#bbd665] text-black w-full border-t-2 border-[#002147]", className)}>
        <div className="flex justify-center items-center p-2">
          <div className="flex items-center space-x-3">
            <div className="flex items-center">
              <div className="bg-[#002147] text-white font-medium text-xs px-2 py-0.5 rounded-md mr-2 animate-pulse">LIVE</div>
              <span className="text-xs font-semibold hidden sm:inline">TIME REMAINING</span>
            </div>
            <div className="flex space-x-2">
              <div className="flex flex-col items-center">
                <div className="text-[#002147] font-bold text-sm">{String(timeRemaining.days).padStart(2, '0')}</div>
                <div className="text-[10px] font-medium">Days</div>
              </div>
              <span className="text-[#002147] self-start mt-1 font-bold">:</span>
              <div className="flex flex-col items-center">
                <div className="text-[#002147] font-bold text-sm">{String(timeRemaining.hours).padStart(2, '0')}</div>
                <div className="text-[10px] font-medium">Hrs</div>
              </div>
              <span className="text-[#002147] self-start mt-1 font-bold">:</span>
              <div className="flex flex-col items-center">
                <div className="text-[#002147] font-bold text-sm">{String(timeRemaining.minutes).padStart(2, '0')}</div>
                <div className="text-[10px] font-medium">Min</div>
              </div>
              <span className="text-[#002147] self-start mt-1 font-bold">:</span>
              <div className="flex flex-col items-center">
                <div className="text-[#002147] font-bold text-sm">{String(timeRemaining.seconds).padStart(2, '0')}</div>
                <div className="text-[10px] font-medium">Sec</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default compact variant
  return (
    <div className={cn("flex items-center space-x-1", className)}>
      <div className="bg-white border border-gray-200 text-xs text-[#36b4ff] px-2 py-1 rounded-md shadow-sm flex items-center">
        <Calendar className="h-3 w-3 mr-1 text-[#36b4ff]" />
        <span>{String(timeRemaining.days).padStart(2, '0')}</span>
      </div>
      <div className="bg-white border border-gray-200 text-xs text-[#36b4ff] px-2 py-1 rounded-md shadow-sm flex items-center">
        <Clock className="h-3 w-3 mr-1 text-[#36b4ff]" />
        <span>{String(timeRemaining.hours).padStart(2, '0')}</span>
      </div>
      <div className="bg-white border border-gray-200 text-xs text-[#36b4ff] px-2 py-1 rounded-md shadow-sm flex items-center">
        <Hourglass className="h-3 w-3 mr-1 text-[#36b4ff]" />
        <span>{String(timeRemaining.minutes).padStart(2, '0')}</span>
      </div>
      <div className="bg-white border border-gray-200 text-xs text-[#36b4ff] px-2 py-1 rounded-md shadow-sm flex items-center">
        <Timer className="h-3 w-3 mr-1 text-[#36b4ff]" />
        <span>{String(timeRemaining.seconds).padStart(2, '0')}</span>
      </div>
    </div>
  );
}
