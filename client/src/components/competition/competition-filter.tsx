import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Filter, SlidersHorizontal, TrendingUp, Calendar, Flame } from "lucide-react";
import { cn } from "@/lib/utils";

interface CompetitionFilterProps {
  onFilterChange?: (filters: FilterOptions) => void;
  className?: string;
}

export interface FilterOptions {
  category?: string;
  sortBy?: 'newest' | 'endingSoon' | 'popular';
}

export function CompetitionFilter({ onFilterChange, className }: CompetitionFilterProps) {
  const [location, setLocation] = useLocation();
  const [activeCategory, setActiveCategory] = useState<string | undefined>(undefined);
  const [activeSort, setActiveSort] = useState<string | undefined>(undefined);
  
  // Parse current URL parameters
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const category = searchParams.get('category');
    const sortBy = searchParams.get('sortBy');
    
    setActiveCategory(category || undefined);
    setActiveSort(sortBy || undefined);
  }, [location]);
  
  // Handle category filter changes
  const handleCategoryChange = (category?: string) => {
    const newCategory = activeCategory === category ? undefined : category;
    setActiveCategory(newCategory);
    
    const searchParams = new URLSearchParams(window.location.search);
    if (newCategory) {
      searchParams.set('category', newCategory);
    } else {
      searchParams.delete('category');
    }
    
    updateLocation(searchParams);
    
    if (onFilterChange) {
      onFilterChange({
        category: newCategory,
        sortBy: activeSort as 'newest' | 'endingSoon' | 'popular' | undefined
      });
    }
  };
  
  // Handle sort filter changes
  const handleSortChange = (sortBy?: string) => {
    const newSort = activeSort === sortBy ? undefined : sortBy;
    setActiveSort(newSort);
    
    const searchParams = new URLSearchParams(window.location.search);
    if (newSort) {
      searchParams.set('sortBy', newSort);
    } else {
      searchParams.delete('sortBy');
    }
    
    updateLocation(searchParams);
    
    if (onFilterChange) {
      onFilterChange({
        category: activeCategory,
        sortBy: newSort as 'newest' | 'endingSoon' | 'popular' | undefined
      });
    }
  };
  
  // Reset all filters
  const resetFilters = () => {
    setActiveCategory(undefined);
    setActiveSort(undefined);
    
    const path = window.location.pathname;
    setLocation(path);
    
    if (onFilterChange) {
      onFilterChange({});
    }
  };
  
  // Update the URL with new search parameters
  const updateLocation = (searchParams: URLSearchParams) => {
    const path = window.location.pathname;
    const query = searchParams.toString();
    setLocation(`${path}${query ? `?${query}` : ''}`);
  };
  
  return (
    <div className={cn("space-y-4", className)}>
      {/* Category filters */}
      <div className="flex flex-wrap justify-center gap-2">
        <Button 
          variant={!activeCategory ? "default" : "outline"} 
          onClick={() => handleCategoryChange(undefined)}
          className="flex items-center"
        >
          <Filter className="h-4 w-4 mr-1" /> All Prizes
        </Button>
        <Button 
          variant={activeCategory === "cash" ? "default" : "outline"} 
          onClick={() => handleCategoryChange("cash")}
          className={cn(
            "flex items-center",
            activeCategory === "cash" && "bg-green-500 hover:bg-green-600"
          )}
        >
          <i className="fas fa-pound-sign mr-1"></i> Cash Prizes
        </Button>
        <Button 
          variant={activeCategory === "family" ? "default" : "outline"} 
          onClick={() => handleCategoryChange("family")}
          className={cn(
            "flex items-center",
            activeCategory === "family" && "bg-yellow-500 hover:bg-yellow-600"
          )}
        >
          <i className="fas fa-users mr-1"></i> Family
        </Button>
        <Button 
          variant={activeCategory === "household" ? "default" : "outline"} 
          onClick={() => handleCategoryChange("household")}
          className={cn(
            "flex items-center",
            activeCategory === "household" && "bg-pink-500 hover:bg-pink-600"
          )}
        >
          <i className="fas fa-blender mr-1"></i> Household
        </Button>
      </div>
      
      {/* Sort filters */}
      <div className="flex flex-wrap justify-center gap-2">
        <Button 
          variant={activeSort === "popular" ? "default" : "outline"} 
          onClick={() => handleSortChange("popular")}
          className={cn(
            "flex items-center",
            activeSort === "popular" && "bg-purple-600 hover:bg-purple-700"
          )}
        >
          <Flame className="h-4 w-4 mr-1" /> Most Popular
        </Button>
        <Button 
          variant={activeSort === "newest" ? "default" : "outline"} 
          onClick={() => handleSortChange("newest")}
          className="flex items-center"
        >
          <Calendar className="h-4 w-4 mr-1" /> Newest First
        </Button>
        <Button 
          variant={activeSort === "endingSoon" ? "default" : "outline"} 
          onClick={() => handleSortChange("endingSoon")}
          className={cn(
            "flex items-center",
            activeSort === "endingSoon" && "bg-primary hover:bg-primary/90"
          )}
        >
          <TrendingUp className="h-4 w-4 mr-1" /> Ending Soon
        </Button>
        <Button 
          variant="outline" 
          onClick={resetFilters}
          className="flex items-center"
        >
          <SlidersHorizontal className="h-4 w-4 mr-1" /> Reset Filters
        </Button>
      </div>
    </div>
  );
}
