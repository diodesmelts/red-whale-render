import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { CompetitionCard } from "@/components/competition/competition-card";
import { Competition } from "@shared/schema";
import { Search, ClipboardList, ChevronRight } from "lucide-react";
import { Loader2 } from "lucide-react";

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
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-b from-background to-background/70 overflow-hidden">
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
        
        {/* Decorative elements */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-yellow-500/20 rounded-full blur-2xl"></div>
        <div className="absolute bottom-10 right-10 w-32 h-32 bg-pink-500/20 rounded-full blur-3xl"></div>
        <div className="absolute top-40 right-20 w-16 h-16 bg-green-500/20 rounded-full blur-xl"></div>
      </section>
      
      {/* How to Play Section */}
      <section className="py-16 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <span className="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-primary/20 text-primary mb-2">
              GETTING STARTED
            </span>
            <h2 className="text-3xl font-bold mb-2">How To<span className="text-primary">Play</span></h2>
            <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
              Follow these simple steps to participate and win exciting competitions
            </p>
            <Link href="/how-to-play">
              <Button className="mb-12 inline-flex items-center">
                Detailed Guide <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Step 1 */}
            <div className="bg-card rounded-lg p-6 border border-border hover:border-primary transition-all duration-300 hover:shadow-[0_0_15px_rgba(0,153,255,0.5)] group">
              <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mb-4 group-hover:animate-pulse">
                <Search className="text-primary h-5 w-5" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">1. Browse Competitions</h3>
              <p className="text-muted-foreground">
                Explore our wide range of exciting competitions across different categories and platforms.
              </p>
              <div className="mt-4 w-full h-1 bg-primary/30 rounded-full overflow-hidden">
                <div className="h-full w-full bg-primary"></div>
              </div>
            </div>
            
            {/* Step 2 */}
            <div className="bg-card rounded-lg p-6 border border-border hover:border-purple-500 transition-all duration-300 hover:shadow-[0_0_15px_rgba(155,89,182,0.5)] group">
              <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center mb-4 group-hover:animate-pulse">
                <i className="fas fa-ticket-alt text-purple-500 text-xl"></i>
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">2. Enter & Follow Steps</h3>
              <p className="text-muted-foreground">
                Select a competition and follow the simple entry steps to secure your tickets.
              </p>
              <div className="mt-4 w-full h-1 bg-purple-500/30 rounded-full overflow-hidden">
                <div className="h-full w-2/3 bg-purple-500"></div>
              </div>
            </div>
            
            {/* Step 3 */}
            <div className="bg-card rounded-lg p-6 border border-border hover:border-primary transition-all duration-300 hover:shadow-[0_0_15px_rgba(0,153,255,0.5)] group">
              <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mb-4 group-hover:animate-pulse">
                <i className="fas fa-chart-line text-primary text-xl"></i>
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">3. Track Entries</h3>
              <p className="text-muted-foreground">
                Monitor your active entries and check competition closing dates on your dashboard.
              </p>
              <div className="mt-4 w-full h-1 bg-primary/30 rounded-full overflow-hidden">
                <div className="h-full w-1/2 bg-primary"></div>
              </div>
            </div>
            
            {/* Step 4 */}
            <div className="bg-card rounded-lg p-6 border border-border hover:border-orange-500 transition-all duration-300 hover:shadow-[0_0_15px_rgba(255,127,80,0.5)] group">
              <div className="w-12 h-12 bg-orange-500/20 rounded-full flex items-center justify-center mb-4 group-hover:animate-pulse">
                <i className="fas fa-trophy text-orange-500 text-xl"></i>
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">4. Win & Celebrate</h3>
              <p className="text-muted-foreground">
                Get notified when you win and follow the simple claim process to receive your prize!
              </p>
              <div className="mt-4 w-full h-1 bg-orange-500/30 rounded-full overflow-hidden">
                <div className="h-full w-1/4 bg-orange-500"></div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Featured Competitions Section */}
      <section className="py-16 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-primary/20 text-primary mb-2">
              CURRENT OPPORTUNITIES
            </span>
            <h2 className="text-3xl font-bold">
              <span className="text-primary">Live</span>Competitions
            </h2>
            <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
              Don't miss your chance to win these amazing prizes! New competitions added regularly.
            </p>
            <div className="w-24 h-1 bg-primary mx-auto mt-4 rounded-full"></div>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
              {featuredCompetitions?.map(competition => (
                <CompetitionCard key={competition.id} competition={competition} />
              ))}
            </div>
          )}
          
          <div className="text-center">
            <Link href="/competitions">
              <Button size="lg" className="group relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full bg-white/20 transform -translate-x-full group-hover:translate-x-full transition-transform duration-500"></div>
                <i className="fas fa-trophy mr-2"></i> View All Competitions <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
}
