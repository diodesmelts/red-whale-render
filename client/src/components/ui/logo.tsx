import { cn } from "@/lib/utils";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function Logo({ size = "md", className }: LogoProps) {
  const sizeClass = {
    sm: "h-8",
    md: "h-10",
    lg: "h-12",
  };

  return (
    <div className={cn("flex items-center space-x-2", className)}>
      <div className={cn("flex-shrink-0", sizeClass[size])}>
        <LogoIcon className={cn(sizeClass[size], "w-auto")} />
      </div>
      <div>
        <span className="text-primary font-bold text-xl">Blue Whale</span>
        <span className="text-white text-xs block -mt-1">Competitions</span>
      </div>
    </div>
  );
}

function LogoIcon({ className }: { className?: string }) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
    >
      <path
        d="M50 5C25.1 5 5 25.1 5 50s20.1 45 45 45 45-20.1 45-45S74.9 5 50 5z"
        fill="#072638"
      />
      <path
        d="M80 55c-1.5 0-2.8-.8-3.5-2-5.8-9.8-16.4-15.8-27.8-15-11.3.8-21.1 8.2-25.3 19-1 2.6-4 3.7-6.6 2.7-2.6-1-3.7-4-2.7-6.6C19.4 38.2 32.2 28.4 47 27.4c14.9-1.1 29 7.1 36.5 20.1 1.3 2.4.5 5.5-2 6.8-.7.5-1.6.7-2.4.7z"
        fill="#0099ff"
      />
      <path
        d="M40 78c0-5.5 4.5-10 10-10s10 4.5 10 10-4.5 10-10 10-10-4.5-10-10z"
        fill="#0099ff"
      />
      <path
        d="M42 55c0-4.4 3.6-8 8-8s8 3.6 8 8-3.6 8-8 8-8-3.6-8-8z"
        fill="#0099ff"
      />
      <path
        d="M78 70c-1.1 0-2.2-.4-3.1-1.2-8.6-7.5-19.7-11.8-31.2-11.8-2.8 0-5-2.2-5-5s2.2-5 5-5c14.2 0 27.9 5.3 38.4 14.9 2 1.8 2.2 4.9.4 7-.9 1.3-2.4 2-3.8 2L78 70z"
        fill="#0099ff"
      />
    </svg>
  );
}
