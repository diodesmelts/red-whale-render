import { Calendar } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";

interface CountdownTimerProps {
  drawDate: Date | string;
  variant?: "compact" | "full" | "detailed" | "card-header" | "badge";
  className?: string;
  onExpire?: () => void;
}

export function CountdownTimer({
  drawDate,
  variant = "compact",
  className,
  onExpire
}: CountdownTimerProps) {
  // Format the date for display
  const formattedDate = formatDate(drawDate);
  
  if (variant === "badge") {
    return (
      <div className="flex items-center justify-center w-full">
        <div className="bg-[#002147] text-white w-full py-2 px-3 shadow-md flex items-center justify-center">
          <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-2 text-[#FFD700]" />
            <div className="font-bold text-[#FFD700] text-sm">DRAW DATE:</div>
            <div className="ml-2 text-white text-sm">{formattedDate}</div>
          </div>
        </div>
      </div>
    );
  }
  
  if (variant === "card-header") {
    return (
      <div className={cn("bg-[#002147] text-white w-full border-t-2 border-[#FFD700]", className)}>
        <div className="flex justify-center items-center p-2">
          <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-2 text-[#FFD700]" />
            <div className="font-bold text-[#FFD700] text-sm">DRAW DATE:</div>
            <div className="ml-2 text-white text-sm">{formattedDate}</div>
          </div>
        </div>
      </div>
    );
  }

  // Default for all other variants (compact, full, detailed)
  return (
    <div className={cn("flex items-center", className)}>
      <div className="bg-[#002147] text-white px-3 py-1 shadow-sm flex items-center justify-center rounded-sm">
        <Calendar className="h-3 w-3 mr-1.5 text-[#FFD700]" />
        <span className="text-xs font-medium">{formattedDate}</span>
      </div>
    </div>
  );
}
