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

  return (
    <section 
      className={`relative py-20 overflow-hidden ${
        hasBackgroundImage 
          ? "bg-cover bg-center" 
          : "bg-gradient-to-b from-background to-background/70"
      }`}
      style={hasBackgroundImage ? { backgroundImage: `url(${backgroundImage})` } : {}}
    >
      {/* Add overlay when background image is present */}
      {hasBackgroundImage && (
        <div className="absolute inset-0 bg-black/60"></div>
      )}

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold">
            <span className="text-primary">Competition</span>Time
          </h1>
          <p className="mt-3 max-w-md mx-auto text-muted-foreground sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            Your premier destination for discovering, participating in, and winning exclusive competitions across multiple platforms.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link href="/competitions">
              <Button size="lg" className="group relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full bg-white/20 transform -translate-x-full group-hover:translate-x-full transition-transform duration-500"></div>
                <Search className="mr-2 h-5 w-5" /> View Competitions
              </Button>
            </Link>
            <Link href="/my-entries">
              <Button size="lg" variant="outline" className="border-primary text-primary hover:bg-primary/10">
                <ClipboardList className="mr-2 h-5 w-5" /> My Entries
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