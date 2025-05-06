import { useState } from "react";
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
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Minimal standalone component that doesn't rely on React Query or other dependencies
export function CompetitionStats({ competition }: { competition: Competition }) {
  const [showNumberGrid, setShowNumberGrid] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [inCartNumbers, setInCartNumbers] = useState<number[]>([]);

  // Use plain React effects for fetching data - more reliable across environments
  useState(() => {
    async function fetchData() {
      if (!competition?.id) {
        setHasError(true);
        setIsLoading(false);
        return;
      }

      try {
        // First get the ticket stats
        const statsResponse = await fetch(`/api/admin/competitions/${competition.id}/ticket-stats`, {
          credentials: 'include',
          headers: { 'Cache-Control': 'no-cache' }
        });
        
        if (!statsResponse.ok) {
          throw new Error(`Stats API Error: ${statsResponse.status}`);
        }
        
        const statsData = await statsResponse.json();
        setStats(statsData);
        
        // Then get in-cart numbers
        try {
          const cartResponse = await fetch(`/api/admin/competitions/${competition.id}/cart-items`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({})
          });
          
          if (cartResponse.ok) {
            const cartData = await cartResponse.json();
            if (cartData && Array.isArray(cartData.inCartNumbers)) {
              setInCartNumbers(cartData.inCartNumbers);
            }
          }
        } catch (cartError) {
          console.error("Non-fatal cart data error:", cartError);
          // We don't fail the whole component for cart errors
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error("Error loading competition stats:", error);
        setHasError(true);
        setIsLoading(false);
      }
    }
    
    fetchData();
  });

  // Loading state
  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-48">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  // Error handling - competition missing or data fetch error
  if (hasError || !stats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-bold text-foreground">
            {competition ? competition.title : 'Competition Data Unavailable'}
          </CardTitle>
          {competition && (
            <CardDescription className="flex items-center gap-1 text-sm">
              <span>Status: </span>
              <span className="font-medium bg-amber-100 text-amber-700 px-2 rounded-full text-xs">
                {competition.isLive ? 'Live' : 'Inactive'}
              </span>
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="pt-4">
          <div className="flex flex-col items-center justify-center py-6">
            <AlertCircle className="h-10 w-10 text-amber-500 mb-3" />
            <p className="text-muted-foreground text-center font-medium">
              Stats data unavailable
            </p>
            <p className="text-xs text-muted-foreground mt-2 text-center max-w-sm">
              The competition statistics cannot be displayed at this time.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Fallback values for missing data
  const totalTickets = competition.totalTickets || 0;
  const purchasedTickets = stats.purchasedTickets || 0;
  const inCartTicketsCount = inCartNumbers.length || 0;
  const availableTickets = totalTickets - purchasedTickets - inCartTicketsCount;
  
  // Calculate percentages for visualization (with safety checks)
  const safeCalculatePercentage = (value: number) => {
    if (!totalTickets || totalTickets <= 0) return 0;
    return (value / totalTickets) * 100;
  };
  
  const purchasedPercentage = safeCalculatePercentage(purchasedTickets);
  const inCartPercentage = safeCalculatePercentage(inCartTicketsCount);
  const availablePercentage = safeCalculatePercentage(availableTickets);
  
  // Sale status percentage with fallback
  const percentSold = totalTickets ? ((purchasedTickets / totalTickets) * 100).toFixed(1) + '%' : '0%';
  
  // Basic range generation for the number grid
  const generateRange = (start: number, end: number) => {
    const result = [];
    for (let i = start; i <= end; i++) {
      result.push(i);
    }
    return result;
  };
  
  // Ensure we have all number arrays with fallbacks
  const allNumbers = {
    totalRange: stats.allNumbers?.totalRange || generateRange(1, totalTickets),
    purchased: stats.allNumbers?.purchased || [],
    inCart: inCartNumbers
  };
  
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
          {/* Stats Cards Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-card border rounded-lg p-3 flex flex-col items-center justify-center">
              <div className="flex items-center gap-2 mb-1">
                <TicketIcon className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">Total</span>
              </div>
              <span className="text-xl font-bold text-foreground">{totalTickets}</span>
            </div>
            
            <div className="bg-card border rounded-lg p-3 flex flex-col items-center justify-center">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span className="text-xs font-medium text-muted-foreground">Purchased</span>
              </div>
              <span className="text-xl font-bold text-green-600">{purchasedTickets}</span>
            </div>
            
            <div className="bg-card border rounded-lg p-3 flex flex-col items-center justify-center">
              <div className="flex items-center gap-2 mb-1">
                <ShoppingCart className="h-4 w-4 text-blue-600" />
                <span className="text-xs font-medium text-muted-foreground">In Cart</span>
              </div>
              <span className="text-xl font-bold text-blue-600">{inCartTicketsCount}</span>
            </div>
            
            <div className="bg-card border rounded-lg p-3 flex flex-col items-center justify-center">
              <div className="flex items-center gap-2 mb-1">
                <TicketIcon className="h-4 w-4 text-amber-600" />
                <span className="text-xs font-medium text-muted-foreground">Available</span>
              </div>
              <span className="text-xl font-bold text-amber-600">{availableTickets}</span>
            </div>
          </div>

          {/* Progress Bars */}
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
              {allNumbers.totalRange.slice(0, 500).map((number: number) => {
                const isPurchased = allNumbers.purchased.includes(number);
                const isInCart = allNumbers.inCart.includes(number);
                
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
              {allNumbers.totalRange.length > 500 && (
                <div className="col-span-full text-center text-sm text-muted-foreground py-2">
                  Showing first 500 tickets of {allNumbers.totalRange.length} total
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}