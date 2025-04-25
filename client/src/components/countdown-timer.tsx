import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

type CountdownTimerProps = {
  days: number;
  color?: string;
};

export function CountdownTimer({ days, color = "primary" }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState({
    days,
    hours: 23,
    minutes: 59,
    seconds: 59
  });
  
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(current => {
        if (current.seconds > 0) {
          return { ...current, seconds: current.seconds - 1 };
        } else if (current.minutes > 0) {
          return { ...current, minutes: current.minutes - 1, seconds: 59 };
        } else if (current.hours > 0) {
          return { ...current, hours: current.hours - 1, minutes: 59, seconds: 59 };
        } else if (current.days > 0) {
          return { ...current, days: current.days - 1, hours: 23, minutes: 59, seconds: 59 };
        } else {
          return current; // Time's up
        }
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const getColorClass = () => {
    switch (color) {
      case "primary": return "bg-primary/10 text-primary border-primary/20";
      case "pink": return "bg-pink-500/10 text-pink-500 border-pink-500/20";
      case "green": return "bg-green-500/10 text-green-500 border-green-500/20";
      default: return "bg-primary/10 text-primary border-primary/20";
    }
  };

  const addLeadingZero = (num: number) => {
    return num < 10 ? `0${num}` : num;
  };

  return (
    <div className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full border ${getColorClass()}`}>
      <Clock className="h-3.5 w-3.5 mr-1" />
      <div className="text-xs font-semibold tracking-wide">
        {timeLeft.days}d : {addLeadingZero(timeLeft.hours)}h : {addLeadingZero(timeLeft.minutes)}m : {addLeadingZero(timeLeft.seconds)}s
      </div>
    </div>
  );
}