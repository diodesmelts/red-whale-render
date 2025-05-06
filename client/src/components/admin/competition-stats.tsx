import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Competition } from "@shared/schema";
import { Loader2, Lock, AlertCircle, TicketIcon, ShoppingCart, CheckCircle2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useCart } from "@/hooks/use-cart";

interface TicketStats {
  totalTickets: number;
  purchasedTickets: number;
  inCartTickets: number;
  availableTickets: number;
  soldTicketsCount: number;
  allNumbers: {
    totalRange: number[];
    purchased: number[];
    inCart: number[];
  }
}

interface CompetitionStatsProps {
  competition: Competition;
}

export function CompetitionStats({ competition }: CompetitionStatsProps) {
  const [showNumberGrid, setShowNumberGrid] = useState(false);
  const { cartItems } = useCart();
  const [clientCartNumbers, setClientCartNumbers] = useState<number[]>([]);
  
  // Get active cart numbers from the client
  useEffect(() => {
    // Make sure we have a valid competition ID
    if (!competition || !competition.id) {
      return;
    }

    // Get active numbers for this competition from the current user's cart
    const competitionCartItems = cartItems.filter(item => 
      item.competitionId === competition.id && 
      item.selectedNumbers && 
      Array.isArray(item.selectedNumbers)
    );
    
    const selectedNumbers = competitionCartItems.flatMap(item => 
      item.selectedNumbers || []
    );
    
    setClientCartNumbers(selectedNumbers);
    
    // Get cart data from all users by sending our cart to the server
    const fetchAllCartData = async () => {
      try {
        const res = await apiRequest('POST', `/api/competitions/cart-items/${competition.id}`, {
          cartItems: cartItems
        });
        const data = await res.json();
        if (data && data.inCartNumbers) {
          setClientCartNumbers(prev => {
            // Combine with our existing numbers to ensure we include our own cart
            const combined = [...prev, ...data.inCartNumbers];
            // Remove duplicates
            return [...new Set(combined)];
          });
        }
      } catch (error) {
        console.error("Error fetching active cart numbers:", error);
      }
    };
    
    fetchAllCartData();
  }, [competition, competition.id, cartItems]);
  
  // Debug flag to help with troubleshooting
  const DEBUG = true;
  
  // Fetch ticket statistics with proper production/development handling
  const { data: stats, isLoading, error } = useQuery<TicketStats>({
    queryKey: ['/api/competitions', competition?.id, 'ticket-stats'],
    // Only enable the query if competition ID is valid
    enabled: !!competition && !!competition.id,
    queryFn: async () => {
      // Double-check competition ID exists to prevent API calls with undefined
      if (!competition || !competition.id) {
        if (DEBUG) console.log("🛑 Query aborted: Competition ID is invalid:", competition?.id);
        throw new Error("No valid competition ID available");
      }
      
      if (DEBUG) console.log("🔍 Fetching ticket stats for competition ID:", competition.id);
      try {
        // Unified approach - try the admin endpoint first, then regular endpoint as fallback
        // Using proper fetch with credentials
        const adminEndpoint = `/api/admin/competitions/${competition.id}/ticket-stats`;
        const regularEndpoint = `/api/competitions/ticket-stats/${competition.id}`;
        
        if (DEBUG) console.log(`🔍 Trying admin endpoint: ${adminEndpoint}`);
        
        try {
          const adminRes = await fetch(adminEndpoint, {
            credentials: 'include', // Essential for admin authentication
            headers: { 'Cache-Control': 'no-cache' } // Avoid stale responses
          });
          
          if (adminRes.ok) {
            const data = await adminRes.json();
            if (DEBUG) console.log("✅ Admin ticket stats data received:", data);
            return data;
          }
          
          if (DEBUG) console.warn(`Admin endpoint failed with ${adminRes.status}, trying regular endpoint`);
        } catch (adminErr) {
          if (DEBUG) console.warn("Admin endpoint error:", adminErr);
          // Continue to fallback
        }
        
        // Try regular endpoint as fallback
        if (DEBUG) console.log(`🔍 Trying regular endpoint: ${regularEndpoint}`);
        const regularRes = await fetch(regularEndpoint, {
          credentials: 'include'
        });
        
        if (!regularRes.ok) {
          throw new Error(`API Error: ${regularRes.status} ${regularRes.statusText}`);
        }
        
        const fallbackData = await regularRes.json();
        if (DEBUG) console.log("✅ Regular endpoint stats data received:", fallbackData);
        return fallbackData;
      } catch (err) {
        if (DEBUG) console.error("💥 Error fetching ticket stats:", err);
        throw err;
      }
    },
    staleTime: 30 * 1000, // 30 seconds cache - shorter for admin panel to see updates faster
    retry: 2 // Allow a couple of retries
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Handle error or missing data
  if (error || !stats) {
    // Also handle the case where competition might be undefined or incomplete
    if (!competition || !competition.id) {
      return (
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-bold text-foreground">Competition Data Unavailable</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="flex flex-col items-center justify-center py-6">
                <AlertCircle className="h-10 w-10 text-amber-500 mb-3" />
                <p className="text-muted-foreground text-center font-medium">
                  Competition data could not be loaded
                </p>
                <p className="text-xs text-muted-foreground mt-2 text-center max-w-sm">
                  Please check the competition ID and try again.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }
    
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold text-foreground">{competition.title}</CardTitle>
            <CardDescription className="flex items-center gap-1 text-sm">
              <span>Status: </span>
              <span className="font-medium bg-amber-100 text-amber-700 px-2 rounded-full text-xs">
                {competition.ticketsSold !== null ? `${((competition.ticketsSold / competition.totalTickets) * 100).toFixed(1)}% sold` : '0% sold'}
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="flex flex-col items-center justify-center py-6">
              <AlertCircle className="h-10 w-10 text-amber-500 mb-3" />
              <p className="text-muted-foreground text-center font-medium">
                Stats temporarily unavailable
              </p>
              <p className="text-xs text-muted-foreground mt-2 text-center max-w-sm">
                Statistics for this competition will be available soon.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Update stats with client-side cart data
  const enhancedStats = {
    ...stats,
    allNumbers: {
      ...stats.allNumbers,
      inCart: [...new Set([...stats.allNumbers.inCart, ...clientCartNumbers])]
    }
  };
  
  // Recalculate inCartTickets count based on actual data
  const actualInCartCount = enhancedStats.allNumbers.inCart.length;
  enhancedStats.inCartTickets = actualInCartCount;
  
  // Adjust available tickets accordingly
  enhancedStats.availableTickets = enhancedStats.totalTickets - 
    enhancedStats.purchasedTickets - actualInCartCount;
  
  // Calculate percentages for visualization
  const purchasedPercentage = (enhancedStats.purchasedTickets / enhancedStats.totalTickets) * 100;
  const inCartPercentage = (enhancedStats.inCartTickets / enhancedStats.totalTickets) * 100;
  const availablePercentage = (enhancedStats.availableTickets / enhancedStats.totalTickets) * 100;
  
  // Get percent sold for display (using the actual ticketsSold value from the competition)
  const percentSold = stats.soldTicketsCount ? ((stats.soldTicketsCount / stats.totalTickets) * 100).toFixed(1) + '%' : '0%';

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-bold text-foreground">{competition.title}</CardTitle>
          <CardDescription className="flex items-center gap-1 text-sm">
            <span>Status: </span>
            <span className="font-medium text-primary-foreground bg-primary/90 px-2 rounded-full text-xs">
              {percentSold} sold
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-4">
          {/* Stats Cards - Simplified and cleaner */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-card border rounded-lg p-3 flex flex-col items-center justify-center">
              <div className="flex items-center gap-2 mb-1">
                <TicketIcon className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">Total</span>
              </div>
              <span className="text-xl font-bold text-foreground">{enhancedStats.totalTickets}</span>
            </div>
            
            <div className="bg-card border rounded-lg p-3 flex flex-col items-center justify-center">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span className="text-xs font-medium text-muted-foreground">Purchased</span>
              </div>
              <span className="text-xl font-bold text-green-600">{enhancedStats.purchasedTickets}</span>
            </div>
            
            <div className="bg-card border rounded-lg p-3 flex flex-col items-center justify-center">
              <div className="flex items-center gap-2 mb-1">
                <ShoppingCart className="h-4 w-4 text-blue-600" />
                <span className="text-xs font-medium text-muted-foreground">In Cart</span>
              </div>
              <span className="text-xl font-bold text-blue-600">{enhancedStats.inCartTickets}</span>
            </div>
            
            <div className="bg-card border rounded-lg p-3 flex flex-col items-center justify-center">
              <div className="flex items-center gap-2 mb-1">
                <TicketIcon className="h-4 w-4 text-amber-600" />
                <span className="text-xs font-medium text-muted-foreground">Available</span>
              </div>
              <span className="text-xl font-bold text-amber-600">{enhancedStats.availableTickets}</span>
            </div>
          </div>

          {/* Progress Bars - Cleaner and more compact */}
          <div className="space-y-3 border rounded-lg p-3">
            <h3 className="text-xs font-medium text-muted-foreground mb-3">Ticket Distribution</h3>
            
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-500 rounded-full inline-block"></span>
                  <span>Purchased</span>
                </span>
                <span className="font-medium">{purchasedPercentage.toFixed(1)}%</span>
              </div>
              <div className="h-1.5 bg-muted w-full rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-500 transition-all" 
                  style={{ width: `${purchasedPercentage}%` }}
                />
              </div>
            </div>
            
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-blue-500 rounded-full inline-block"></span>
                  <span>In Cart</span>
                </span>
                <span className="font-medium">{inCartPercentage.toFixed(1)}%</span>
              </div>
              <div className="h-1.5 bg-muted w-full rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 transition-all" 
                  style={{ width: `${inCartPercentage}%` }}
                />
              </div>
            </div>
            
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-amber-500 rounded-full inline-block"></span>
                  <span>Available</span>
                </span>
                <span className="font-medium">{availablePercentage.toFixed(1)}%</span>
              </div>
              <div className="h-1.5 bg-muted w-full rounded-full overflow-hidden">
                <div 
                  className="h-full bg-amber-500 transition-all" 
                  style={{ width: `${availablePercentage}%` }}
                />
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="pt-0">
          <Button 
            variant="outline" 
            onClick={() => setShowNumberGrid(!showNumberGrid)}
            className="w-full text-sm"
            size="sm"
          >
            {showNumberGrid ? "Hide" : "Show"} Ticket Number Grid
          </Button>
        </CardFooter>
      </Card>

      {showNumberGrid && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-bold text-foreground">{competition.title} - Ticket Numbers</CardTitle>
            <CardDescription>
              View the status of individual ticket numbers
            </CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <div className="grid grid-cols-10 gap-2 md:grid-cols-20">
              {enhancedStats.allNumbers.totalRange.map((number) => {
                const isPurchased = enhancedStats.allNumbers.purchased.includes(number);
                const isInCart = enhancedStats.allNumbers.inCart.includes(number) || 
                                clientCartNumbers.includes(number);
                
                return (
                  <TooltipProvider key={number}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div 
                          className={`
                            flex items-center justify-center rounded-md p-2 text-xs font-medium
                            ${isPurchased ? 'bg-green-100 text-green-800' : ''}
                            ${isInCart ? 'bg-blue-100 text-blue-800' : ''}
                            ${!isPurchased && !isInCart ? 'bg-gray-100 text-gray-800' : ''}
                          `}
                        >
                          {number}
                          {isPurchased && <Lock className="h-3 w-3 ml-1" />}
                          {isInCart && <ShoppingCart className="h-3 w-3 ml-1" />}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        {isPurchased ? 'Purchased' : isInCart ? 'In Cart' : 'Available'}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StatCard({ icon, title, value, color }: { icon: React.ReactNode; title: string; value: string; color: string }) {
  return (
    <div className={`flex items-center p-4 rounded-lg ${color}`}>
      <div className="mr-4 text-gray-700">{icon}</div>
      <div>
        <p className="text-sm font-medium text-gray-700">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}