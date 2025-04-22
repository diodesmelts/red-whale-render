import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { CompetitionCard } from "@/components/competition/competition-card";
import { CompetitionFilter, FilterOptions } from "@/components/competition/competition-filter";
import { Competition } from "@shared/schema";
import { Loader2 } from "lucide-react";
import { useLocation } from "wouter";

export default function CompetitionsPage() {
  const [location] = useLocation();
  const [filters, setFilters] = useState<FilterOptions>({});
  
  // Parse URL parameters
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const category = searchParams.get('category');
    const sortBy = searchParams.get('sortBy') as 'newest' | 'endingSoon' | 'popular' | undefined;
    
    setFilters({
      category: category || undefined,
      sortBy
    });
  }, [location]);

  // Fetch competitions based on filters
  const { data: competitions, isLoading } = useQuery<Competition[]>({
    queryKey: ["/api/competitions", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.category) params.append('category', filters.category);
      if (filters.sortBy) params.append('sortBy', filters.sortBy);
      params.append('live', 'true');
      
      const res = await fetch(`/api/competitions?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch competitions");
      return res.json();
    }
  });

  const handleFilterChange = (newFilters: FilterOptions) => {
    setFilters(newFilters);
  };

  return (
    <div>
      <section className="py-16 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-primary/20 text-primary mb-2">
              BROWSE & DISCOVER
            </span>
            <h1 className="text-3xl md:text-4xl font-bold">
              <span className="text-primary">All</span> Competitions
            </h1>
            <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
              Explore our full range of competitions and find your perfect prize.
            </p>
          </div>
          
          {/* Filters */}
          <CompetitionFilter 
            onFilterChange={handleFilterChange} 
            className="mb-12"
          />
          
          {/* Results */}
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
          ) : competitions && competitions.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {competitions.map(competition => (
                <CompetitionCard key={competition.id} competition={competition} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <p className="text-xl text-muted-foreground">No competitions found matching your filters.</p>
              <p className="mt-2 text-muted-foreground">Try adjusting your filters or check back soon for new competitions.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
