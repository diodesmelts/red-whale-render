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
      <section className="relative z-20 py-16 bg-white text-black overflow-hidden">
        {/* Fun background elements */}
        <div className="absolute -top-16 -left-16 w-32 h-32 bg-[#bbd665]/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/4 right-0 w-48 h-48 bg-[#bbd665]/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-1/4 w-40 h-40 bg-[#bbd665]/10 rounded-full blur-3xl"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-extrabold mb-3 tracking-tight mx-auto text-black">
              HOW TO <span className="text-[#bbd665] relative">PLAY
                <span className="absolute -top-1 -right-4 text-[#bbd665] text-lg">✨</span>
              </span>
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto mb-6 text-lg">
              Just <span className="text-[#bbd665] font-medium">three simple steps</span> to start winning amazing prizes!
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="bg-[#bbd665]/10 rounded-xl p-8 border border-[#bbd665]/20 transition-all duration-300 shadow-[0_0_20px_rgba(187,214,101,0.2)] hover:shadow-[0_0_30px_rgba(187,214,101,0.4)] group relative overflow-hidden">
              {/* Number badge */}
              <div className="absolute -top-3 -right-3 w-12 h-12 bg-[#bbd665] rounded-full flex items-center justify-center text-black font-bold text-xl shadow-lg transform rotate-12 transition-transform group-hover:rotate-0">1</div>
              
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-[#bbd665]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-black mb-3">Get Your Tickets</h3>
                <p className="text-gray-700">Browse our amazing competitions and secure your tickets to win. The more tickets, the better your chances!</p>
              </div>
            </div>
            
            <div className="bg-black/5 rounded-xl p-8 border border-black/10 transition-all duration-300 shadow-[0_0_20px_rgba(0,0,0,0.1)] hover:shadow-[0_0_30px_rgba(0,0,0,0.2)] group relative overflow-hidden">
              {/* Number badge */}
              <div className="absolute -top-3 -right-3 w-12 h-12 bg-black rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg transform rotate-12 transition-transform group-hover:rotate-0">2</div>
              
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-black mb-3">Watch Live Draws</h3>
                <p className="text-gray-700">All winners are selected randomly during our exciting live streamed draws. Get ready for the thrill!</p>
              </div>
            </div>
            
            <div className="bg-[#bbd665]/10 rounded-xl p-8 border border-[#bbd665]/20 transition-all duration-300 shadow-[0_0_20px_rgba(187,214,101,0.2)] hover:shadow-[0_0_30px_rgba(187,214,101,0.4)] group relative overflow-hidden">
              {/* Number badge */}
              <div className="absolute -top-3 -right-3 w-12 h-12 bg-[#bbd665] rounded-full flex items-center justify-center text-black font-bold text-xl shadow-lg transform rotate-12 transition-transform group-hover:rotate-0">3</div>
              
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-[#bbd665]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-black mb-3">Win & Celebrate!</h3>
                <p className="text-gray-700">Get notified when you win and celebrate your new prize! We'll deliver it straight to your door.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Featured Competitions Section */}
      <section className="py-24 bg-white relative overflow-hidden">
        {/* Fun background elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#bbd665]/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-0 w-80 h-80 bg-black/5 rounded-full blur-3xl"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extrabold mb-4 tracking-tight mx-auto text-black">
              <span className="text-[#bbd665] relative">Live</span> Competitions
            </h2>
            <p className="text-gray-600 mt-4 max-w-2xl mx-auto text-lg font-light">
              Don't miss your chance to win these <span className="text-[#bbd665] font-medium">amazing prizes</span>! New competitions added regularly.
            </p>
            
            {/* Decorative line with highlight */}
            <div className="relative w-32 h-1.5 bg-[#bbd665]/30 mx-auto mt-8 rounded-full overflow-hidden">
              <div className="absolute inset-0 w-full h-full bg-[#bbd665] animate-shine" 
                style={{ backgroundImage: 'linear-gradient(to right, transparent, rgba(255,255,255,0.5) 50%, transparent 100%)' }}>
              </div>
            </div>
          </div>
          
          {isLoading ? (
            <div className="flex flex-col justify-center items-center py-32">
              <Loader2 className="h-12 w-12 animate-spin text-[#bbd665] mb-4" />
              <p className="text-gray-500 animate-pulse">Loading amazing competitions...</p>
            </div>
          ) : featuredCompetitions?.length === 0 ? (
            <div className="flex flex-col justify-center items-center py-20 px-4 border-2 border-dashed border-gray-300 rounded-xl">
              <div className="w-20 h-20 bg-[#bbd665]/10 rounded-full flex items-center justify-center mb-6 animate-pulse-slow">
                <i className="fas fa-trophy text-[#bbd665] text-3xl"></i>
              </div>
              <h3 className="text-2xl font-bold text-black mb-3">No Active Competitions</h3>
              <p className="text-gray-600 max-w-md text-center mb-6">
                We're preparing some exciting new competitions. Check back soon or follow us on social media for updates!
              </p>
              <Link to="/how-to-play">
                <Button variant="outline" className="border-[#bbd665] border-2 text-black hover:bg-[#bbd665]/10">
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
              <Button size="lg" className="bg-[#bbd665] hover:bg-[#a8c252] text-black group shine-btn px-8 py-6 text-lg font-semibold shadow-lg shadow-[#bbd665]/20">
                <Ticket className="mr-2 h-5 w-5" /> View All Competitions <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}