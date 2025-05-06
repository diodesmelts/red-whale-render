import { useEffect, useState } from "react";
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
import { ChevronLeft, Heart, ShieldCheck, Plus, Minus, CreditCard, AppleIcon, Lock, AlertCircle, Shuffle } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { AddToCart } from "@/components/cart/add-to-cart";
import { CartIcon } from "@/components/cart/cart-icon";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function CompetitionDetails() {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const [ticketQuantity, setTicketQuantity] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState("details");
  const [competencyAnswer, setCompetencyAnswer] = useState("");
  
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
      
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Left column: Image */}
          <div className="flex flex-col gap-3">
            {/* Image container */}
            <div className="bg-white rounded-lg p-3 shadow-md border border-gray-100">
              <div className="aspect-square relative bg-white rounded-lg overflow-hidden">
                <img 
                  className="w-full h-full object-contain" 
                  src={competition.imageUrl || "https://placehold.co/600x600/1a1f2b/FFFFFF/png?text=No+Image"} 
                  alt={competition.title}
                />
              </div>
            </div>
            
            {/* Competition Details */}
            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
              <h3 className="text-sm font-semibold text-[#002147] mb-2">Competition Details</h3>
              <p className="text-xs text-gray-700 mb-2">
                {competition.description || 
                "We are giving you the opportunity to win " + competition.title + " All for just £" + competition.ticketPrice.toFixed(2) + "!"}
              </p>
              <div className="text-xs text-gray-700">
                <span className="font-medium text-[#002147]">Draw Information:</span> 
                <ul className="list-disc list-inside mt-1 space-y-0.5">
                  <li>Draw takes place on {new Date(competition.drawDate).toLocaleDateString('en-GB')}</li>
                  <li>Competition will close sooner if the maximum entries are received</li>
                </ul>
              </div>
            </div>
            
            {/* Mini How It Works section */}
            <div className="bg-gray-50 rounded-lg p-4 shadow-sm border border-gray-100">
              <h3 className="text-sm font-semibold text-[#002147] mb-2 text-center">How it works</h3>
              <p className="text-xs text-gray-600 text-center mb-3">Instantly find out if you are a lucky winner!</p>
              
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center">
                  <div className="w-6 h-6 bg-[#bbd665]/20 rounded-full flex items-center justify-center mx-auto mb-1">
                    <span className="text-[#002147] font-medium text-xs">1</span>
                  </div>
                  <div className="text-[#002147]">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  </div>
                  <p className="text-xs font-medium mt-1">Buy tickets</p>
                </div>
                
                <div className="text-center">
                  <div className="w-6 h-6 bg-[#bbd665]/20 rounded-full flex items-center justify-center mx-auto mb-1">
                    <span className="text-[#002147] font-medium text-xs">2</span>
                  </div>
                  <div className="text-[#002147]">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <p className="text-xs font-medium mt-1">Reveal result</p>
                </div>
                
                <div className="text-center">
                  <div className="w-6 h-6 bg-[#bbd665]/20 rounded-full flex items-center justify-center mx-auto mb-1">
                    <span className="text-[#002147] font-medium text-xs">3</span>
                  </div>
                  <div className="text-[#002147]">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                    </svg>
                  </div>
                  <p className="text-xs font-medium mt-1">Claim prize</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Right column: Details */}
          <div>
            <div className="bg-white rounded-lg border border-gray-200 shadow-md overflow-hidden">
              {/* Header with title */}
              <div className="bg-[#002147] text-white p-4">
                <h1 className="text-xl font-bold uppercase tracking-tight text-center">
                  {competition.title}
                </h1>
                <div className="text-center mt-1">
                  <div className="text-white/90 text-xs">Cash Alternative: {formatCurrency(competition.prizeValue)}</div>
                </div>
              </div>
              
              <div className="p-4">
                {/* Draw Date Box */}
                <div className="flex justify-center gap-1 mb-4">
                  <div className="py-1 px-3 bg-[#bbd665] text-white rounded-md text-xs inline-flex items-center">
                    <span className="font-semibold">
                      Draw {new Date(competition.drawDate).toLocaleDateString('en-GB', { 
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                  <div className="py-1 px-3 bg-[#002147] text-white rounded-md text-xs inline-flex items-center">
                    <span className="font-semibold">Automated Draw</span>
                  </div>
                </div>
                
                {/* Price */}
                <div className="text-center mb-4">
                  <div className="text-black text-3xl font-bold">
                    {formatCurrency(competition.ticketPrice)}
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div className="mb-5">
                  <div className="mb-1 flex justify-between text-xs text-gray-600">
                    <span>SOLD: {Math.round((competition.ticketsSold || 0) / competition.totalTickets * 100)}%</span>
                    <span>{competition.ticketsSold || 0} / {competition.totalTickets}</span>
                  </div>
                  <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-2 bg-[#002147] rounded-full" 
                      style={{ width: `${Math.round((competition.ticketsSold || 0) / competition.totalTickets * 100)}%` }}
                    ></div>
                  </div>
                </div>
                

                {/* Ticket Quantity Section */}
                <div className="bg-gray-100 p-4 rounded-md mb-5">
                  <h3 className="text-[#002147] font-semibold mb-3 text-sm text-center uppercase border-b border-gray-200 pb-2">Select Your Tickets</h3>
                  
                  <div className="mb-3 text-center">
                    <div className="bg-[#002147] text-white font-bold py-0.5 px-3 rounded-full inline-block text-sm">
                      {ticketQuantity}
                    </div>
                  </div>
                  
                  {/* Slider */}
                  <div className="mb-3">
                    <input 
                      type="range" 
                      min="1" 
                      max={competition.maxTicketsPerUser} 
                      value={ticketQuantity}
                      onChange={(e) => setTicketQuantity(parseInt(e.target.value))}
                      className="w-full bg-gray-300 h-1.5 rounded-full outline-none appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[#002147] [&::-webkit-slider-thumb]:cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>1</span>
                      <span>{competition.maxTicketsPerUser}</span>
                    </div>
                  </div>
                  
                  {/* +/- Controls */}
                  <div className="flex items-center justify-center gap-3 mb-3">
                    <button 
                      onClick={decreaseQuantity}
                      className="bg-white border border-gray-300 rounded-md h-6 w-6 flex items-center justify-center"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    
                    <div className="text-center">
                      <div className="text-xs text-gray-700">Number of tickets: <span className="font-semibold">{ticketQuantity}</span> (£{(ticketQuantity * competition.ticketPrice).toFixed(2)})</div>
                    </div>
                    
                    <button 
                      onClick={increaseQuantity}
                      className="bg-white border border-gray-300 rounded-md h-6 w-6 flex items-center justify-center"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                  
                  {/* Competency Question */}
                  <div className="mb-4 border border-gray-200 rounded-md p-3 bg-gray-50">
                    <div className="flex items-start mb-2">
                      <AlertCircle className="h-4 w-4 text-[#002147] mr-2 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-medium text-[#002147]">Question</h4>
                        <p className="text-xs text-gray-500 mt-0.5">Please answer the following question correctly to continue</p>
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      <label className="block text-sm font-medium mb-1">
                        What is 4 + 8?
                      </label>
                      <Select
                        value={competencyAnswer}
                        onValueChange={setCompetencyAnswer}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select your answer" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="6">6</SelectItem>
                          <SelectItem value="10">10</SelectItem>
                          <SelectItem value="12">12</SelectItem>
                          <SelectItem value="14">14</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  {/* Number Selection and Add to Cart */}
                  <div 
                    className={competencyAnswer !== "12" ? "opacity-50 pointer-events-none" : ""}
                    title={competencyAnswer !== "12" ? "Please correctly answer the question to continue" : ""}
                  >
                    {/* Select Numbers Button */}
                    <div className="mb-3">
                      <Button 
                        variant="outline"
                        className="w-full mb-2 bg-white border-[#002147] text-[#002147] hover:bg-gray-100"
                        onClick={() => {
                          if (!document.querySelector('[data-testid="number-picker-dialog"]')) {
                            const selectNumbersBtn = document.querySelector('[data-testid="select-numbers-btn"]') as HTMLButtonElement;
                            if (selectNumbersBtn) selectNumbersBtn.click();
                          }
                        }}
                      >
                        <Shuffle className="w-4 h-4 mr-2" />
                        Select Ticket Numbers
                      </Button>
                    </div>
                    
                    <AddToCart 
                      competition={competition}
                      layout="column"
                      buttonVariant="default"
                      withNavigation={true}
                      showNumberPicker={true}
                      quantity={ticketQuantity}
                    />
                  </div>
                  
                  {competencyAnswer !== "12" && (
                    <div className="mt-2 text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      Please correctly answer the question to continue
                    </div>
                  )}
                  
                  {/* Competition closes notice */}
                  <div className="mt-4 text-center bg-gray-50 p-2 rounded border border-gray-200">
                    <div className="text-xs font-medium">Competition closes Today at 8:45 PM</div>
                    <div className="text-xs text-gray-500">or when all tickets are sold</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        

      
        {/* FAQs Section */}
        <div className="border-t border-gray-200 pt-4">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-[#002147] mb-3">
              Frequently Asked Questions
            </h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-semibold text-[#002147] mb-1">How do I know if I've won?</h3>
                <p className="text-gray-700 text-sm">
                  Once the competition closes and the draw takes place, winners will be notified via email. You can also check your account dashboard for any winning notifications.
                </p>
              </div>
              
              <div>
                <h3 className="text-base font-semibold text-[#002147] mb-1">When will I receive my prize?</h3>
                <p className="text-gray-700 text-sm">
                  If you're the lucky winner, your prize will be dispatched within 14 working days of the draw date. For high-value items, we may arrange a delivery date with you directly.
                </p>
              </div>
              
              <div>
                <h3 className="text-base font-semibold text-[#002147] mb-1">Can I get a refund on my tickets?</h3>
                <p className="text-gray-700 text-sm">
                  All ticket purchases are final and non-refundable once completed.
                </p>
              </div>
              
              <div>
                <h3 className="text-base font-semibold text-[#002147] mb-1">What's the cash alternative?</h3>
                <p className="text-gray-700 text-sm">
                  A cash alternative is available for this prize at the value shown in the competition details. You must notify us within 14 days of winning if you prefer the cash alternative.
                </p>
              </div>
              
              <div>
                <h3 className="text-base font-semibold text-[#002147] mb-1">How are the winners selected?</h3>
                <p className="text-gray-700 text-sm">
                  Winners are selected via an automated random selection system which is overseen by an independent adjudicator.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}