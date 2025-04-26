import { useQuery } from "@tanstack/react-query";
import { Loader2, Clock, Ticket, Trophy } from "lucide-react";
import { SiteConfig, Competition } from "@shared/schema";
import { getImageUrl } from "@/lib/utils";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { Progress } from "@/components/ui/progress";

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
          return { key: "heroBannerTitle", value: "Turbo Cash Instants" };
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

  const isLoading = isLoadingBanner || isLoadingCompetitions || isLoadingTitle;
  const title = heroBannerTitle?.value || "Turbo Cash Instants";

  return (
    <section 
      className={`relative pt-24 pb-40 overflow-hidden ${
        hasBackgroundImage 
          ? "bg-cover bg-center" 
          : "bg-gradient-to-b from-background to-background/70"
      }`}
      style={hasBackgroundImage ? { 
        backgroundImage: `linear-gradient(rgba(0, 0, 30, 0.15), rgba(0, 0, 30, 0.15)), url(${absoluteBackgroundImage})`,
        zIndex: -1
      } : {}}
    >
      {/* Confetti elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{zIndex: -1}}>
        <div className="animate-float absolute top-20 left-[10%] w-4 h-4 bg-primary/50 rounded-full"></div>
        <div className="animate-float absolute top-36 left-[20%] w-6 h-6 bg-yellow-500/40 rounded-full" style={{animationDelay: '0.5s'}}></div>
        <div className="animate-float absolute top-48 left-[80%] w-8 h-8 bg-pink-500/40 rounded-full" style={{animationDelay: '1.5s'}}></div>
        <div className="animate-float absolute top-24 left-[65%] w-3 h-3 bg-green-500/40 rounded-full" style={{animationDelay: '0.7s'}}></div>
        <div className="animate-float absolute top-56 left-[30%] w-5 h-5 bg-blue-500/40 rounded-full" style={{animationDelay: '1.2s'}}></div>
        <div className="animate-float absolute top-72 left-[90%] w-4 h-4 bg-purple-500/40 rounded-full" style={{animationDelay: '0.3s'}}></div>
        <div className="animate-float absolute top-16 left-[50%] w-6 h-6 bg-red-500/40 rounded-full" style={{animationDelay: '0.9s'}}></div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-[90]">
        <div className="text-center py-4">
          {/* Win Tab */}
          <div className="inline-block bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold px-6 py-2 rounded-t-lg mb-2 text-lg shadow-lg">
            WIN
          </div>
          
          {/* Main Title - Using title from site config */}
          <h1 className="text-5xl md:text-7xl font-bold mb-6 relative">
            <span className={hasBackgroundImage ? "text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" : "text-white"}>
              {title}
            </span>
            <span className="absolute -top-6 right-8 text-yellow-400 text-3xl transform rotate-12">★</span>
            <span className="absolute -bottom-2 left-1/4 text-pink-400 text-2xl transform -rotate-6">✦</span>
          </h1>
          
          {/* Competition Details */}
          {heroBannerCompetition && !isLoading ? (
            <div className="mt-8 bg-black/40 backdrop-blur-sm p-6 rounded-xl inline-block max-w-2xl mx-auto border border-white/10 shadow-xl">
              <div className="flex flex-col gap-6">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-white mb-2">{heroBannerCompetition.title}</h2>
                </div>
                
                <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
                  <div className="flex flex-col w-full sm:w-auto">
                    <div className="flex items-center text-white mb-2">
                      <Ticket className="h-5 w-5 mr-2 text-primary" />
                      <span className="text-xl font-semibold">
                        £{(heroBannerCompetition.ticketPrice / 100).toFixed(2)} per ticket
                      </span>
                    </div>
                    
                    <div className="flex items-center text-white mb-2">
                      <Clock className="h-5 w-5 mr-2 text-primary" />
                      <span className="text-lg">
                        Draw {formatTimeRemaining(heroBannerCompetition.drawDate)}
                      </span>
                    </div>
                    
                    <div className="flex flex-col text-white mb-2 w-full max-w-xs">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm flex items-center">
                          <Trophy className="h-4 w-4 mr-1 text-primary" />
                          Tickets Sold:
                        </span>
                        <span className="text-sm font-medium">
                          {heroBannerCompetition.ticketsSold} / {heroBannerCompetition.totalTickets}
                        </span>
                      </div>
                      <Progress 
                        value={calculateTicketPercentage(
                          heroBannerCompetition.ticketsSold, 
                          heroBannerCompetition.totalTickets
                        )}
                        className="h-2 bg-gray-700"
                      />
                    </div>
                  </div>
                  
                  <Link to={`/competitions/${heroBannerCompetition.id}`}>
                    <Button size="lg" className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-700 text-white font-bold px-8 text-lg">
                      Enter Competition
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <p className={`mt-6 max-w-md mx-auto sm:text-xl md:mt-8 md:text-xl md:max-w-3xl font-light ${
              hasBackgroundImage ? "text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]" : "text-white"
            }`}>
              Crazy odds. High win rates. Investing in fun!
            </p>
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