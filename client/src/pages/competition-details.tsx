import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { Competition } from "@shared/schema";
import { CountdownTimer } from "@/components/competition/countdown-timer";
import { CategoryBadge } from "@/components/competition/category-badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useCart } from "@/hooks/use-cart";
import { ChevronLeft, Heart, ShieldCheck, Plus, Minus, CreditCard, AppleIcon, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { useState } from "react";
import { AddToCart } from "@/components/cart/add-to-cart";
import { CartIcon } from "@/components/cart/cart-icon";

export default function CompetitionDetails() {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const [ticketQuantity, setTicketQuantity] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Extract competition ID from the URL
  const competitionId = location.split("/")[2];
  
  // Determine API base URL based on environment
  const getApiBaseUrl = () => {
    const isProduction = window.location.hostname.includes('bluewhalecompetitions.co.uk');
    
    // Log environment details for debugging
    console.log("🔌 API URL Determination:", {
      mode: process.env.NODE_ENV,
      isProduction,
      hostname: window.location.hostname,
      origin: window.location.origin,
      protocol: window.location.protocol,
      port: window.location.port
    });
    
    if (isProduction) {
      // In production, we should try both relative and absolute URLs
      // Default to relative URL first since that should work if path handling is correct
      console.log("🔌 Production environment - using relative URL prefix");
      return '';
    } else {
      // In development, use relative URLs
      console.log("🔌 Development environment - using API on same origin (empty prefix)");
      return '';
    }
  };
  
  // Fetch competition details with enhanced error handling and retry logic
  const { data: competition, isLoading, error } = useQuery<Competition>({
    queryKey: [`/api/competitions/${competitionId}`],
    queryFn: async () => {
      try {
        const baseUrl = getApiBaseUrl();
        console.log(`🔍 Fetching competition: ID=${competitionId}`);
        
        // Try with relative URL first
        const apiUrl = `${baseUrl}/api/competitions/${competitionId}`;
        console.log(`🔍 Attempting to fetch from: ${apiUrl}`);
        
        let res;
        try {
          res = await fetch(apiUrl, {
            headers: {
              'Accept': 'application/json',
              'Cache-Control': 'no-cache'
            },
            credentials: 'include' // Send cookies for auth
          });
        } catch (fetchError) {
          console.error(`❌ Initial fetch failed:`, fetchError);
          // If we're in production and the relative URL failed, try with absolute URL
          if (window.location.hostname.includes('bluewhalecompetitions.co.uk')) {
            console.log(`🔄 Trying absolute URL as fallback...`);
            const absoluteUrl = `${window.location.origin}/api/competitions/${competitionId}`;
            console.log(`🔍 Attempting to fetch from: ${absoluteUrl}`);
            res = await fetch(absoluteUrl, {
              headers: {
                'Accept': 'application/json',
                'Cache-Control': 'no-cache'
              },
              credentials: 'include' // Send cookies for auth
            });
          } else {
            throw fetchError; // Re-throw in development
          }
        }
        
        console.log(`📦 Response status: ${res.status}, ok: ${res.ok}`);
        
        if (!res.ok) {
          // Try to get error response as JSON first
          let errorDetail;
          try {
            const errorResponse = await res.json();
            errorDetail = errorResponse.message || `HTTP error ${res.status}`;
            console.error(`❌ API error response: ${JSON.stringify(errorResponse)}`);
          } catch (jsonError) {
            // If can't parse JSON, use status text
            errorDetail = res.statusText || `HTTP error ${res.status}`;
            console.error(`❌ API error response (not JSON): ${res.statusText}`);
          }
          
          throw new Error(`Failed to fetch competition details: ${errorDetail}`);
        }
        
        const data = await res.json();
        
        // Process image URLs for production environment
        if (data && data.imageUrl) {
          const isProduction = window.location.hostname.includes('bluewhalecompetitions.co.uk');
          const { hostname, origin } = window.location;
          const isRender = hostname.includes('onrender.com');
          
          console.log(`🖼️ Processing image URL: "${data.imageUrl}"`, { 
            isProduction, 
            hostname, 
            isRender,
            origin 
          });
          
          // If image URL is relative, make it absolute
          if (data.imageUrl.startsWith('/uploads/')) {
            data.imageUrl = `${origin}${data.imageUrl}`;
            console.log(`🖼️ Final image URL: "${data.imageUrl}"`);
          }
        }
        
        console.log(`✅ Successfully loaded competition data, title: "${data.title}"`);
        return data;
      } catch (err: any) {
        // Catch network errors or other issues outside of fetch response handling
        console.error(`❌ Error fetching competition ${competitionId}:`, err);
        throw err; // Re-throw so React Query can handle it
      }
    },
    retry: 3, // Retry failed requests up to 3 times
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 15000), // Exponential backoff up to 15 seconds
  });
  
  // Handle error state with more details
  useEffect(() => {
    if (error) {
      console.error('Competition details error:', error);
      
      // Determine environment for debugging info
      const isProduction = window.location.hostname.includes('bluewhalecompetitions.co.uk');
      const errorInfo = isProduction ? 
        "Production environment detected" : 
        "Development environment detected";
      
      // Log API URL being used
      const apiUrl = isProduction ? 
        `https://${window.location.hostname}/api/competitions/${competitionId}` : 
        `/api/competitions/${competitionId}`;
      console.log(`🔌 API URL: ${apiUrl}`);
      
      toast({
        title: "Error Loading Competition",
        description: `${error.message || "Could not load competition details"} (${errorInfo})`,
        variant: "destructive",
      });
    }
  }, [error, toast, competitionId]);
  
  // Handle ticket quantity changes
  const increaseQuantity = () => {
    if (competition && ticketQuantity < competition.maxTicketsPerUser) {
      setTicketQuantity(prev => prev + 1);
    } else {
      toast({
        title: "Maximum limit reached",
        description: `You can only purchase up to ${competition?.maxTicketsPerUser} tickets per competition`,
        variant: "destructive",
      });
    }
  };
  
  const decreaseQuantity = () => {
    if (ticketQuantity > 1) {
      setTicketQuantity(prev => prev - 1);
    }
  };
  
  // Handle buying tickets
  const handleBuyTickets = async () => {
    if (!user) {
      toast({
        title: "Login required",
        description: "Please log in to purchase tickets",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }
    
    if (!competition) return;
    
    try {
      setIsProcessing(true);
      
      // Create payment intent - make sure to send amount in pence/cents (Stripe needs integer amount)
      console.log(`💰 Preparing payment: ${competition.ticketPrice} x ${ticketQuantity} tickets`);
      
      // Competition price is stored in pounds, but Stripe needs pence (integer)
      const totalAmount = Math.round(competition.ticketPrice * ticketQuantity);
      
      console.log(`💰 Total amount for payment: £${totalAmount} (${totalAmount * 100} pence)`);
      
      const paymentRes = await apiRequest("POST", "/api/create-payment-intent", {
        amount: totalAmount,
        competitionId: competition.id,
        ticketCount: ticketQuantity
      });
      
      const { clientSecret } = await paymentRes.json();
      
      // For demo purposes, create the entry without actual payment processing
      const entryRes = await apiRequest("POST", "/api/entries", {
        competitionId: competition.id,
        ticketCount: ticketQuantity,
        paymentStatus: "completed",
        stripePaymentId: "demo_payment_" + Date.now()
      });
      
      if (entryRes.ok) {
        toast({
          title: "Success!",
          description: `You've successfully purchased ${ticketQuantity} ticket${ticketQuantity > 1 ? 's' : ''}!`,
        });
        
        // Navigate to entries page
        navigate("/my-entries");
      }
    } catch (error: any) {
      toast({
        title: "Purchase failed",
        description: error.message || "Failed to process your purchase",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Calculate remaining tickets
  const remainingTickets = competition ? (competition.totalTickets - (competition.ticketsSold || 0)) : 0;
  
  if (isLoading) {
    return (
      <div className="flex-grow flex items-center justify-center">
        <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }
  
  if (!competition) {
    // Create a more detailed error message for debugging
    const isProduction = window.location.hostname.includes('bluewhalecompetitions.co.uk');
    const errorMessage = error ? 
      (error instanceof Error ? error.message : String(error)) : 
      "Competition details could not be loaded";
    
    // Only show technical details in development environment
    const showDebugInfo = !isProduction;
    
    return (
      <div className="flex-grow flex items-center justify-center flex-col p-6 max-w-3xl mx-auto">
        <div className="bg-destructive/10 w-full p-6 rounded-lg mb-6 border border-destructive/20">
          <h2 className="text-2xl font-bold mb-4 text-destructive">Error Loading Competition</h2>
          <p className="text-foreground mb-6">
            There was a problem loading the competition details. This may be due to:
          </p>
          <ul className="list-disc pl-6 mb-6 space-y-2 text-muted-foreground">
            <li>The competition ID ({competitionId}) may be invalid</li>
            <li>The competition may have been removed</li>
            <li>There might be a temporary connection issue with our server</li>
          </ul>
          
          {showDebugInfo && error && (
            <div className="bg-muted p-3 rounded text-xs font-mono mt-4 mb-4 overflow-auto max-h-[200px]">
              <div className="text-foreground font-semibold mb-2">Debug Information:</div>
              <p className="text-muted-foreground whitespace-pre-wrap break-all">
                {errorMessage}
              </p>
              <div className="mt-2 text-foreground font-semibold">API URL:</div>
              <p className="text-muted-foreground">{
                isProduction ? 
                  `https://${window.location.hostname}/api/competitions/${competitionId}` : 
                  `/api/competitions/${competitionId}`
              }</p>
            </div>
          )}
          </div>
        
        <Link href="/competitions">
          <Button size="lg">Browse All Competitions</Button>
        </Link>
      </div>
    );
  }

  return (
    <section className="flex-grow bg-white">
      {/* Top info bar */}
      <div className="w-full bg-gray-100 py-3 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center gap-10 text-sm text-gray-700">
            <div className="flex items-center">
              <span className="font-semibold">ENTRIES ONLY £{competition.ticketPrice.toFixed(2)}</span>
            </div>
            <div className="flex items-center">
              <span className="font-semibold">MAX ENTRIES £{(competition.maxTicketsPerUser * competition.ticketPrice).toFixed(2)}</span>
            </div>
            <div className="flex items-center">
              <span className="font-semibold">MAX {competition.maxTicketsPerUser} PER PERSON</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Left column: Image */}
          <div className="bg-white rounded-lg p-4">
            <div className="aspect-square relative bg-white rounded-lg overflow-hidden">
              <img 
                className="w-full h-full object-contain" 
                src={competition.imageUrl || "https://placehold.co/600x600/1a1f2b/FFFFFF/png?text=No+Image"} 
                alt={competition.title}
              />
            </div>
          </div>
          
          {/* Right column: Details */}
          <div>
            <div className="bg-white">
              <h1 className="text-3xl font-bold text-[#002147] mb-4 uppercase tracking-tight text-center">
                {competition.title}
              </h1>
              
              <div className="text-center mb-4">
                <div className="text-gray-600">Cash Alternative: {formatCurrency(competition.prizeValue)}</div>
              </div>
              
              {/* Draw Date Box */}
              <div className="flex justify-center gap-2 mb-6">
                <div className="py-1.5 px-4 bg-green-500 text-white rounded-md text-sm inline-flex items-center">
                  <span className="font-semibold">
                    Draw {new Date(competition.drawDate).toLocaleDateString('en-GB', { 
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </span>
                </div>
                <div className="py-1.5 px-4 bg-blue-500 text-white rounded-md text-sm inline-flex items-center">
                  <span className="font-semibold">Automated Draw</span>
                </div>
              </div>
              
              {/* Price */}
              <div className="text-center mb-6">
                <div className="text-[#0099ff] text-4xl font-bold">
                  {formatCurrency(competition.ticketPrice)}
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="mb-8">
                <div className="mb-2 flex justify-between text-xs text-gray-600">
                  <span>SOLD: {Math.round((competition.ticketsSold || 0) / competition.totalTickets * 100)}%</span>
                  <span>{competition.ticketsSold || 0} / {competition.totalTickets}</span>
                </div>
                <div className="h-2.5 w-full bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-2.5 bg-[#0099ff] rounded-full" 
                    style={{ width: `${Math.round((competition.ticketsSold || 0) / competition.totalTickets * 100)}%` }}
                  ></div>
                </div>
              </div>
              
              {/* Buy Tabs */}
              <div className="mb-8">
                <div className="grid grid-cols-2 gap-1">
                  <button className="bg-[#002147] text-white font-medium py-3 rounded-l-md text-center">
                    ONLINE ENTRY
                  </button>
                  <button className="bg-gray-200 text-gray-700 font-medium py-3 rounded-r-md text-center">
                    FREE POSTAL ENTRY
                  </button>
                </div>
              </div>
              
              {/* Ticket Quantity Selector */}
              <div className="bg-gray-100 p-6 rounded-md mb-8">
                <div className="mb-4 text-center">
                  <h3 className="text-gray-700 font-medium mb-2">How many tickets?</h3>
                  <div className="bg-[#002147] text-white font-bold py-1 px-4 rounded-full inline-block">
                    {ticketQuantity}
                  </div>
                </div>
                
                {/* Slider */}
                <div className="mb-4">
                  <input 
                    type="range" 
                    min="1" 
                    max={competition.maxTicketsPerUser} 
                    value={ticketQuantity}
                    onChange={(e) => setTicketQuantity(parseInt(e.target.value))}
                    className="w-full bg-gray-300 h-2 rounded-full outline-none appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[#0099ff] [&::-webkit-slider-thumb]:cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>1</span>
                    <span>{competition.maxTicketsPerUser}</span>
                  </div>
                </div>
                
                {/* +/- Controls */}
                <div className="flex items-center justify-center gap-4 mb-4">
                  <button 
                    onClick={decreaseQuantity}
                    className="bg-white border border-gray-300 rounded-md h-8 w-8 flex items-center justify-center"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  
                  <div className="text-center">
                    <div className="text-sm text-gray-700">Number of tickets: <span className="font-semibold">{ticketQuantity}</span> (£{(ticketQuantity * competition.ticketPrice).toFixed(2)})</div>
                  </div>
                  
                  <button 
                    onClick={increaseQuantity}
                    className="bg-white border border-gray-300 rounded-md h-8 w-8 flex items-center justify-center"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                
                {/* Add to cart button */}
                <button 
                  onClick={() => {
                    if (!user) {
                      toast({
                        title: "Login required",
                        description: "Please log in to purchase tickets",
                        variant: "destructive",
                      });
                      navigate("/auth");
                      return;
                    }
                    
                    // Add to cart and navigate
                    addToCart(competition, ticketQuantity);
                    navigate("/cart");
                  }}
                  className="w-full bg-[#002147] hover:bg-[#001c3a] text-white font-semibold py-3 px-4 rounded-md flex items-center justify-center gap-2"
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      Add tickets to basket <CreditCard className="h-5 w-5 ml-1" />
                    </>
                  )}
                </button>
                
                {/* Trustpilot rating */}
                <div className="mt-4 flex items-center justify-center">
                  <div className="text-sm text-gray-700 mr-2">Excellent</div>
                  <div className="flex">
                    <span className="bg-green-500 text-white text-xs px-1">★★★★★</span>
                  </div>
                  <div className="text-xs text-gray-600 ml-2">4,202 reviews on <span className="text-gray-800 font-medium">Trustpilot</span></div>
                </div>
                
                {/* Competition closes notice */}
                <div className="mt-3 text-center bg-gray-50 p-3 rounded border border-gray-200">
                  <div className="text-sm font-medium">Competition closes Today at 8:45 PM</div>
                  <div className="text-xs text-gray-500">or when all tickets are sold</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* How it works section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-center mb-4">How it works</h2>
          <p className="text-center text-gray-600 mb-8">Instantly find out if you are a lucky winner!</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border border-gray-200 rounded-lg p-6 text-center">
              <div className="bg-blue-100 w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-blue-500 font-semibold">1</span>
              </div>
              <div className="mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mx-auto text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <h3 className="font-semibold mb-1">Buy your tickets</h3>
            </div>
            
            <div className="border border-gray-200 rounded-lg p-6 text-center">
              <div className="bg-blue-100 w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-blue-500 font-semibold">2</span>
              </div>
              <div className="mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mx-auto text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="font-semibold mb-1">Reveal if you've won</h3>
            </div>
            
            <div className="border border-gray-200 rounded-lg p-6 text-center">
              <div className="bg-blue-100 w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-blue-500 font-semibold">3</span>
              </div>
              <div className="mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mx-auto text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                </svg>
              </div>
              <h3 className="font-semibold mb-1">Claim your prize</h3>
            </div>
          </div>
        </div>
      
        {/* Details Tabs */}
        <div className="border-t border-gray-200 pt-6">
          <div className="flex border-b border-gray-200 mb-6">
            <button className="py-2 px-6 border-b-2 border-[#0099ff] text-[#0099ff] font-semibold">
              Competition Details
            </button>
            <button className="py-2 px-6 text-gray-500">
              FAQ
            </button>
          </div>
          
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-[#002147] mb-4">
              {competition.title}
            </h2>
            
            <p className="text-gray-700 mb-6">
              {competition.description || 
               "We are giving you the opportunity to win a " + competition.title + " All for just £" + competition.ticketPrice.toFixed(2) + "!"}
            </p>
            
            <p className="text-gray-700 mb-6">
              Our tech competitions always sell super fast, enter now before it's too late and you could be our next winner!
            </p>
            
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-[#002147] mb-2">Draw Information</h3>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>Draw takes place regardless of sell out</li>
                <li>Competition will close sooner if the maximum entries are received</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}