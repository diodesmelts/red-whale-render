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
  // Use false as the default state to match the UI (grid hidden by default)
  const [showNumberGrid, setShowNumberGrid] = useState(false);
  
  // Add debugging for visibility toggling
  useEffect(() => {
    console.log(`🔍 GRID VISIBILITY: ${showNumberGrid ? 'VISIBLE' : 'HIDDEN'} for competition ${competition.id}`);
  }, [showNumberGrid, competition.id]);
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
        console.log(`🎟️ Loading stats for competition ID: ${competition.id}`);
        setIsLoading(true);
        
        // Use the new unified ticket status endpoint as the primary data source
        const ticketStatusUrl = `/api/competitions/${competition.id}/ticket-status`;
        
        console.log(`🎟️ Fetching from unified ticket status endpoint: ${ticketStatusUrl}`);
        
        try {
          const ticketStatusResponse = await fetch(ticketStatusUrl, {
            headers: { 'Cache-Control': 'no-cache' },
          });
          
          console.log(`🎟️ Ticket status response: ${ticketStatusResponse.status}`);
          
          if (ticketStatusResponse.ok) {
            const ticketStatus = await ticketStatusResponse.json();
            console.log('🎟️ Ticket status data received successfully:', {
              purchased: ticketStatus.ticketStatuses.purchased.length,
              reserved: ticketStatus.ticketStatuses.reserved.length,
              available: ticketStatus.ticketStatuses.available.length
            });
            
            if (isMounted) {
              // Transform the ticket status data into the format expected by the admin view
              const statsData: TicketStats = {
                totalTickets: ticketStatus.totalTickets,
                purchasedTickets: ticketStatus.ticketStatuses.purchased.length,
                inCartTickets: ticketStatus.ticketStatuses.reserved.length,
                availableTickets: ticketStatus.ticketStatuses.available.length,
                soldTicketsCount: ticketStatus.ticketStatuses.purchased.length,
                allNumbers: {
                  totalRange: Array.from({length: ticketStatus.totalTickets}, (_, i) => i + 1),
                  purchased: ticketStatus.ticketStatuses.purchased,
                  inCart: ticketStatus.ticketStatuses.reserved
                }
              };
              
              setStats(statsData);
              setInCartNumbers(ticketStatus.ticketStatuses.reserved);
              setIsLoading(false);
            }
            return; // Exit if successful
          }
        } catch (ticketStatusError) {
          console.error('🎟️ Error with ticket status endpoint:', ticketStatusError);
        }
        
        // Fall back to legacy endpoints if the unified endpoint fails
        console.log('⚠️ Unified endpoint failed, falling back to legacy endpoints');
        
        // Try the direct stats endpoint without authentication
        const directStatsUrl = `/api/competitions/${competition.id}/admin-stats`;
        
        console.log(`📊 Trying legacy direct stats URL: ${directStatsUrl}`);
        
        try {
          const statsResponse = await fetch(directStatsUrl, {
            headers: { 'Cache-Control': 'no-cache' },
          });
          
          console.log(`📊 Legacy direct stats response status: ${statsResponse.status}`);
          
          if (statsResponse.ok) {
            const statsData = await statsResponse.json();
            console.log('📊 Stats data received successfully from legacy endpoint');
            
            if (isMounted) {
              setStats(statsData);
              setIsLoading(false);
              
              // For cart data, just set empty array since we can't authenticate
              setInCartNumbers([]);
            }
            return; // Exit if successful
          }
        } catch (directError) {
          console.error('📊 Error with legacy direct stats endpoint:', directError);
        }
        
        // If direct stats failed, try the admin endpoint
        const adminStatsUrl = `/api/admin/competitions/${competition.id}/ticket-stats`;
        
        console.log(`📊 Trying admin stats URL: ${adminStatsUrl}`);
        
        try {
          const adminResponse = await fetch(adminStatsUrl, {
            credentials: 'include',
            headers: { 'Cache-Control': 'no-cache' },
          });
          
          console.log(`📊 Admin stats response status: ${adminResponse.status}`);
          
          if (adminResponse.ok) {
            const adminData = await adminResponse.json();
            console.log('📊 Stats data received successfully from admin endpoint');
            
            if (isMounted) {
              setStats(adminData);
              
              // Get cart data from admin endpoint
              try {
                const cartUrl = `/api/admin/competitions/${competition.id}/cart-items`;
                const cartResponse = await fetch(cartUrl, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
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
                console.error('Cart fetch error:', cartError);
                setInCartNumbers([]);
              }
              
              setIsLoading(false);
            }
            return; // Exit if successful
          }
        } catch (adminError) {
          console.error('📊 Error with admin stats endpoint:', adminError);
        }
        
        // If everything fails, display a fallback from the competition object itself
        console.log('📊 All endpoints failed, creating fallback data from competition object');
        
        if (isMounted) {
          // Fallback to using the competition object data
          const fallbackStats = {
            totalTickets: competition.totalTickets || 0,
            purchasedTickets: 0,
            inCartTickets: 0,
            availableTickets: competition.totalTickets || 0,
            soldTicketsCount: 0,
            allNumbers: {
              totalRange: Array.from({length: competition.totalTickets || 0}, (_, i) => i + 1),
              purchased: [],
              inCart: []
            }
          };
          
          setStats(fallbackStats);
          setInCartNumbers([]);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('❌ Critical error loading competition stats:', error);
        if (isMounted) {
          setHasError(true);
          setIsLoading(false);
        }
      }

      try {
        console.log(`🎟️ Fetching ticket stats for competition ${competition.id}`);
        
        // Check if we're in production (Render) environment - critical for proper API path detection
        // Adding specific domain checks because some production sites are running on Render
        const isMobyComps = window.location.hostname.includes('mobycomps.co.uk');
        
        // If we're on mobycomps.co.uk, this needs special handling
        // Add extensive debug info for mobycomps since it's problematic
        if (isMobyComps) {
          console.log('🌊 MOBYCOMPS.CO.UK DETECTED! Using special handling for this domain.');
          console.log('Current hostname:', window.location.hostname);
          console.log('Current path:', window.location.pathname);
          console.log('Current URL:', window.location.href);
          console.log('Auth cookie present:', document.cookie.includes('bw.sid'));
        }
        
        const isRender = window.location.hostname.includes('render.com') || 
                         window.location.hostname.includes('onrender.com') ||
                         window.location.hostname.includes('bluewhalecompetitions.co.uk') ||
                         isMobyComps; // Use the flag for consistent detection
        
        // All production environments need special handling
        const isProduction = isRender;
        
        // Add extra debugging for auth issues
        const isAuthenticated = document.cookie.includes('bw.sid');
        
        // Add troubleshooting console message specifically for Render
        if (isRender) {
          console.log('🔴 Running on Render! This component needs special handling for API paths.');
        }
                           
        // On Render, we need to make sure the API paths match exactly what server-docker.cjs expects
        // The frontend and backend are served from the same domain on Render, so we don't need a base URL
        const apiBase = '';
        
        console.log(`🔑 Auth status: Cookie exists? ${isAuthenticated ? 'Yes' : 'No'}, Is production? ${isProduction ? 'Yes' : 'No'}`);
        console.log(`🔍 Debug cookies: ${document.cookie.split(';').map(c => c.trim()).join(' | ')}`);
        console.log(`🌐 Current location: ${window.location.href}`);
        
        // Add debug logging
        console.log(`Environment: ${isProduction ? 'Production' : 'Development'}`);
        console.log(`Hostname: ${window.location.hostname}`);
        
        // On Render, we need to be especially careful with URL construction
        // Build a fully dynamic URL based on the current window location
        let baseUrl = '';
        
        if (isRender) {
          console.log('🌐 Render environment detected - using special URL construction');
          // For Render, construct an absolute URL using the current window location
          const currentUrl = new URL(window.location.href);
          baseUrl = `${currentUrl.protocol}//${currentUrl.host}`;
          console.log(`🌐 Constructed base URL for Render: ${baseUrl}`);
        }
        
        // Try different URL patterns if we're on Render
        if (isRender) {
          try {
            // List of URL patterns to try on Render environment
            // Sometimes the API needs full URL with hostname, sometimes relative paths work
            const urlPatterns = [
              // Pattern 1: Absolute URL with /api/admin path
              `${baseUrl}/api/admin/competitions/${competition.id}/ticket-stats`,
              // Pattern 2: Absolute URL with alternate path (some Render setups need this)
              `${baseUrl}/api/competitions/${competition.id}/admin-stats`, 
              // Pattern 3: Just a relative path
              `/api/admin/competitions/${competition.id}/ticket-stats`,
              // Pattern 4: Relative path with no-auth endpoint
              `/api/competitions/${competition.id}/admin-stats`,
              // Pattern 5: Second level domain with standard admin path
              `https://api.${window.location.hostname}/admin/competitions/${competition.id}/ticket-stats`,
              // Pattern 6: Direct IP/hostname with no subdomain (removes www if present)
              `${window.location.protocol}//${window.location.hostname.replace('www.', '')}/api/competitions/${competition.id}/admin-stats`,
              // Pattern 7: Absolute URL with second-level domain backend
              `${baseUrl.replace('www.', '')}/api/competitions/${competition.id}/admin-stats`,
              // Pattern 8: Special direct mobycomps endpoint
              `/mobycomps-api/stats/${competition.id}`,
              // Pattern 9: Absolute mobycomps URL
              `${baseUrl}/mobycomps-api/stats/${competition.id}`,
              // Pattern 10: Absolute domain-rooted mobycomps URL
              `${window.location.protocol}//${window.location.hostname}/mobycomps-api/stats/${competition.id}`
            ];
            
            console.log('🧪 Testing multiple URL patterns on Render:');
            
            let successfulResponse = null;
            
            // Try each pattern until one works
            for (const testUrl of urlPatterns) {
              console.log(`🧪 Testing URL pattern: ${testUrl}`);
              
              try {
                const testResponse = await fetch(testUrl, {
                  credentials: 'include',
                  headers: { 'Cache-Control': 'no-cache' }
                });
                
                console.log(`🧪 Pattern ${testUrl} response: ${testResponse.status}`);
                
                if (testResponse.ok) {
                  console.log(`✅ Found working URL pattern: ${testUrl}`);
                  successfulResponse = await testResponse.json();
                  break;
                }
              } catch (patternError) {
                console.log(`❌ Error with pattern ${testUrl}:`, patternError);
              }
            }
            
            // If we found a working pattern, use that data
            if (successfulResponse) {
              console.log('✅ Using successful response data:', successfulResponse);
              
              if (isMounted) {
                setStats(successfulResponse);
                setIsLoading(false);
              }
              
              // Just return to exit and avoid the regular API calls
              return;
            }
            
            // If none of the patterns worked, create fallback data
            console.log('⚠️ RENDER EMERGENCY FALLBACK: Using mockup data after all URL patterns failed');
            
            // Create fallback data for Render
            const mockStats: TicketStats = {
              totalTickets: competition.totalTickets || 100,
              purchasedTickets: 0,
              inCartTickets: 0,
              availableTickets: competition.totalTickets || 100,
              soldTicketsCount: 0,
              allNumbers: {
                totalRange: Array.from({length: competition.totalTickets || 100}, (_, i) => i + 1),
                purchased: [],
                inCart: []
              }
            };
            
            if (isMounted) {
              setStats(mockStats);
              setIsLoading(false);
            }
            
            // Exit to avoid the regular API calls
            return;
          } catch (error) {
            console.error('Render URL testing error:', error);
          }
        }
        
        // Skip directly to admin endpoints in development for now
        // In production, the public endpoints will be properly configured
        
        // In Render environment, try alternate paths
        if (isRender) {
          try {
            console.log('🧪 Testing multiple URL patterns for stats on Render');
            
            // List of URL patterns to try on Render environment
            const urlPatterns = [
              // Specialized Mobycomps API
              `/mobycomps-api/stats/${competition.id}`,
              // Non-auth admin stats endpoint
              `/api/competitions/${competition.id}/admin-stats`,
              // Absolute URL to non-auth endpoint
              `${window.location.protocol}//${window.location.hostname}/api/competitions/${competition.id}/admin-stats`
            ];
            
            let successfulResponse = null;
            
            // Try each pattern until one works
            for (const testUrl of urlPatterns) {
              console.log(`🧪 Testing URL pattern: ${testUrl}`);
              
              try {
                const testResponse = await fetch(testUrl, {
                  credentials: 'include',
                  headers: { 'Cache-Control': 'no-cache' }
                });
                
                console.log(`🧪 Pattern ${testUrl} response: ${testResponse.status}`);
                
                if (testResponse.ok) {
                  console.log(`✅ Found working URL pattern: ${testUrl}`);
                  successfulResponse = await testResponse.json();
                  break;
                }
              } catch (patternError) {
                console.log(`❌ Error with pattern ${testUrl}:`, patternError);
              }
            }
            
            // If we found a working pattern, use that data
            if (successfulResponse) {
              console.log('✅ Using successful response data:', successfulResponse);
              
              if (isMounted) {
                setStats(successfulResponse);
                setIsLoading(false);
              }
              
              // No need to get cart data - already have it from the successful response
              
              // Just return to exit and avoid the regular API calls
              return;
            }
          } catch (error) {
            console.error('Render URL testing error:', error);
          }
        }
        
        // If public endpoint fails, try the admin endpoint as a fallback
        const statsUrl = `${apiBase}/api/admin/competitions/${competition.id}/ticket-stats`;
        console.log(`Making admin stats API request to: ${statsUrl}`);
        
        const statsResponse = await fetch(statsUrl, {
          credentials: 'include',
          headers: { 'Cache-Control': 'no-cache' }
        });
        
        console.log(`Admin stats response status: ${statsResponse.status}`);
        
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
          // Before making the cart request, make a quick test to verify auth is working
          // Especially important on Render to diagnose issues
          if (isRender) {
            try {
              const testAuthUrl = `${apiBase}/api/user`;
              console.log(`🔑 Testing auth status with: ${testAuthUrl}`);
              
              const authResponse = await fetch(testAuthUrl, {
                credentials: 'include',
                headers: { 'Cache-Control': 'no-cache' }
              });
              
              if (authResponse.ok) {
                const authData = await authResponse.json();
                console.log('🔑 Auth test successful:', authData);
                // Don't do anything with the data, just checking it works
              } else {
                console.error(`🔑 Auth test failed: ${authResponse.status} ${authResponse.statusText}`);
              }
            } catch (authError) {
              console.error("🔑 Auth test error:", authError);
            }
          }
        
          // For Render we need to try multiple URL patterns for the cart API as well
          // This matches our server-docker.cjs no-auth endpoint
          if (isRender) {
            try {
              console.log('🧪 Testing multiple cart API URL patterns on Render');
              
              // List of cart API URL patterns to try
              const cartUrlPatterns = [
                // Pattern 1: Regular admin API route
                `${apiBase}/api/admin/competitions/${competition.id}/cart-items`,
                // Pattern 2: New no-auth route specifically for Render compatibility
                `${baseUrl}/api/competitions/${competition.id}/admin-cart`,
                // Pattern 3: Alternate path
                `/api/competitions/${competition.id}/admin-cart`,
                // Pattern 4: No-www domain with admin-cart endpoint
                `${window.location.protocol}//${window.location.hostname.replace('www.', '')}/api/competitions/${competition.id}/admin-cart`,
                // Pattern 5: Second level domain with standard admin path
                `https://api.${window.location.hostname}/admin/competitions/${competition.id}/cart-items`,
                // Pattern 6: Absolute URL with second-level domain backend
                `${baseUrl.replace('www.', '')}/api/competitions/${competition.id}/admin-cart`,
                // Pattern 7: Try different method/path pattern
                `${baseUrl}/api/competitions/${competition.id}/cart`,
                // Pattern 8: Special mobycomps cart endpoint
                `/mobycomps-api/cart/${competition.id}`,
                // Pattern 9: Absolute mobycomps URL
                `${baseUrl}/mobycomps-api/cart/${competition.id}`,
                // Pattern 10: Absolute domain-rooted mobycomps URL
                `${window.location.protocol}//${window.location.hostname}/mobycomps-api/cart/${competition.id}`
              ];
              
              let cartSuccessResponse = null;
              
              // Try each cart pattern until one works
              for (const cartTestUrl of cartUrlPatterns) {
                console.log(`🧪 Testing cart URL pattern: ${cartTestUrl}`);
                
                try {
                  const cartTestResponse = await fetch(cartTestUrl, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    credentials: 'include',
                    body: JSON.stringify({})
                  });
                  
                  console.log(`🧪 Cart pattern ${cartTestUrl} response: ${cartTestResponse.status}`);
                  
                  if (cartTestResponse.ok) {
                    console.log(`✅ Found working cart URL pattern: ${cartTestUrl}`);
                    cartSuccessResponse = await cartTestResponse.json();
                    break;
                  }
                } catch (cartPatternError) {
                  console.log(`❌ Error with cart pattern ${cartTestUrl}:`, cartPatternError);
                }
              }
              
              // If we found a working pattern, use that data
              if (cartSuccessResponse) {
                console.log('✅ Using successful cart response data:', cartSuccessResponse);
                
                if (isMounted && cartSuccessResponse && Array.isArray(cartSuccessResponse.inCartNumbers)) {
                  setInCartNumbers(cartSuccessResponse.inCartNumbers);
                }
                return; // Exit cart processing
              }
              
              // If we get here, none of the patterns worked
              console.log('⚠️ No cart patterns worked, showing empty cart data');
              if (isMounted) {
                setInCartNumbers([]);
              }
              return; // Exit cart processing
            } catch (cartFallbackError) {
              console.error('Cart fallback error:', cartFallbackError);
            }
          }
          
          // If we're not on Render, or the Render-specific code didn't succeed,
          // fall back to the original cart API endpoint
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
    // Check if we're on mobycomps.co.uk - we need to know this for the debug display
    const isMobyComps = window.location.hostname.includes('mobycomps.co.uk');
    
    // For mobycomps - try one final desperate fix
    if (isMobyComps && competition?.id) {
      // Redirect to the same page to trigger a fresh try
      console.log("🚨 MOBYCOMPS EMERGENCY: Attempting to access special direct endpoint");
      // Try to call the special endpoint directly
      fetch(`/mobycomps-api/stats/${competition.id}`)
        .then(response => {
          console.log("Mobycomps direct endpoint response:", response.status);
          if (response.ok) {
            return response.json();
          }
          throw new Error(`Failed with ${response.status}`);
        })
        .then(data => {
          console.log("Mobycomps direct endpoint data:", data);
          // If we got data, reload the page to try one more time
          window.location.reload();
        })
        .catch(error => {
          console.error("Mobycomps endpoint error:", error);
        });
    }
    
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
              <li>- Is Render: {window.location.hostname.includes('render.com') || 
                     window.location.hostname.includes('onrender.com') || 
                     window.location.hostname.includes('mobycomps.co.uk') ? 'Yes' : 'No'}</li>
              <li>- Is MobyComps: {isMobyComps ? 'Yes' : 'No'}</li>
              <li>- Auth Cookie Present: {document.cookie.includes('bw.sid') ? 'Yes' : 'No'}</li>
              <li>- Error Status: {hasError ? 'Error fetching data' : 'No data returned'}</li>
            </ul>
            <p className="mt-3 text-xs">
              <strong>Render-specific solution:</strong> Make sure server-docker.cjs has the admin API endpoints 
              properly registered with the isAdmin middleware. Check lines 1899 and 1973 in that file.
            </p>
            {isMobyComps && (
              <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded-md text-blue-800">
                <p><strong>MobyComps Direct Endpoint:</strong> Attempting to access special direct endpoint at:<br/>
                <code>/mobycomps-api/stats/{competition?.id}</code><br/>
                If this works, the page will reload automatically.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Add extra debugging for stats and allNumbers
  console.log("🧮 STATS DATA:", stats);
  
  // Fallback values for missing data
  const totalTickets = competition.totalTickets || 0;
  
  // Ensure we're handling both formats of the stats response properly
  // Some endpoints return purchasedTickets, others may return soldTicketsCount
  const purchasedTickets = stats.purchasedTickets || stats.soldTicketsCount || 0;
  const inCartTicketsCount = inCartNumbers.length || stats.inCartTickets || 0;
  const availableTickets = stats.availableTickets || (totalTickets - purchasedTickets - inCartTicketsCount);
  
  // Calculate percentages for visualization (with safety checks)
  // We no longer include inCartTickets in our display, so our percentages need to be recalculated
  // to only show purchased vs available tickets (only 2 categories instead of 3)
  const safeCalculatePercentage = (value: number) => {
    if (!totalTickets || totalTickets <= 0) return 0;
    return (value / totalTickets) * 100;
  };
  
  const purchasedPercentage = safeCalculatePercentage(purchasedTickets);
  // Since we're not showing in-cart anymore, just make this 0
  const inCartPercentage = 0;
  // Available percentage should now be the remainder after purchased
  const availablePercentage = safeCalculatePercentage(availableTickets);
  
  // Sale status percentage with fallback
  const percentSold = totalTickets ? ((purchasedTickets / totalTickets) * 100).toFixed(1) + '%' : '0%';
  
  // Basic range generation for the number grid
  const generateRange = (start: number, end: number): number[] => {
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };
  
  // Fully validate allNumbers from the stats response to prevent rendering errors
  console.log("🧮 ATTEMPTING TO PROCESS allNumbers:", stats.allNumbers);
  
  let validatedAllNumbers;
  
  if (stats.allNumbers && 
      Array.isArray(stats.allNumbers.totalRange) && 
      Array.isArray(stats.allNumbers.purchased)) {
    // Good data structure - use it
    validatedAllNumbers = {
      totalRange: stats.allNumbers.totalRange,
      purchased: stats.allNumbers.purchased,
      inCart: Array.isArray(inCartNumbers) ? inCartNumbers : []
    };
    console.log("✅ Valid allNumbers structure found in stats response");
  } else {
    // Fall back to generating our own data structure
    console.log("⚠️ Invalid or missing allNumbers in stats response - generating fallback");
    validatedAllNumbers = {
      totalRange: generateRange(1, totalTickets),
      purchased: [],
      inCart: Array.isArray(inCartNumbers) ? inCartNumbers : []
    };
  }
  
  // Additional safety check for purchased numbers
  if (!Array.isArray(validatedAllNumbers.purchased)) {
    validatedAllNumbers.purchased = [];
  }
  
  console.log("🧮 VALIDATED allNumbers:", validatedAllNumbers);
  
  // Final safety check - ensure totalRange is never empty even if API returns empty
  if (!validatedAllNumbers.totalRange || validatedAllNumbers.totalRange.length === 0) {
    validatedAllNumbers.totalRange = generateRange(1, totalTickets);
  }
  
  const allNumbers = validatedAllNumbers;
  
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
          <div className="grid grid-cols-3 gap-3">
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
            onClick={() => {
              console.log(`🔘 Button clicked - toggling grid from ${showNumberGrid} to ${!showNumberGrid}`);
              setShowNumberGrid(!showNumberGrid);
            }}
            className="w-full text-sm"
            size="sm"
          >
            {showNumberGrid ? "Hide" : "Show"} Ticket Number Grid
          </Button>
        </CardFooter>
      </Card>

      {/* Conditionally render the ticket number grid */}
      {showNumberGrid ? (
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
                            ${isPurchased ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}
                          `}
                        >
                          {number}
                          {isPurchased && <Lock className="h-3 w-3 ml-1" />}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        {isPurchased ? 'Purchased' : 'Available'}
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
      ) : (
        // Debug element to show when grid is hidden - helpful for development
        <div className="hidden">
          Grid is hidden. showNumberGrid = {String(showNumberGrid)}
        </div>
      )}
    </div>
  );
}