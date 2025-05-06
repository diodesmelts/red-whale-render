import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { CompetitionCard } from "@/components/competition/competition-card";
import { Competition } from "@shared/schema";
import { ChevronRight, Search, Ticket, Clock, Filter } from "lucide-react";
import { Loader2 } from "lucide-react";
import { HeroBanner } from "@/components/home/hero-banner";
import { CountdownTimer } from "@/components/countdown-timer";
import { COMPETITION_CATEGORIES } from "@/lib/constants";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

export default function HomePage() {
  const [activeCategory, setActiveCategory] = useState<string | undefined>(undefined);
  const [filteredCompetitions, setFilteredCompetitions] = useState<Competition[]>([]);
  
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
  
  // Filter competitions based on the selected category
  useEffect(() => {
    if (!featuredCompetitions) return;
    
    if (!activeCategory) {
      setFilteredCompetitions(featuredCompetitions);
    } else {
      const filtered = featuredCompetitions.filter(
        competition => competition.category.toLowerCase() === activeCategory.toLowerCase()
      );
      setFilteredCompetitions(filtered);
    }
  }, [featuredCompetitions, activeCategory]);
  
  // Handle category filter change
  const handleCategoryChange = (category?: string) => {
    setActiveCategory(category === activeCategory ? undefined : category);
  };

  return (
    <div>
      {/* Hero Section */}
      <HeroBanner />
      
      {/* Featured Competitions Section */}
      <section className="py-20 bg-white relative overflow-hidden">
        {/* Fun background elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#bbd665]/10 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-20 left-0 w-80 h-80 bg-[#002147]/5 rounded-full blur-3xl"></div>
        <div className="absolute top-40 left-1/4 w-40 h-40 bg-[#002147]/5 rounded-full blur-xl animate-bounce-slow"></div>
        <div className="absolute bottom-40 right-1/4 w-24 h-24 bg-[#002147]/5 rounded-full blur-xl animate-spin-slow"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-extrabold mb-4 tracking-tight mx-auto text-[#002147]">
              <span className="text-[#002147] relative inline-block">Live
                <span className="absolute -top-1 -right-4 text-[#bbd665] text-lg">🔥</span>
              </span> Competitions
            </h2>
            <p className="text-[#002147]/80 mt-4 max-w-2xl mx-auto text-xl font-medium">
              Don't miss your chance to win these <span className="text-[#bbd665] font-semibold">amazing prizes</span>! New competitions added regularly.
            </p>
            
            {/* Decorative line with highlight */}
            <div className="relative w-32 h-1.5 bg-[#002147]/20 mx-auto mt-8 rounded-full overflow-hidden">
              <div className="absolute inset-0 w-full h-full bg-[#bbd665] animate-shine" 
                style={{ backgroundImage: 'linear-gradient(to right, transparent, rgba(255,255,255,0.5) 50%, transparent 100%)' }}>
              </div>
            </div>
          </div>
          
          {/* Category Filter Buttons */}
          <div className="flex flex-wrap justify-center gap-2 mb-10">
            <Button 
              variant={!activeCategory ? "default" : "outline"} 
              onClick={() => handleCategoryChange(undefined)}
              className={cn(
                "flex items-center",
                !activeCategory ? "bg-[#002147] hover:bg-[#002147]/90 text-white" : "text-[#002147] border-[#002147]/30"
              )}
            >
              <Filter className="h-4 w-4 mr-1" /> All Prizes
            </Button>
            
            <Button 
              variant={activeCategory === COMPETITION_CATEGORIES.CASH ? "default" : "outline"} 
              onClick={() => handleCategoryChange(COMPETITION_CATEGORIES.CASH)}
              className={cn(
                "flex items-center",
                activeCategory === COMPETITION_CATEGORIES.CASH ? "bg-green-500 hover:bg-green-600 text-white" : "text-[#002147] border-[#002147]/30"
              )}
            >
              <i className="fas fa-pound-sign mr-1"></i> Cash Prizes
            </Button>
            
            <Button 
              variant={activeCategory === COMPETITION_CATEGORIES.FAMILY ? "default" : "outline"} 
              onClick={() => handleCategoryChange(COMPETITION_CATEGORIES.FAMILY)}
              className={cn(
                "flex items-center",
                activeCategory === COMPETITION_CATEGORIES.FAMILY ? "bg-yellow-500 hover:bg-yellow-600 text-white" : "text-[#002147] border-[#002147]/30"
              )}
            >
              <i className="fas fa-users mr-1"></i> Family
            </Button>
            
            <Button 
              variant={activeCategory === COMPETITION_CATEGORIES.HOUSEHOLD ? "default" : "outline"} 
              onClick={() => handleCategoryChange(COMPETITION_CATEGORIES.HOUSEHOLD)}
              className={cn(
                "flex items-center",
                activeCategory === COMPETITION_CATEGORIES.HOUSEHOLD ? "bg-pink-500 hover:bg-pink-600 text-white" : "text-[#002147] border-[#002147]/30"
              )}
            >
              <i className="fas fa-blender mr-1"></i> Household
            </Button>
            
            <Button 
              variant={activeCategory === COMPETITION_CATEGORIES.ELECTRONICS ? "default" : "outline"} 
              onClick={() => handleCategoryChange(COMPETITION_CATEGORIES.ELECTRONICS)}
              className={cn(
                "flex items-center",
                activeCategory === COMPETITION_CATEGORIES.ELECTRONICS ? "bg-[#3b82f6] hover:bg-[#3b82f6]/90 text-white" : "text-[#002147] border-[#002147]/30"
              )}
            >
              <i className="fas fa-laptop mr-1"></i> Electronics
            </Button>
            
            <Button 
              variant={activeCategory === COMPETITION_CATEGORIES.TRAVEL ? "default" : "outline"} 
              onClick={() => handleCategoryChange(COMPETITION_CATEGORIES.TRAVEL)}
              className={cn(
                "flex items-center",
                activeCategory === COMPETITION_CATEGORIES.TRAVEL ? "bg-purple-500 hover:bg-purple-600 text-white" : "text-[#002147] border-[#002147]/30"
              )}
            >
              <i className="fas fa-plane mr-1"></i> Travel
            </Button>
            
            <Button 
              variant={activeCategory === COMPETITION_CATEGORIES.BEAUTY ? "default" : "outline"} 
              onClick={() => handleCategoryChange(COMPETITION_CATEGORIES.BEAUTY)}
              className={cn(
                "flex items-center",
                activeCategory === COMPETITION_CATEGORIES.BEAUTY ? "bg-rose-500 hover:bg-rose-600 text-white" : "text-[#002147] border-[#002147]/30"
              )}
            >
              <i className="fas fa-spa mr-1"></i> Beauty
            </Button>
          </div>
          
          {isLoading ? (
            <div className="flex flex-col justify-center items-center py-32">
              <Loader2 className="h-12 w-12 animate-spin text-[#bbd665] mb-4" />
              <p className="text-[#002147]/80 animate-pulse">Loading amazing competitions...</p>
            </div>
          ) : featuredCompetitions?.length === 0 ? (
            <div className="flex flex-col justify-center items-center py-20 px-4 border-2 border-dashed border-[#bbd665]/30 bg-[#002147]/5 rounded-xl">
              <div className="w-20 h-20 bg-[#bbd665]/20 rounded-full flex items-center justify-center mb-6 animate-pulse-slow">
                <i className="fas fa-trophy text-[#bbd665] text-3xl"></i>
              </div>
              <h3 className="text-2xl font-bold text-[#002147] mb-3">No Active Competitions</h3>
              <p className="text-[#002147]/70 max-w-md text-center mb-6">
                We're preparing some exciting new competitions. Check back soon or follow us on social media for updates!
              </p>
              <Link to="/how-to-play">
                <Button variant="outline" className="border-[#bbd665] border-2 text-[#002147] hover:bg-[#bbd665]/20 hover:text-[#002147]">
                  Learn How Competitions Work
                </Button>
              </Link>
            </div>
          ) : filteredCompetitions.length === 0 && activeCategory ? (
            <div className="flex flex-col justify-center items-center py-20 px-4 border-2 border-dashed border-[#bbd665]/30 bg-[#002147]/5 rounded-xl">
              <div className="w-20 h-20 bg-[#bbd665]/20 rounded-full flex items-center justify-center mb-6">
                <i className="fas fa-filter text-[#002147]/60 text-3xl"></i>
              </div>
              <h3 className="text-2xl font-bold text-[#002147] mb-3">No {activeCategory.charAt(0).toUpperCase() + activeCategory.slice(1)} Competitions</h3>
              <p className="text-[#002147]/70 max-w-md text-center mb-6">
                We don't have any active competitions in this category at the moment. Please check back soon or try another category.
              </p>
              <Button variant="outline" onClick={() => handleCategoryChange(undefined)} 
                className="border-[#bbd665] border-2 text-[#002147] hover:bg-[#bbd665]/20 hover:text-[#002147]">
                <Filter className="mr-2 h-4 w-4" /> Show All Categories
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16 mb-16 px-4">
              {filteredCompetitions.map(competition => (
                <CompetitionCard key={competition.id} competition={competition} />
              ))}
            </div>
          )}
          
          <div className="text-center">
            <Link to="/competitions">
              <Button size="lg" className="bg-[#bbd665] hover:bg-[#a8c252] text-[#002147] group shine-btn px-8 py-6 text-lg font-semibold shadow-lg shadow-black/30">
                <Ticket className="mr-2 h-5 w-5" /> View All Competitions <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
      
      {/* HOW TO PLAY Section */}
      <section className="relative z-20 py-16 bg-[#bbd665] text-[#002147] overflow-hidden">
        {/* Fun background elements */}
        <div className="absolute -top-16 -left-16 w-32 h-32 bg-white/10 rounded-full blur-3xl animate-spin-slow"></div>
        <div className="absolute top-1/4 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-0 left-1/4 w-40 h-40 bg-white/10 rounded-full blur-3xl animate-bounce-slow"></div>
        <div className="absolute top-1/3 left-2/3 w-20 h-20 bg-[#002147]/5 rounded-full blur-lg animate-spin-slow"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-extrabold mb-3 tracking-tight mx-auto text-[#002147]">
              HOW TO <span className="text-[#002147] relative">PLAY
                <span className="absolute -top-1 -right-4 text-[#002147] text-lg">✨</span>
              </span>
            </h2>
            <p className="text-[#002147]/80 max-w-2xl mx-auto mb-6 text-lg">
              Just <span className="text-[#002147] font-medium">three simple steps</span> to start winning amazing prizes!
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="bg-[#002147]/10 backdrop-blur-sm rounded-xl p-8 border-2 border-[#002147]/30 transition-all duration-300 shadow-[0_10px_0_rgba(0,33,71,0.2)] hover:shadow-[0_14px_0_rgba(0,33,71,0.3)] hover:-translate-y-1 group relative overflow-hidden">
              {/* Number badge */}
              <div className="absolute -top-3 -right-3 w-12 h-12 bg-[#002147] rounded-full flex items-center justify-center text-[#bbd665] font-bold text-xl shadow-lg transform rotate-12 transition-transform group-hover:rotate-0">1</div>
              
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-[#002147]/20 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-[#002147]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-[#002147] mb-3">Get Your Tickets</h3>
                <p className="text-[#002147]/80">Browse our amazing competitions and secure your tickets to win. The more tickets, the better your chances!</p>
              </div>
            </div>
            
            <div className="bg-[#002147]/10 backdrop-blur-sm rounded-xl p-8 border-2 border-[#002147]/30 transition-all duration-300 shadow-[0_10px_0_rgba(0,33,71,0.2)] hover:shadow-[0_14px_0_rgba(0,33,71,0.3)] hover:-translate-y-1 group relative overflow-hidden">
              {/* Number badge */}
              <div className="absolute -top-3 -right-3 w-12 h-12 bg-[#002147] rounded-full flex items-center justify-center text-[#bbd665] font-bold text-xl shadow-lg transform rotate-12 transition-transform group-hover:rotate-0">2</div>
              
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-[#002147]/20 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-[#002147]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-[#002147] mb-3">Watch Live Draws</h3>
                <p className="text-[#002147]/80">All winners are selected randomly during our exciting live streamed draws. Get ready for the thrill!</p>
              </div>
            </div>
            
            <div className="bg-[#002147]/10 backdrop-blur-sm rounded-xl p-8 border-2 border-[#002147]/30 transition-all duration-300 shadow-[0_10px_0_rgba(0,33,71,0.2)] hover:shadow-[0_14px_0_rgba(0,33,71,0.3)] hover:-translate-y-1 group relative overflow-hidden">
              {/* Number badge */}
              <div className="absolute -top-3 -right-3 w-12 h-12 bg-[#002147] rounded-full flex items-center justify-center text-[#bbd665] font-bold text-xl shadow-lg transform rotate-12 transition-transform group-hover:rotate-0">3</div>
              
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-[#002147]/20 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform animate-pulse-slow">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-[#002147]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-[#002147] mb-3">Win & Celebrate!</h3>
                <p className="text-[#002147]/80">Get notified when you win and celebrate your new prize! We'll deliver it straight to your door.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}