import { useQuery } from "@tanstack/react-query";
import { Loader2, Clock, Ticket, Trophy, Award, Gift, Sparkles, PartyPopper, TrendingUp } from "lucide-react";
import { SiteConfig, Competition } from "@shared/schema";
import { getImageUrl, cn } from "@/lib/utils";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { Progress } from "@/components/ui/progress";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";

export function HeroBanner() {
  const { data: heroBannerConfig, isLoading: isLoadingBanner } = useQuery<SiteConfig>({
    queryKey: ["/api/site-config", "heroBanner"],
    queryFn: async () => {
      const res = await fetch("/api/site-config/heroBanner");
      if (!res.ok) {
        if (res.status === 404) {
          // If the banner config doesn't exist yet, return null
          return null;
        }
        throw new Error("Failed to fetch hero banner configuration");
      }
      return res.json();
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: 3, // Retry 3 times if the request fails
    retryDelay: 1000, // Wait 1 second between retries
  });

  // Fetch hero banner title from site config
  const { data: heroBannerTitle, isLoading: isLoadingTitle } = useQuery<SiteConfig>({
    queryKey: ["/api/site-config", "heroBannerTitle"],
    queryFn: async () => {
      const res = await fetch("/api/site-config/heroBannerTitle");
      if (!res.ok) {
        if (res.status === 404) {
          return { key: "heroBannerTitle", value: "WIN A PLAYSTATION 5" };
        }
        throw new Error("Failed to fetch hero banner title");
      }
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
    retry: 3,
    retryDelay: 1000,
  });

  // Fetch competitions for the banner
  const { data: competitions, isLoading: isLoadingCompetitions } = useQuery<Competition[]>({
    queryKey: ["/api/competitions"],
    queryFn: async () => {
      const res = await fetch("/api/competitions");
      if (!res.ok) {
        throw new Error("Failed to fetch competitions");
      }
      return res.json();
    },
    staleTime: 60 * 1000, // Cache for 1 minute
  });

  // First priority: Competition with pushToHeroBanner flag
  // Second priority: Featured cash competition
  // Third priority: Any live cash competition
  const heroBannerCompetition = competitions?.find(
    comp => comp.pushToHeroBanner && comp.isLive
  ) || competitions?.find(
    comp => comp.category === "cash" && comp.isLive && comp.isFeatured
  ) || competitions?.find(
    comp => comp.category === "cash" && comp.isLive
  );

  const backgroundImage = heroBannerConfig?.value || "";
  const hasBackgroundImage = backgroundImage && backgroundImage.trim() !== "";
  
  // Make sure the URL is absolute for cross-domain compatibility using our utility function
  const absoluteBackgroundImage = getImageUrl(backgroundImage);

  // Format time remaining for competition
  const formatTimeRemaining = (drawDate: Date | string | null) => {
    if (!drawDate) return "N/A";
    try {
      const date = new Date(drawDate);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Coming soon";
    }
  };

  // Calculate the percentage of tickets sold
  const calculateTicketPercentage = (sold: number | null | undefined, total: number | null | undefined): number => {
    if (!sold || !total || total === 0) return 0;
    return Math.min(100, Math.round((sold / total) * 100));
  };

  // Countdown timer
  const [countdown, setCountdown] = useState({ hours: 8, minutes: 33, seconds: 59 });
  
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        }
        return prev;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);

  const isLoading = isLoadingBanner || isLoadingCompetitions || isLoadingTitle;
  const title = heroBannerTitle?.value || "WIN A PLAYSTATION 5";

  return (
    <section 
      className={`relative pt-16 md:pt-0 pb-16 md:pb-0 overflow-hidden ${
        hasBackgroundImage 
          ? "bg-cover bg-center" 
          : "bg-gradient-to-b from-background to-background/70"
      }`}
      style={hasBackgroundImage ? { 
        backgroundImage: `linear-gradient(rgba(0, 0, 60, 0.4), rgba(0, 0, 60, 0.4)), url(${absoluteBackgroundImage})`,
        zIndex: -1
      } : {}}
    >
      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 relative z-[90] flex flex-col md:flex-row md:items-center md:min-h-[700px]">
        {/* Left Side Content */}
        <div className="md:w-[65%] py-12 md:py-24">
          {/* Win Tab */}
          <div className="inline-block bg-primary text-white font-bold px-6 py-2 mb-4 text-lg">
            WIN
          </div>
          
          {/* Main Title - Using title from site config */}
          <h1 className="text-6xl md:text-8xl font-extrabold mb-8 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] tracking-wide max-w-[95%] leading-[1.1]">
            {title}
          </h1>
          
          {heroBannerCompetition && !isLoading ? (
            <div className="flex flex-col space-y-6">
              {/* Price and Tickets Section */}
              <div className="flex flex-col">
                <div className="flex items-center mb-2">
                  <span className="text-3xl font-bold text-white">
                    £{(heroBannerCompetition.ticketPrice / 100).toFixed(2)}
                  </span>
                </div>
                <div className="text-white text-sm">
                  {heroBannerCompetition.ticketsSold || 0} / {heroBannerCompetition.totalTickets} TICKETS LEFT
                </div>
              </div>
              
              {/* Countdown Timer */}
              <div className="mb-2 text-white font-medium text-lg">Draw closes in:</div>
              <div className="flex gap-4">
                <div className="bg-primary w-16 h-16 flex flex-col items-center justify-center text-white rounded-lg shadow-lg">
                  <span className="font-bold text-2xl">{countdown.hours}</span>
                  <span className="text-xs uppercase">Hours</span>
                </div>
                <div className="bg-primary w-16 h-16 flex flex-col items-center justify-center text-white rounded-lg shadow-lg">
                  <span className="font-bold text-2xl">{countdown.minutes}</span>
                  <span className="text-xs uppercase">Mins</span>
                </div>
                <div className="bg-primary w-16 h-16 flex flex-col items-center justify-center text-white rounded-lg shadow-lg animate-pulse">
                  <span className="font-bold text-2xl">{countdown.seconds}</span>
                  <span className="text-xs uppercase">Secs</span>
                </div>
              </div>
              
              {/* Enter Button */}
              <div className="mt-3">
                <Link to={`/competitions/${heroBannerCompetition.id}`}>
                  <Button 
                    size="lg" 
                    className="bg-primary hover:bg-primary/90 text-white font-extrabold px-10 py-7 text-2xl uppercase tracking-wide shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-primary/30 hover:shadow-xl"
                  >
                    Enter Competition
                  </Button>
                </Link>
              </div>
              
              {/* Trustpilot Reviews */}
              <div className="flex items-center mt-4">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg key={star} className="w-5 h-5 text-primary fill-current" viewBox="0 0 24 24">
                      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                    </svg>
                  ))}
                </div>
                <span className="text-white text-sm ml-2">TrustScore 4.9 | 2,845 reviews</span>
              </div>
            </div>
          ) : (
            <p className="text-white text-lg mb-6 opacity-90">Crazy odds. High win rates. Investing in fun!</p>
          )}
        </div>
        
        {/* Right Side - Images */}
        <div className="hidden md:block md:w-[35%]">
          {hasBackgroundImage && heroBannerCompetition?.imageUrl && (
            <div className="flex items-center justify-center h-full">
              <div className="rounded-lg overflow-hidden w-[90%] bg-transparent shadow-2xl transform scale-110">
                <img 
                  src={getImageUrl(heroBannerCompetition.imageUrl)} 
                  alt={heroBannerCompetition.title || "Competition prize"} 
                  className="w-full h-auto object-cover transition-transform hover:scale-105 duration-300"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute top-2 right-2">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
        </div>
      )}
    </section>
  );
}