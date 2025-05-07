import { useState, useEffect } from "react";
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

// Interface for stats data structure
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
  };
}

// Interface for cart items response
interface CartItemsResponse {
  competitionId: number;
  inCartNumbers: number[];
}

// Minimal standalone component that doesn't rely on React Query or other dependencies
export function CompetitionStats({ competition }: { competition: Competition }) {
  const [showNumberGrid, setShowNumberGrid] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [stats, setStats] = useState<TicketStats | null>(null);
  const [inCartNumbers, setInCartNumbers] = useState<number[]>([]);
  
  // Use effect to fetch data when component mounts or competition changes
  useEffect(() => {
    let isMounted = true;
    
    const fetchData = async () => {
      if (!competition?.id) {
        console.error('No competition ID provided for stats');
        if (isMounted) {
          setHasError(true);
          setIsLoading(false);
        }
        return;
      }

      try {
        console.log(`🎟️ Fetching ticket stats for competition ${competition.id}`);
        
        // Check if we're in production (Render) environment
        const isProduction = window.location.hostname.includes('render.com') || 
                           window.location.hostname.includes('onrender.com') ||
                           window.location.hostname.includes('bluewhalecompetitions.co.uk') ||
                           window.location.hostname.includes('mobycomps.co.uk');
        
        // Add extra debugging for auth issues
        const isAuthenticated = document.cookie.includes('bw.sid');
                           
        // Determine the correct API base URL - no need for a different base in production
        // We just need to use the same paths consistently
        const apiBase = '';
        
        console.log(`🔑 Auth status: Cookie exists? ${isAuthenticated ? 'Yes' : 'No'}, Is production? ${isProduction ? 'Yes' : 'No'}`);
        console.log(`🔍 Debug cookies: ${document.cookie.split(';').map(c => c.trim()).join(' | ')}`);
        console.log(`🌐 Current location: ${window.location.href}`);
        
        // Add debug logging
        console.log(`Environment: ${isProduction ? 'Production' : 'Development'}`);
        console.log(`Hostname: ${window.location.hostname}`);
        
        // First get the ticket stats with production-aware path
        const statsUrl = `${apiBase}/api/admin/competitions/${competition.id}/ticket-stats`;
        console.log(`Making stats API request to: ${statsUrl}`);
        
        const statsResponse = await fetch(statsUrl, {
          credentials: 'include',
          headers: { 'Cache-Control': 'no-cache' }
        });
        
        console.log(`Stats response status: ${statsResponse.status}`);
        
        if (!statsResponse.ok) {
          console.error(`Failed to fetch stats: ${statsResponse.status} ${statsResponse.statusText}`);
          throw new Error(`Stats API Error: ${statsResponse.status}`);
        }
        
        const statsData = await statsResponse.json();
        console.log('Stats data received:', statsData);
        
        if (isMounted) {
          setStats(statsData);
        }
        
        // Then get in-cart numbers
        try {
          // Use the same environment detection logic for cart items API
          const cartUrl = `${apiBase}/api/admin/competitions/${competition.id}/cart-items`;
          console.log(`Making cart API request to: ${cartUrl}`);
          
          const cartResponse = await fetch(cartUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({})
          });
          
          if (cartResponse.ok) {
            const cartData: CartItemsResponse = await cartResponse.json();
            console.log('Cart data received:', cartData);
            
            if (isMounted && cartData && Array.isArray(cartData.inCartNumbers)) {
              setInCartNumbers(cartData.inCartNumbers);
            }
          }
        } catch (cartError) {
          console.error("Non-fatal cart data error:", cartError);
          // We don't fail the whole component for cart errors
        }
        
        if (isMounted) {
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Error loading competition stats:", error);
        if (isMounted) {
          setHasError(true);
          setIsLoading(false);
        }
      }
    };
    
    fetchData();
    
    // Cleanup function to prevent setting state on unmounted component
    return () => {
      isMounted = false;
    };
  }, [competition?.id]); // Only re-run if competition ID changes

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
              This could be due to authentication issues or missing API endpoints in the deployment. 
              See browser console for details.
            </p>
          </div>
          
          {/* Show debug info for admins to help troubleshoot */}
          <div className="mt-6 p-4 border border-amber-200 rounded-md bg-amber-50 text-amber-800 text-xs">
            <p className="font-medium mb-2">Debug Information:</p>
            <ul className="space-y-1">
              <li>- Competition ID: {competition?.id || 'Not available'}</li>
              <li>- Host: {window.location.hostname}</li>
              <li>- Path: {window.location.pathname}</li>
              <li>- Auth Cookie Present: {document.cookie.includes('bw.sid') ? 'Yes' : 'No'}</li>
              <li>- Error Status: {hasError ? 'Error fetching data' : 'No data returned'}</li>
            </ul>
            <p className="mt-3 text-xs">
              If this issue persists, check that the ticket-stats and cart-items API endpoints 
              are properly implemented in both server.ts and server-docker.cjs files.
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
  const generateRange = (start: number, end: number): number[] => {
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
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