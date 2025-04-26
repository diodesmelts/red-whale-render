import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { SiteConfig } from "@shared/schema";
import { getImageUrl } from "@/lib/utils";

export function HeroBanner() {
  const { data: heroBannerConfig, isLoading } = useQuery<SiteConfig>({
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

  const backgroundImage = heroBannerConfig?.value || "";
  const hasBackgroundImage = backgroundImage && backgroundImage.trim() !== "";
  
  // Make sure the URL is absolute for cross-domain compatibility using our utility function
  const absoluteBackgroundImage = getImageUrl(backgroundImage);

  return (
    <section 
      className={`relative pt-24 pb-40 overflow-hidden ${
        hasBackgroundImage 
          ? "bg-cover bg-center" 
          : "bg-gradient-to-b from-background to-background/70"
      }`}
      style={hasBackgroundImage ? { 
        backgroundImage: `linear-gradient(rgba(0, 0, 30, 0.05), rgba(0, 0, 30, 0.05)), url(${absoluteBackgroundImage})` 
      } : {}}
    >
      {/* Darkening filter with blue hue (5%) */}

      {/* Confetti elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="animate-float absolute top-20 left-[10%] w-4 h-4 bg-primary/50 rounded-full"></div>
        <div className="animate-float absolute top-36 left-[20%] w-6 h-6 bg-yellow-500/40 rounded-full" style={{animationDelay: '0.5s'}}></div>
        <div className="animate-float absolute top-48 left-[80%] w-8 h-8 bg-pink-500/40 rounded-full" style={{animationDelay: '1.5s'}}></div>
        <div className="animate-float absolute top-24 left-[65%] w-3 h-3 bg-green-500/40 rounded-full" style={{animationDelay: '0.7s'}}></div>
        <div className="animate-float absolute top-56 left-[30%] w-5 h-5 bg-blue-500/40 rounded-full" style={{animationDelay: '1.2s'}}></div>
        <div className="animate-float absolute top-72 left-[90%] w-4 h-4 bg-purple-500/40 rounded-full" style={{animationDelay: '0.3s'}}></div>
        <div className="animate-float absolute top-16 left-[50%] w-6 h-6 bg-red-500/40 rounded-full" style={{animationDelay: '0.9s'}}></div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center py-4">
          <h1 className="text-5xl md:text-7xl font-light mb-4 relative">
            <span className="relative inline-block">
              {hasBackgroundImage ? (
                <span className="text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">Let's have a</span>
              ) : (
                <span className="text-white">Let's have a</span>
              )}
              <span className="absolute -top-6 -right-6 text-yellow-400 text-3xl transform rotate-12">★</span>
            </span>
            {hasBackgroundImage ? (
              <span className="font-light tracking-wider text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"> <span className="font-extrabold">whale</span> of a time</span>
            ) : (
              <span className="font-light tracking-wider"> <span className="font-extrabold">whale</span> of a time</span>
            )}
            <span className="absolute -bottom-2 -right-2 text-pink-400 text-2xl transform -rotate-6">✦</span>
          </h1>
          <p className={`mt-6 max-w-md mx-auto sm:text-xl md:mt-8 md:text-xl md:max-w-3xl font-light ${
            hasBackgroundImage ? "text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]" : "text-white"
          }`}>
            Crazy odds. High win rates. Investing in fun!
          </p>
          {/* Buttons removed as requested */}
        </div>
      </div>
      
      {/* No background circles as per user request */}

      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute top-2 right-2">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
        </div>
      )}
    </section>
  );
}