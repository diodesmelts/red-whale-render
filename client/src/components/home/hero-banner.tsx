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
          return { key: "heroBannerTitle", value: "Ready to win? Win £1,000 TODAY" };
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
  const title = heroBannerTitle?.value || "Ready to win? Win £1,000 TODAY";

  return (
    <section 
      className={`relative pt-48 pb-48 overflow-hidden ${
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-[90]">
        <div className="text-center py-4">
          {/* Win Tab */}
          <div className="inline-block bg-gradient-to-r from-purple-600 to-pink-500 text-white font-bold px-6 py-2 rounded mb-2 text-lg shadow-lg">
            WIN
          </div>
          
          {/* Main Title - Using title from site config */}
          <h1 className="text-5xl md:text-7xl font-bold mb-2 relative text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
            {title}
          </h1>
          
          {/* Subtitle */}
          <p className="text-white text-lg mb-6 opacity-90">Crazy odds. High win rates. Investing in fun!</p>
          
          {/* Competition Details */}
          {heroBannerCompetition && !isLoading ? (
            <div className="mt-4 bg-black/50 backdrop-blur-sm p-6 rounded-xl max-w-3xl mx-auto border border-white/10 shadow-xl hidden sm:block">
              <div className="flex items-center justify-between gap-6">
                <div className="flex items-center text-white">
                  <Ticket className="h-5 w-5 mr-2 text-white" />
                  <span className="text-xl font-semibold">
                    £{(heroBannerCompetition.ticketPrice / 100).toFixed(2)} per ticket
                  </span>
                </div>
                
                <div className="flex items-center text-white">
                  <Clock className="h-5 w-5 mr-2 text-white" />
                  <span className="text-lg">
                    Draw {formatTimeRemaining(heroBannerCompetition.drawDate)}
                  </span>
                </div>
                
                <div className="flex items-center text-white">
                  <Trophy className="h-5 w-5 mr-2 text-white" />
                  <span className="text-lg">
                    {heroBannerCompetition.ticketsSold} / {heroBannerCompetition.totalTickets} sold
                  </span>
                </div>
                
                <Link to={`/competitions/${heroBannerCompetition.id}`}>
                  <Button size="lg" className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-700 text-white font-bold px-6 text-lg">
                    Enter Now
                  </Button>
                </Link>
              </div>
            </div>
          ) : null}
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