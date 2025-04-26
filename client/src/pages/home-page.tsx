import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { CompetitionCard } from "@/components/competition/competition-card";
import { Competition } from "@shared/schema";
import { ChevronRight, Search, Ticket, Clock } from "lucide-react";
import { Loader2 } from "lucide-react";
import { HeroBanner } from "@/components/home/hero-banner";
import { CountdownTimer } from "@/components/countdown-timer";

export default function HomePage() {
  const { data: featuredCompetitions, isLoading } = useQuery<Competition[]>({
    queryKey: ["/api/competitions", { featured: true }],
    queryFn: async () => {
      const res = await fetch("/api/competitions?featured=true&live=true");
      if (!res.ok) throw new Error("Failed to fetch competitions");
      return res.json();
    }
  });
  
  const { data: liveCompetitions, isLoading: isLoadingLive } = useQuery<Competition[]>({
    queryKey: ["/api/competitions", { live: true }],
    queryFn: async () => {
      const res = await fetch("/api/competitions?live=true&listed=true");
      if (!res.ok) throw new Error("Failed to fetch live competitions");
      return res.json();
    }
  });

  return (
    <div>
      {/* Hero Section */}
      <HeroBanner />
      
      {/* Hot Picks Section - Overlapping with Hero Banner */}
      <section className="relative z-20 -mt-36 mb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <div className="inline-block bg-black/30 px-8 py-3 rounded-full backdrop-blur-sm border border-primary/20 shadow-[0_0_15px_rgba(123,57,237,0.4)]">
              <h2 className="text-3xl font-extrabold tracking-tight mx-auto text-white relative inline-block">
                Hot Picks for <span className="text-primary">{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                <span className="absolute -top-1 -right-4 text-yellow-400 text-lg animate-pulse-slow">🔥</span>
              </h2>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {isLoadingLive ? (
              <div className="col-span-3 flex justify-center items-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
                <span className="text-white">Loading top competitions...</span>
              </div>
            ) : liveCompetitions && liveCompetitions.length > 0 ? (
              liveCompetitions.slice(0, 3).map((competition, index) => {
                // Determine colors based on category or index
                const colors = [
                  {
                    border: "border-primary/50",
                    glow: "shadow-[0_0_25px_rgba(123,57,237,0.5)]",
                    hoverGlow: "hover:shadow-[0_0_35px_rgba(123,57,237,0.8)]",
                    bg1: "bg-primary/30",
                    bg2: "bg-primary/20",
                    gradient: "from-primary/10",
                    header: "from-primary to-primary/80",
                    text: "text-primary",
                    buttonBorder: "border-primary",
                    buttonHover: "hover:bg-primary/10",
                    badge: competition.isFeatured ? "Featured" : 
                           competition.category === "cash" ? "Cash Prize" : "Hot Pick"
                  },
                  {
                    border: "border-pink-500/50",
                    glow: "shadow-[0_0_25px_rgba(236,72,153,0.5)]",
                    hoverGlow: "hover:shadow-[0_0_35px_rgba(236,72,153,0.8)]",
                    bg1: "bg-pink-500/30",
                    bg2: "bg-pink-500/20",
                    gradient: "from-pink-500/10",
                    header: "from-pink-500 to-pink-500/80",
                    text: "text-pink-500",
                    buttonBorder: "border-pink-500",
                    buttonHover: "hover:bg-pink-500/10",
                    badge: competition.isFeatured ? "Popular" : 
                           (competition.ticketsSold || 0) > competition.totalTickets * 0.5 ? "Selling Fast" : "Hot Pick"
                  },
                  {
                    border: "border-green-500/50",
                    glow: "shadow-[0_0_25px_rgba(34,197,94,0.5)]",
                    hoverGlow: "hover:shadow-[0_0_35px_rgba(34,197,94,0.8)]",
                    bg1: "bg-green-500/30",
                    bg2: "bg-green-500/20",
                    gradient: "from-green-500/10",
                    header: "from-green-500 to-green-500/80",
                    text: "text-green-500",
                    buttonBorder: "border-green-500",
                    buttonHover: "hover:bg-green-500/10",
                    badge: competition.isFeatured ? "Trending" : 
                           new Date(competition.drawDate) < new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) ? "Ending Soon" : "Hot Pick"
                  }
                ];
                
                const color = colors[index % colors.length];
                
                // Calculate days remaining for countdown
                const today = new Date();
                const drawDate = new Date(competition.drawDate);
                const daysRemaining = Math.max(0, Math.ceil((drawDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
                
                return (
                  <div 
                    key={competition.id}
                    className={`bg-card rounded-xl border-2 ${color.border} ${color.glow} transition-all duration-300 ${color.hoverGlow} hover:-translate-y-2 group relative overflow-hidden transform`}
                  >
                    <div className={`absolute -right-6 -top-6 w-12 h-12 ${color.bg1} blur-xl rounded-full`}></div>
                    <div className={`absolute -left-6 -bottom-6 w-12 h-12 ${color.bg2} blur-xl rounded-full`}></div>
                    <div className={`absolute inset-0 bg-gradient-to-br ${color.gradient} to-transparent`}></div>
                    
                    {/* Image */}
                    <div className="relative h-44 overflow-hidden rounded-t-lg">
                      <img 
                        src={competition.imageUrl || "https://placehold.co/600x400/1a1f2b/FFFFFF/png?text=No+Image"} 
                        alt={competition.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                    </div>
                    
                    {/* Colored header */}
                    <div className={`bg-gradient-to-r ${color.header} p-4 flex justify-between items-center`}>
                      <h3 className="text-xl font-bold text-white">{competition.title}</h3>
                      <span className="px-2 py-1 bg-white/20 text-white text-xs rounded-full font-medium backdrop-blur-sm">
                        {color.badge}
                      </span>
                    </div>
                    
                    <div className="p-6 relative z-10">
                      <div className="flex items-center justify-between mb-3">
                        <span className={`flex items-center font-bold ${color.text}`}>
                          <Ticket className="h-4 w-4 mr-1" />
                          £{(competition.ticketPrice / 100).toFixed(2)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {competition.ticketsSold || 0} / {competition.totalTickets} sold
                        </span>
                      </div>
                      
                      <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full mb-4">
                        <div 
                          className={`h-2 rounded-full ${
                            index === 0 ? "bg-primary" : 
                            index === 1 ? "bg-pink-500" : 
                            "bg-green-500"
                          }`}
                          style={{ width: `${Math.min(100, ((competition.ticketsSold || 0) / competition.totalTickets) * 100)}%` }}
                        ></div>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <CountdownTimer days={daysRemaining} color={index === 0 ? "primary" : index === 1 ? "pink" : "green"} />
                        <Link to={`/competitions/${competition.id}`}>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className={`${color.buttonBorder} ${color.text} ${color.buttonHover}`}
                          >
                            View
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-3 flex flex-col items-center justify-center py-20 px-4 border-2 border-dashed border-white/20 rounded-xl">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <Ticket className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">No Live Competitions</h3>
                <p className="text-gray-400 text-center max-w-md mb-4">
                  We're preparing some exciting new competitions. Check back soon!
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
      
      {/* How to Play Section */}
      <section className="pt-10 pb-16 bg-background relative overflow-hidden">
        {/* Fun background elements */}
        <div className="absolute -top-16 -left-16 w-32 h-32 bg-primary/5 rounded-full blur-3xl"></div>
        <div className="absolute top-1/4 right-0 w-48 h-48 bg-purple-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-1/4 w-40 h-40 bg-orange-500/5 rounded-full blur-3xl"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-8">
            <h2 className="text-4xl font-extrabold mb-3 tracking-tight mx-auto">
              How To <span className="text-primary relative">Play
                <span className="absolute -top-1 -right-4 text-yellow-400 text-lg">✨</span>
              </span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto mb-6 text-lg font-light">
              Just <span className="text-primary font-medium">four simple steps</span> to start winning amazing prizes!
            </p>
            <Link to="/how-to-play">
              <Button className="mb-6 inline-flex items-center px-6 py-3 text-base shine-btn shadow-lg shadow-primary/20">
                Detailed Guide <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Step 1 */}
            <div className="bg-card rounded-xl p-8 border border-primary transition-all duration-300 shadow-[0_0_20px_rgba(0,153,255,0.5)] group relative overflow-hidden">
              {/* Number badge */}
              <div className="absolute -top-3 -right-3 w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg transform rotate-12 transition-transform">1</div>
              
              <h3 className="text-2xl font-bold text-primary mb-3 transition-colors mt-4">Browse Competitions</h3>
              <p className="text-muted-foreground font-light text-base">
                Explore our wide range of exciting competitions across different categories and platforms.
              </p>
              <div className="mt-6 w-full h-2 bg-primary/20 rounded-full overflow-hidden">
                <div className="h-full w-1/4 bg-primary"></div>
              </div>
            </div>
            
            {/* Step 2 */}
            <div className="bg-card rounded-xl p-8 border border-purple-500 transition-all duration-300 shadow-[0_0_20px_rgba(155,89,182,0.5)] group relative overflow-hidden">
              {/* Number badge */}
              <div className="absolute -top-3 -right-3 w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg transform rotate-12 transition-transform">2</div>
              
              <h3 className="text-2xl font-bold text-purple-500 mb-3 transition-colors mt-4">Enter & Follow Steps</h3>
              <p className="text-muted-foreground font-light text-base">
                Select a competition and follow the simple entry steps to secure your tickets.
              </p>
              <div className="mt-6 w-full h-2 bg-purple-500/20 rounded-full overflow-hidden">
                <div className="h-full w-1/2 bg-purple-500"></div>
              </div>
            </div>
            
            {/* Step 3 */}
            <div className="bg-card rounded-xl p-8 border border-blue-500 transition-all duration-300 shadow-[0_0_20px_rgba(66,153,225,0.5)] group relative overflow-hidden">
              {/* Number badge */}
              <div className="absolute -top-3 -right-3 w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg transform rotate-12 transition-transform">3</div>
              
              <h3 className="text-2xl font-bold text-blue-500 mb-3 transition-colors mt-4">Track Entries</h3>
              <p className="text-muted-foreground font-light text-base">
                Monitor your active entries and check competition closing dates on your dashboard.
              </p>
              <div className="mt-6 w-full h-2 bg-blue-500/20 rounded-full overflow-hidden">
                <div className="h-full w-3/4 bg-blue-500"></div>
              </div>
            </div>
            
            {/* Step 4 */}
            <div className="bg-card rounded-xl p-8 border border-orange-500 transition-all duration-300 shadow-[0_0_20px_rgba(255,127,80,0.5)] group relative overflow-hidden">
              {/* Number badge */}
              <div className="absolute -top-3 -right-3 w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg transform rotate-12 transition-transform">4</div>
              
              <h3 className="text-2xl font-bold text-orange-500 mb-3 transition-colors mt-4">Win & Celebrate</h3>
              <p className="text-muted-foreground font-light text-base">
                Get notified when you win and follow the simple claim process to receive your prize!
              </p>
              <div className="mt-6 w-full h-2 bg-orange-500/20 rounded-full overflow-hidden">
                <div className="h-full w-full bg-orange-500"></div>
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
            <h2 className="text-4xl font-extrabold mb-4 tracking-tight mx-auto">
              <span className="text-primary relative">Live</span> Competitions
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
              <Link to="/how-to-play">
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
            <Link to="/competitions">
              <Button size="lg" className="group shine-btn px-8 py-6 text-lg font-semibold shadow-lg shadow-primary/20">
                <Ticket className="mr-2 h-5 w-5" /> View All Competitions <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
