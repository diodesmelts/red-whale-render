import { useQuery } from "@tanstack/react-query";
import { Loader2, Clock, Ticket, Trophy, Award, Gift, Sparkles, PartyPopper, TrendingUp, ChevronRight, CreditCard } from "lucide-react";
import { SiteConfig, Competition } from "@shared/schema";
import { getImageUrl, cn } from "@/lib/utils";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow, format } from "date-fns";
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
          return { key: "heroBannerTitle", value: "WIN THIS VW TIGUAN R + £10,000" };
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
  const competitionImage = heroBannerCompetition?.imageUrl ? getImageUrl(heroBannerCompetition.imageUrl) : "";
  
  // Debug logging to verify the image URLs
  console.log("Hero Banner Background Image:", {
    originalUrl: backgroundImage,
    processedUrl: absoluteBackgroundImage,
    heroBannerConfig
  });
  
  console.log("Hero Banner Competition Image:", {
    originalUrl: heroBannerCompetition?.imageUrl,
    processedUrl: competitionImage,
    competitionId: heroBannerCompetition?.id
  });

  // Get draw date and format for display
  const getDrawDate = (drawDate: string | Date | null) => {
    if (!drawDate) return "Soon";
    try {
      return format(new Date(drawDate), "EEEE h:mm a");
    } catch (error) {
      console.error("Error formatting draw date:", error);
      return "Coming Soon";
    }
  };

  // Calculate the percentage of tickets sold
  const calculateTicketPercentage = (sold: number | null | undefined, total: number | null | undefined): number => {
    if (!sold || !total || total === 0) return 0;
    return Math.min(100, Math.round((sold / total) * 100));
  };

  // Countdown timer
  const [countdown, setCountdown] = useState({ days: 0, hours: 8, minutes: 33, seconds: 59 });
  
  useEffect(() => {
    // If we have a draw date, calculate countdown based on that
    if (heroBannerCompetition?.drawDate) {
      const drawDate = new Date(heroBannerCompetition.drawDate);
      const updateCountdown = () => {
        const now = new Date();
        const diff = drawDate.getTime() - now.getTime();
        if (diff <= 0) {
          setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
          return;
        }
        
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        
        setCountdown({ days, hours, minutes, seconds });
      };
      
      updateCountdown();
      const timer = setInterval(updateCountdown, 1000);
      return () => clearInterval(timer);
    } else {
      // Fallback timer if no draw date available
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev.seconds > 0) {
            return { ...prev, seconds: prev.seconds - 1 };
          } else if (prev.minutes > 0) {
            return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
          } else if (prev.hours > 0) {
            return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
          } else if (prev.days > 0) {
            return { days: prev.days - 1, hours: 23, minutes: 59, seconds: 59 };
          }
          return prev;
        });
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [heroBannerCompetition?.drawDate]);

  const isLoading = isLoadingBanner || isLoadingCompetitions || isLoadingTitle;
  // Hardcoded title and date for the hero banner as requested
  const title = "WIN THIS BEAUTIFUL NINJA AIR FRYER";
  const drawDateText = "DRAW 10TH MAY 9PM";

  return (
    <section 
      className="relative w-full h-[600px] md:h-[450px] lg:h-[500px] overflow-hidden bg-gradient-to-r from-[#43207c] to-[#43207c]/95 text-white"
    >
      {/* Full width hero image container */}
      <div 
        className="absolute inset-0 w-full h-full bg-cover bg-center"
        style={{
          backgroundImage: heroBannerCompetition?.imageUrl 
            ? `linear-gradient(to right, rgba(67, 32, 124, 0.95) 0%, rgba(67, 32, 124, 0.9) 30%, rgba(67, 32, 124, 0.3) 60%, transparent 100%), url(${competitionImage})`
            : absoluteBackgroundImage 
              ? `linear-gradient(to right, rgba(67, 32, 124, 0.95) 0%, rgba(67, 32, 124, 0.9) 30%, rgba(67, 32, 124, 0.3) 60%, transparent 100%), url(${absoluteBackgroundImage})`
              : 'linear-gradient(to right, #43207c, #43207c)',
          backgroundPosition: 'center right',
          backgroundSize: 'cover'
        }}
      />

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto h-full flex flex-col justify-center px-6 sm:px-8 lg:px-12">
        <div className="w-full md:w-2/3 lg:w-1/2">
          {/* Main Title - Bold, Large Text */}
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold mb-4 text-white tracking-tight leading-[1.1]">
            {title}
          </h1>
          
          {/* Draw Date - Fixed text as per request */}
          <div className="mb-8 text-[#38b6ff] text-3xl font-bold tracking-wide">
            {drawDateText}
          </div>
          
          {/* Enter Button - Styled like the reference image */}
          <div className="mt-4">
            <Link to={heroBannerCompetition ? `/competitions/${heroBannerCompetition.id}` : "/competitions"}>
              <Button 
                size="lg"
                className="bg-red-800 hover:bg-red-900 text-white font-bold py-5 px-8 rounded-md text-xl flex items-center gap-2"
              >
                Enter now <Ticket className="h-5 w-5 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute top-2 right-2">
          <Loader2 className="h-4 w-4 animate-spin text-white" />
        </div>
      )}
    </section>
  );
}