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
      
      {/* HOW TO PLAY Section */}
      <section className="relative z-20 py-16 bg-background overflow-hidden">
        {/* Fun background elements */}
        <div className="absolute -top-16 -left-16 w-32 h-32 bg-primary/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/4 right-0 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-1/4 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-extrabold mb-3 tracking-tight mx-auto text-white">
              HOW TO <span className="text-primary relative">PLAY
                <span className="absolute -top-1 -right-4 text-yellow-400 text-lg">✨</span>
              </span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto mb-6 text-lg">
              Just <span className="text-primary font-medium">three simple steps</span> to start winning amazing prizes!
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="bg-card/40 backdrop-blur-sm rounded-xl p-8 border border-primary/20 transition-all duration-300 shadow-[0_0_20px_rgba(123,57,237,0.2)] hover:shadow-[0_0_30px_rgba(123,57,237,0.4)] group relative overflow-hidden">
              {/* Number badge */}
              <div className="absolute -top-3 -right-3 w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg transform rotate-12 transition-transform group-hover:rotate-0">1</div>
              
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">Get Your Tickets</h3>
                <p className="text-gray-300">Browse our amazing competitions and secure your tickets to win. The more tickets, the better your chances!</p>
              </div>
            </div>
            
            <div className="bg-card/40 backdrop-blur-sm rounded-xl p-8 border border-purple-500/20 transition-all duration-300 shadow-[0_0_20px_rgba(168,85,247,0.2)] hover:shadow-[0_0_30px_rgba(168,85,247,0.4)] group relative overflow-hidden">
              {/* Number badge */}
              <div className="absolute -top-3 -right-3 w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg transform rotate-12 transition-transform group-hover:rotate-0">2</div>
              
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-purple-500/10 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">Watch Live Draws</h3>
                <p className="text-gray-300">All winners are selected randomly during our exciting live streamed draws. Get ready for the thrill!</p>
              </div>
            </div>
            
            <div className="bg-card/40 backdrop-blur-sm rounded-xl p-8 border border-blue-500/20 transition-all duration-300 shadow-[0_0_20px_rgba(59,130,246,0.2)] hover:shadow-[0_0_30px_rgba(59,130,246,0.4)] group relative overflow-hidden">
              {/* Number badge */}
              <div className="absolute -top-3 -right-3 w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg transform rotate-12 transition-transform group-hover:rotate-0">3</div>
              
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">Win & Celebrate!</h3>
                <p className="text-gray-300">Get notified when you win and celebrate your new prize! We'll deliver it straight to your door.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Hot Picks Section - Active Competitions */}
      <section className="relative z-20 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-extrabold tracking-tight mx-auto text-white relative inline-block">
              Live <span className="text-primary">Competitions</span>
            </h2>
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
                        {index === 0 ? "Featured" : index === 1 ? "Popular" : "Ending Soon"}
                      </span>
                    </div>
                    
                    <div className="p-4 relative z-10">
                      <div className="flex items-center justify-between mb-3">
                        <span className="flex items-center font-bold text-white">
                          <Ticket className="h-4 w-4 mr-1" />
                          £{(competition.ticketPrice / 100).toFixed(2)}
                        </span>
                        <span className="text-xs text-white">
                          {competition.ticketsSold || 0} / {competition.totalTickets} sold
                        </span>
                      </div>
                      
                      <div className="w-full h-1 bg-gray-700 rounded-full mb-4">
                        <div 
                          className={`h-1 rounded-full ${
                            index === 0 ? "bg-blue-500" : 
                            index === 1 ? "bg-pink-500" : 
                            "bg-green-500"
                          }`}
                          style={{ width: `${Math.min(100, ((competition.ticketsSold || 0) / competition.totalTickets) * 100)}%` }}
                        ></div>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div className="flex items-center text-white text-sm">
                          <Clock className="h-4 w-4 mr-1" />
                          {daysRemaining}d : 23h : 58m : 50s
                        </div>
                        <Link to={`/competitions/${competition.id}`}>
                          <Button 
                            size="sm" 
                            className="bg-blue-500 hover:bg-blue-600 text-white"
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
