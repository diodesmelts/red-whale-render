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
import { ChevronLeft, Expand, Heart, ShieldCheck, Plus, Minus, CreditCard, AppleIcon, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { useState } from "react";

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
      
      // Create payment intent
      const paymentRes = await apiRequest("POST", "/api/create-payment-intent", {
        amount: (competition.ticketPrice * ticketQuantity) / 100,
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
  
  // Get theme colors based on category
  const getCategoryThemeColor = () => {
    if (!competition) return "primary";
    
    switch (competition.category) {
      case "family":
        return "bg-yellow-500 hover:bg-yellow-600";
      case "appliances":
        return "bg-pink-500 hover:bg-pink-600";
      case "cash":
        return "bg-green-500 hover:bg-green-600";
      default:
        return "bg-primary hover:bg-primary/90";
    }
  };
  
  // Calculate remaining tickets
  const remainingTickets = competition ? competition.totalTickets - competition.ticketsSold : 0;
  
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
    <section className="py-16 flex-grow bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Left column */}
            <div className="w-full lg:w-2/3">
              <Link href="/competitions">
                <div className="inline-flex items-center text-primary hover:text-primary/80 mb-6 cursor-pointer">
                  <ChevronLeft className="mr-2 h-4 w-4" /> Back to Competitions
                </div>
              </Link>
              
              <div className="bg-card rounded-lg overflow-hidden shadow-lg border border-border">
                <div className="relative">
                  <div className="aspect-w-16 aspect-h-9 relative">
                    <img 
                      className="w-full object-cover" 
                      src={competition.imageUrl || "https://placehold.co/1000x600/1a1f2b/FFFFFF/png?text=No+Image"} 
                      alt={competition.title}
                    />
                    <button className="absolute top-4 left-4 bg-primary/80 hover:bg-primary p-2 rounded-full text-white">
                      <Expand className="h-4 w-4" />
                    </button>
                    <button className="absolute top-4 right-4 bg-background/80 hover:bg-background p-2 rounded-full text-white">
                      <Heart className="h-4 w-4" />
                    </button>
                    <div className="absolute top-0 left-0 w-24 h-24 bg-pink-500/80 blur-xl rounded-full -translate-x-1/2 -translate-y-1/2"></div>
                  </div>
                  <div className="absolute top-4 left-4 bg-white text-background text-sm font-bold px-3 py-1 rounded">
                    WIN NOW
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                    <h1 className="text-3xl font-bold text-foreground">{competition.title}</h1>
                    <div className="mt-2 md:mt-0 flex items-center">
                      <span className={`text-${competition.category === "family" ? "yellow" : competition.category === "appliances" ? "pink" : "green"}-400 font-bold text-xl`}>
                        {formatCurrency(competition.ticketPrice)}
                      </span>
                      <span className="text-muted-foreground text-sm ml-1">per ticket</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-4 mb-6">
                    <div className="bg-secondary rounded-lg p-3 flex-1 min-w-[120px]">
                      <div className="text-muted-foreground text-xs uppercase mb-1">DRAW DATE</div>
                      <div className="text-foreground font-medium flex items-center">
                        <i className="far fa-calendar-alt mr-2 text-primary"></i> {new Date(competition.drawDate).toLocaleDateString('en-GB', { 
                          day: '2-digit', 
                          month: 'short'
                        })}
                      </div>
                    </div>
                    <div className="bg-secondary rounded-lg p-3 flex-1 min-w-[120px]">
                      <div className="text-muted-foreground text-xs uppercase mb-1">PRIZE VALUE</div>
                      <div className="text-foreground font-medium flex items-center">
                        <i className="fas fa-tag mr-2 text-pink-400"></i> {formatCurrency(competition.prizeValue)}
                      </div>
                    </div>
                    <div className="bg-secondary rounded-lg p-3 flex-1 min-w-[120px]">
                      <div className="text-muted-foreground text-xs uppercase mb-1">MAX PER PERSON</div>
                      <div className="text-foreground font-medium flex items-center">
                        <i className="fas fa-ticket-alt mr-2 text-purple-500"></i> {competition.maxTicketsPerUser}
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
                  </div>
                  
                  <div className="border-t border-border pt-6 mb-6">
                    <h3 className="text-lg font-semibold text-foreground mb-3 inline-flex items-center">
                      <i className="fas fa-clipboard-list mr-2 text-primary"></i> Competition Details
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-secondary rounded-lg p-4">
                        <div className="text-muted-foreground text-sm mb-1">Total Entries</div>
                        <div className="text-foreground font-semibold text-lg">{competition.ticketsSold}</div>
                      </div>
                      <div className="bg-secondary rounded-lg p-4">
                        <div className="text-muted-foreground text-sm mb-1">Available Tickets</div>
                        <div className="text-foreground font-semibold text-lg">{remainingTickets} of {competition.totalTickets}</div>
                      </div>
                      <div className="bg-secondary rounded-lg p-4">
                        <div className="text-muted-foreground text-sm mb-1">Draw Date</div>
                        <div className="text-foreground font-semibold text-lg">{new Date(competition.drawDate).toLocaleDateString('en-GB', { 
                          day: '2-digit', 
                          month: 'short', 
                          year: 'numeric' 
                        })}</div>
                      </div>
                      <div className="bg-secondary rounded-lg p-4">
                        <div className="text-muted-foreground text-sm mb-1">Max Tickets Per User</div>
                        <div className="text-foreground font-semibold text-lg">{competition.maxTicketsPerUser}</div>
                      </div>
                    </div>
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
            
            {/* Right column */}
            <div className="w-full lg:w-1/3">
              <div className="bg-card rounded-lg overflow-hidden shadow-lg border border-border sticky top-20">
                <CountdownTimer drawDate={competition.drawDate} variant="detailed" />
                
                <div className="p-6">
                  <Button 
                    onClick={handleBuyTickets}
                    disabled={isProcessing}
                    className={cn(
                      "w-full py-3 mb-4 font-bold text-white shine-btn group relative overflow-hidden",
                      getCategoryThemeColor()
                    )}
                  >
                    <div className="absolute top-0 left-0 w-full h-full bg-white/20 transform -translate-x-full group-hover:translate-x-full transition-transform duration-500"></div>
                    <i className="fas fa-ticket-alt mr-2"></i> 
                    {isProcessing ? "Processing..." : "GET YOUR TICKETS"}
                  </Button>
                  
                  <div className="flex items-center justify-between mb-4">
                    <div className={`text-${competition.category === "family" ? "yellow" : competition.category === "appliances" ? "pink" : "green"}-400 text-2xl font-bold`}>
                      {formatCurrency(competition.ticketPrice)}
                    </div>
                    <div className="text-muted-foreground text-sm">per ticket</div>
                  </div>
                  
                  <div className="flex items-center justify-center space-x-4 mb-6">
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={decreaseQuantity}
                      disabled={ticketQuantity <= 1}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <div className="text-xl font-bold">{ticketQuantity}</div>
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={increaseQuantity}
                      disabled={ticketQuantity >= competition.maxTicketsPerUser}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-secondary rounded-lg p-3">
                      <div className="text-muted-foreground text-xs uppercase mb-1">Available</div>
                      <div className="text-foreground font-medium">{remainingTickets} / {competition.totalTickets}</div>
                    </div>
                    <div className="bg-secondary rounded-lg p-3">
                      <div className="text-muted-foreground text-xs uppercase mb-1">Max per user</div>
                      <div className="text-foreground font-medium">{competition.maxTicketsPerUser}</div>
                    </div>
                  </div>
                  
                  <div className="text-center mb-6">
                    <div className="text-muted-foreground text-sm">
                      <ShieldCheck className="h-4 w-4 inline mr-1 text-green-500" /> Secure payment via Stripe
                    </div>
                  </div>
                  
                  <Button 
                    onClick={handleBuyTickets}
                    disabled={isProcessing}
                    className={cn(
                      "w-full py-3 font-bold text-white shine-btn group relative overflow-hidden",
                      getCategoryThemeColor()
                    )}
                  >
                    <div className="absolute top-0 left-0 w-full h-full bg-white/20 transform -translate-x-full group-hover:translate-x-full transition-transform duration-500"></div>
                    {isProcessing ? "Processing..." : "GET TICKETS NOW"}
                  </Button>
                  
                  <div className="text-center mt-2 text-muted-foreground text-xs">
                    Max {competition.maxTicketsPerUser} tickets per person
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
  );
}
