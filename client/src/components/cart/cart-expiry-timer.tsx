import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

type CartExpiryTimerProps = {
  expiresAt: number;
};

export function CartExpiryTimer({ expiresAt }: CartExpiryTimerProps) {
  const [timeLeft, setTimeLeft] = useState<{
    minutes: number;
    seconds: number;
  } | null>(null);

  useEffect(() => {
    // Function to calculate time left
    const calculateTimeLeft = () => {
      const now = Date.now();
      const difference = expiresAt - now;
      
      if (difference <= 0) {
        // Timer expired
        setTimeLeft(null);
        return;
      }
      
      // Calculate minutes and seconds
      const minutes = Math.floor(difference / 1000 / 60);
      const seconds = Math.floor((difference / 1000) % 60);
      
      setTimeLeft({ minutes, seconds });
    };
    
    // Calculate immediately
    calculateTimeLeft();
    
    // Then set up interval to update every second
    const timerId = setInterval(calculateTimeLeft, 1000);
    
    // Clean up interval on unmount
    return () => clearInterval(timerId);
  }, [expiresAt]);
  
  if (!timeLeft) {
    return (
      <div className="flex items-center text-red-600 text-xs">
        <Clock className="h-3 w-3 mr-1" />
        Expired
      </div>
    );
  }
  
  const { minutes, seconds } = timeLeft;
  
  // Determine color based on time left
  let textColor = "text-green-600";
  if (minutes < 5) {
    textColor = "text-amber-600";
  }
  if (minutes < 2) {
    textColor = "text-red-600";
  }
  
  return (
    <div className={`flex items-center ${textColor} text-xs font-medium`}>
      <Clock className="h-3 w-3 mr-1" />
      Reserved for {minutes}:{seconds < 10 ? `0${seconds}` : seconds}
    </div>
  );
}