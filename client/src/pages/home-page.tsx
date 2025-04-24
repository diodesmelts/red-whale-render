import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { CompetitionCard } from "@/components/competition/competition-card";
import { Competition } from "@shared/schema";
import { ChevronRight, Search } from "lucide-react";
import { Loader2 } from "lucide-react";
import { HeroBanner } from "@/components/home/hero-banner";

export default function HomePage() {
  const { data: featuredCompetitions, isLoading } = useQuery<Competition[]>({
    queryKey: ["/api/competitions", { featured: true }],
    queryFn: async () => {
      const res = await fetch("/api/competitions?featured=true&live=true");
      if (!res.ok) throw new Error("Failed to fetch competitions");
      return res.json();
    }
  });

  return (
    <div>
      {/* Hero Section */}
      <HeroBanner />
      
      {/* How to Play Section */}
      <section className="py-20 bg-background relative overflow-hidden">
        {/* Fun background elements */}
        <div className="absolute -top-16 -left-16 w-32 h-32 bg-primary/5 rounded-full blur-3xl"></div>
        <div className="absolute top-1/4 right-0 w-48 h-48 bg-purple-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-1/4 w-40 h-40 bg-orange-500/5 rounded-full blur-3xl"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1 text-sm font-semibold rounded-full bg-primary/20 text-primary mb-3 animate-pulse-slow">
              GETTING STARTED
            </span>
            <h2 className="text-4xl font-extrabold mb-4 tracking-tight relative inline-block">
              How To <span className="text-primary relative">Play
                <span className="absolute -top-1 -right-4 text-yellow-400 text-lg">✨</span>
              </span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto mb-8 text-lg font-light">
              Just <span className="text-primary font-medium">four simple steps</span> to start winning amazing prizes!
            </p>
            <Link href="/how-to-play">
              <Button className="mb-16 inline-flex items-center px-6 py-3 text-base shine-btn shadow-lg shadow-primary/20">
                Detailed Guide <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Step 1 */}
            <div className="bg-card rounded-xl p-8 border border-border hover:border-primary transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,153,255,0.5)] group relative overflow-hidden">
              {/* Number badge */}
              <div className="absolute -top-3 -right-3 w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg transform group-hover:rotate-12 transition-transform">1</div>
              
              <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mb-6 group-hover:animate-pulse transition-all duration-300 group-hover:scale-110">
                <i className="fas fa-search text-primary text-2xl"></i>
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors">Browse Competitions</h3>
              <p className="text-muted-foreground font-light text-base">
                Explore our wide range of exciting competitions across different categories and platforms.
              </p>
              <div className="mt-6 w-full h-2 bg-primary/20 rounded-full overflow-hidden">
                <div className="h-full w-full bg-primary animate-pulse-slow"></div>
              </div>
            </div>
            
            {/* Step 2 */}
            <div className="bg-card rounded-xl p-8 border border-border hover:border-purple-500 transition-all duration-300 hover:shadow-[0_0_20px_rgba(155,89,182,0.5)] group relative overflow-hidden">
              {/* Number badge */}
              <div className="absolute -top-3 -right-3 w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg transform group-hover:rotate-12 transition-transform">2</div>
              
              <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mb-6 group-hover:animate-pulse transition-all duration-300 group-hover:scale-110">
                <i className="fas fa-ticket-alt text-purple-500 text-2xl"></i>
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-3 group-hover:text-purple-500 transition-colors">Enter & Follow Steps</h3>
              <p className="text-muted-foreground font-light text-base">
                Select a competition and follow the simple entry steps to secure your tickets.
              </p>
              <div className="mt-6 w-full h-2 bg-purple-500/20 rounded-full overflow-hidden">
                <div className="h-full w-2/3 bg-purple-500 animate-pulse-slow"></div>
              </div>
            </div>
            
            {/* Step 3 */}
            <div className="bg-card rounded-xl p-8 border border-border hover:border-blue-500 transition-all duration-300 hover:shadow-[0_0_20px_rgba(66,153,225,0.5)] group relative overflow-hidden">
              {/* Number badge */}
              <div className="absolute -top-3 -right-3 w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg transform group-hover:rotate-12 transition-transform">3</div>
              
              <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mb-6 group-hover:animate-pulse transition-all duration-300 group-hover:scale-110">
                <i className="fas fa-chart-line text-blue-500 text-2xl"></i>
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-3 group-hover:text-blue-500 transition-colors">Track Entries</h3>
              <p className="text-muted-foreground font-light text-base">
                Monitor your active entries and check competition closing dates on your dashboard.
              </p>
              <div className="mt-6 w-full h-2 bg-blue-500/20 rounded-full overflow-hidden">
                <div className="h-full w-1/2 bg-blue-500 animate-pulse-slow"></div>
              </div>
            </div>
            
            {/* Step 4 */}
            <div className="bg-card rounded-xl p-8 border border-border hover:border-orange-500 transition-all duration-300 hover:shadow-[0_0_20px_rgba(255,127,80,0.5)] group relative overflow-hidden">
              {/* Number badge */}
              <div className="absolute -top-3 -right-3 w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg transform group-hover:rotate-12 transition-transform">4</div>
              
              <div className="w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center mb-6 group-hover:animate-pulse transition-all duration-300 group-hover:scale-110">
                <i className="fas fa-trophy text-orange-500 text-2xl"></i>
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-3 group-hover:text-orange-500 transition-colors">Win & Celebrate</h3>
              <p className="text-muted-foreground font-light text-base">
                Get notified when you win and follow the simple claim process to receive your prize!
              </p>
              <div className="mt-6 w-full h-2 bg-orange-500/20 rounded-full overflow-hidden">
                <div className="h-full w-1/4 bg-orange-500 animate-pulse-slow"></div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Featured Competitions Section */}
      <section className="py-24 bg-background relative overflow-hidden">
        {/* Fun background elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-0 w-80 h-80 bg-primary/5 rounded-full blur-3xl"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1 text-sm font-semibold rounded-full bg-primary/20 text-primary mb-3 animate-pulse-slow">
              CURRENT OPPORTUNITIES
            </span>
            <h2 className="text-4xl font-extrabold mb-4 tracking-tight relative inline-block">
              <span className="text-primary relative">Live</span>Competitions
              <span className="absolute -top-1 -right-5 text-yellow-400 text-lg transform rotate-12">🏆</span>
            </h2>
            <p className="text-muted-foreground mt-4 max-w-2xl mx-auto text-lg font-light">
              Don't miss your chance to win these <span className="text-primary font-medium">amazing prizes</span>! New competitions added regularly.
            </p>
            
            {/* Decorative line with highlight */}
            <div className="relative w-32 h-1.5 bg-primary/30 mx-auto mt-8 rounded-full overflow-hidden">
              <div className="absolute inset-0 w-full h-full bg-primary animate-shine" 
                style={{ backgroundImage: 'linear-gradient(to right, transparent, rgba(255,255,255,0.5) 50%, transparent 100%)' }}>
              </div>
            </div>
          </div>
          
          {isLoading ? (
            <div className="flex flex-col justify-center items-center py-32">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground animate-pulse">Loading amazing competitions...</p>
            </div>
          ) : featuredCompetitions?.length === 0 ? (
            <div className="flex flex-col justify-center items-center py-20 px-4 border-2 border-dashed border-border rounded-xl">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6 animate-pulse-slow">
                <i className="fas fa-trophy text-primary text-3xl"></i>
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-3">No Active Competitions</h3>
              <p className="text-muted-foreground max-w-md text-center mb-6">
                We're preparing some exciting new competitions. Check back soon or follow us on social media for updates!
              </p>
              <Link href="/how-to-play">
                <Button variant="outline" className="border-primary border-2 text-primary hover:bg-primary/10">
                  Learn How Competitions Work
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 mb-16">
              {featuredCompetitions?.map(competition => (
                <CompetitionCard key={competition.id} competition={competition} />
              ))}
            </div>
          )}
          
          <div className="text-center">
            <Link href="/competitions">
              <Button size="lg" className="group shine-btn px-8 py-6 text-lg font-semibold shadow-lg shadow-primary/20">
                <i className="fas fa-trophy mr-2"></i> View All Competitions <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
