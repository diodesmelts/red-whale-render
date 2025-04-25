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
    <section className="py-12 flex-grow bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link href="/competitions">
          <div className="inline-flex items-center text-primary hover:text-primary/80 mb-6 cursor-pointer">
            <ChevronLeft className="mr-2 h-4 w-4" /> Back to Competitions
          </div>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left column: Image and purchase */}
          <div className="lg:col-span-1">
            <div className="bg-card rounded-lg overflow-hidden shadow-lg border border-border p-4">
              <div className="relative rounded-lg overflow-hidden border border-border/30 mb-4">
                <div className="aspect-square relative">
                  <img 
                    className="w-full h-full object-cover" 
                    src={competition.imageUrl || "https://placehold.co/600x600/1a1f2b/FFFFFF/png?text=No+Image"} 
                    alt={competition.title}
                  />
                  <div className="absolute top-0 left-0 w-16 h-16 bg-pink-500/40 blur-xl rounded-full -translate-x-1/2 -translate-y-1/2"></div>
                </div>
                <div className="absolute top-3 left-3 bg-white text-background text-sm font-bold px-3 py-1 rounded">
                  WIN NOW
                </div>
                <button className="absolute top-3 right-3 bg-background/80 hover:bg-background p-1.5 rounded-full text-white">
                  <Heart className="h-4 w-4" />
                </button>
              </div>
              
              <CountdownTimer drawDate={competition.drawDate} variant="detailed" />
              
              <div className="mt-4">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-secondary rounded-lg p-3">
                    <div className="text-muted-foreground text-xs uppercase mb-1">Available</div>
                    <div className="text-foreground font-medium">{remainingTickets} / {competition.totalTickets}</div>
                  </div>
                  <div className="bg-secondary rounded-lg p-3">
                    <div className="text-muted-foreground text-xs uppercase mb-1">Price</div>
                    <div className="text-foreground font-medium">{formatCurrency(competition.ticketPrice)}</div>
                  </div>
                </div>
                
                <AddToCart 
                  competition={competition}
                  layout="column"
                  buttonVariant="default"
                  withNavigation={true}
                />
                
                <div className="text-center mt-2 text-muted-foreground text-xs">
                  <ShieldCheck className="h-3 w-3 inline mr-1 text-green-500" /> Secure payment via Stripe
                </div>
              </div>
            </div>
          </div>
          
          {/* Right column: Details */}
          <div className="lg:col-span-2">
            <div className="bg-card rounded-lg overflow-hidden shadow-lg border border-border p-6">
              <div className="mb-6">
                <h1 className="text-3xl font-bold text-foreground mb-2">{competition.title}</h1>
                <div className="flex items-center">
                  <CategoryBadge category={competition.category} />
                  <span className="text-muted-foreground text-sm ml-2">
                    Draw date: {new Date(competition.drawDate).toLocaleDateString('en-GB', { 
                      day: '2-digit',
                      month: 'short', 
                      year: 'numeric'
                    })}
                  </span>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-4 mb-6">
                <div className="bg-secondary rounded-lg p-3 flex-1 min-w-[120px]">
                  <div className="text-muted-foreground text-xs uppercase mb-1">PRIZE VALUE</div>
                  <div className="text-foreground font-medium flex items-center">
                    <i className="fas fa-tag mr-2 text-pink-400"></i> {formatCurrency(competition.prizeValue)}
                  </div>
                </div>
                <div className="bg-secondary rounded-lg p-3 flex-1 min-w-[120px]">
                  <div className="text-muted-foreground text-xs uppercase mb-1">TICKETS SOLD</div>
                  <div className="text-foreground font-medium flex items-center">
                    <i className="fas fa-ticket-alt mr-2 text-purple-500"></i> {competition.ticketsSold || 0} of {competition.totalTickets}
                  </div>
                </div>
                <div className="bg-secondary rounded-lg p-3 flex-1 min-w-[120px]">
                  <div className="text-muted-foreground text-xs uppercase mb-1">MAX PER USER</div>
                  <div className="text-foreground font-medium flex items-center">
                    <i className="fas fa-user mr-2 text-blue-500"></i> {competition.maxTicketsPerUser}
                  </div>
                </div>
              </div>
              
              <div className="border-t border-border pt-6 mb-6">
                <h3 className="text-lg font-semibold text-foreground mb-3 inline-flex items-center">
                  <i className="fas fa-info-circle mr-2 text-primary"></i> About This Competition
                </h3>
                <p className="text-muted-foreground">
                  {competition.description}
                </p>
                
                {competition.brand && (
                  <div className="mt-4 flex items-center bg-secondary/50 p-3 rounded-lg">
                    <div className="text-primary font-semibold mr-2">Brand:</div>
                    <div>{competition.brand}</div>
                  </div>
                )}
              </div>
              
              <div className="border-t border-border pt-6">
                <h3 className="text-lg font-semibold text-foreground mb-3 inline-flex items-center">
                  <ShieldCheck className="h-5 w-5 mr-2 text-green-500" /> Secure Payments
                </h3>
                
                <div className="bg-secondary rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 mr-4">
                      <i className="fab fa-stripe text-4xl text-purple-500"></i>
                    </div>
                    <div className="flex-1">
                      <div className="text-foreground font-medium">Powered by Stripe</div>
                      <div className="text-muted-foreground text-sm">Industry-leading payment processing</div>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center space-x-4">
                    <div className="flex items-center text-muted-foreground text-sm">
                      <CreditCard className="h-4 w-4 mr-1" /> Credit Card
                    </div>
                    <div className="flex items-center text-muted-foreground text-sm">
                      <AppleIcon className="h-4 w-4 mr-1" /> Apple Pay
                    </div>
                    <div className="flex items-center text-muted-foreground text-sm">
                      <Lock className="h-4 w-4 mr-1" /> Secure SSL
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}