import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Search, ClipboardList } from "lucide-react";
import { Loader2 } from "lucide-react";
import { SiteConfig } from "@shared/schema";

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
    }
  });

  const backgroundImage = heroBannerConfig?.value || "";
  const hasBackgroundImage = backgroundImage && backgroundImage.trim() !== "";
  
  // Make sure the URL is absolute for cross-domain compatibility
  const absoluteBackgroundImage = backgroundImage && !backgroundImage.startsWith('http') 
    ? `${window.location.origin}${backgroundImage}` 
    : backgroundImage;

  return (
    <section 
      className={`relative py-48 overflow-hidden ${
        hasBackgroundImage 
          ? "bg-cover bg-center" 
          : "bg-gradient-to-b from-background to-background/70"
      }`}
      style={hasBackgroundImage ? { backgroundImage: `url(${absoluteBackgroundImage})` } : {}}
    >
      {/* Add overlay when background image is present */}
      {hasBackgroundImage && (
        <div className="absolute inset-0 bg-black/60"></div>
      )}

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
        <div className="text-center py-12">
          <h1 className="text-5xl md:text-7xl font-extrabold mb-4 relative">
            <span className="relative inline-block">
              <span className="text-primary">Competition</span>
              <span className="absolute -top-6 -right-6 text-yellow-400 text-3xl transform rotate-12">★</span>
            </span>
            <span className="font-light tracking-wider">Time</span>
            <span className="absolute -bottom-2 -right-2 text-pink-400 text-2xl transform -rotate-6">✦</span>
          </h1>
          <p className="mt-8 max-w-md mx-auto text-muted-foreground sm:text-xl md:mt-10 md:text-2xl md:max-w-4xl font-light">
            Your premier destination for discovering, participating in, and winning exclusive
            <span className="px-2 py-1 mx-1 bg-primary/20 rounded-md text-primary font-semibold">competitions</span>
            across multiple platforms.
          </p>
          <div className="mt-12 flex flex-wrap justify-center gap-6">
            <Link href="/competitions">
              <Button size="lg" className="group shine-btn px-8 py-6 text-lg font-semibold shadow-lg shadow-primary/20">
                <Search className="mr-3 h-6 w-6 animate-pulse-slow" /> View Competitions
              </Button>
            </Link>
            <Link href="/my-entries">
              <Button size="lg" variant="outline" className="border-primary border-2 text-primary hover:bg-primary/10 px-8 py-6 text-lg font-semibold group">
                <ClipboardList className="mr-3 h-6 w-6 group-hover:animate-wiggle" /> My Entries
              </Button>
            </Link>
          </div>
        </div>
      </div>
      
      {/* Keep decorative elements when no background image */}
      {!hasBackgroundImage && (
        <>
          <div className="absolute top-20 left-10 w-20 h-20 bg-yellow-500/20 rounded-full blur-2xl"></div>
          <div className="absolute bottom-10 right-10 w-32 h-32 bg-pink-500/20 rounded-full blur-3xl"></div>
          <div className="absolute top-40 right-20 w-16 h-16 bg-green-500/20 rounded-full blur-xl"></div>
          <div className="absolute bottom-40 left-20 w-24 h-24 bg-blue-500/20 rounded-full blur-2xl"></div>
          <div className="absolute top-60 left-[40%] w-16 h-16 bg-purple-500/20 rounded-full blur-xl"></div>
        </>
      )}

      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute top-2 right-2">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
        </div>
      )}
    </section>
  );
}