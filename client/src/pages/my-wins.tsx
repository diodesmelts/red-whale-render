import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/layout/layout";
import { useAuth } from "@/hooks/use-auth";
import { Link, useLocation } from "wouter";
import { 
  Button, Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter,
  Tabs, TabsContent, TabsList, TabsTrigger 
} from "@/components/ui/index";
import { CategoryBadge } from "@/components/competition/category-badge";
import { 
  Ticket, ChevronRight, Award, Check, 
  Calendar, Clock, Package, Trophy, ArrowDownToLine
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { formatCurrency } from "@/lib/utils";

type WinnerWithCompetition = {
  id: number;
  userId: number;
  competitionId: number;
  entryId: number;
  announcedAt: string;
  claimStatus: 'pending' | 'claimed' | 'expired';
  competition: {
    id: number;
    title: string;
    description: string;
    imageUrl?: string;
    category: string;
    prizeValue: number;
    ticketPrice: number;
    brand?: string;
    drawDate: string;
    isLive: boolean;
  };
};

export default function MyWins() {
  const [location, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      navigate("/auth");
    }
  }, [user, navigate]);
  
  // Fetch user wins
  const { data: wins, isLoading, error } = useQuery<WinnerWithCompetition[]>({
    queryKey: ["/api/winners"],
    queryFn: async () => {
      const res = await fetch("/api/winners");
      if (!res.ok) throw new Error("Failed to fetch wins");
      return res.json();
    },
    enabled: !!user
  });
  
  // Display error toast if fetch fails
  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: "Failed to load your wins. Please try again.",
        variant: "destructive"
      });
    }
  }, [error, toast]);
  
  // Filter wins by claim status
  const pendingClaims = wins?.filter(win => win.claimStatus === "pending") || [];
  const claimedPrizes = wins?.filter(win => win.claimStatus === "claimed") || [];
  const expiredClaims = wins?.filter(win => win.claimStatus === "expired") || [];
  
  // Handle claiming a prize
  const handleClaim = (winId: number) => {
    toast({
      title: "Prize Claim Initiated",
      description: "We'll contact you shortly with next steps to deliver your prize!",
    });
    // In a real application, this would trigger a backend API call to update the claim status
  };
  
  if (!user) {
    return <div className="min-h-screen flex items-center justify-center">Redirecting to login...</div>;
  }

  return (
      <section className="py-16 bg-background flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-block mb-2">
              <Trophy className="h-10 w-10 text-orange-500 mx-auto mb-2" />
            </div>
            <h1 className="text-3xl font-bold mb-2">My Wins</h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Celebrate your victories and claim your prizes
            </p>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center my-12">
              <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : (
            <>
              {wins && wins.length > 0 ? (
                <Tabs defaultValue="pending" className="w-full">
                  <TabsList className="grid w-full grid-cols-3 mb-8">
                    <TabsTrigger value="pending" className="relative">
                      To Claim
                      <span className="ml-2 px-1.5 py-0.5 text-xs bg-orange-500/20 text-orange-500 rounded-full">
                        {pendingClaims.length}
                      </span>
                    </TabsTrigger>
                    <TabsTrigger value="claimed">
                      Claimed
                      <span className="ml-2 px-1.5 py-0.5 text-xs bg-green-500/20 text-green-500 rounded-full">
                        {claimedPrizes.length}
                      </span>
                    </TabsTrigger>
                    <TabsTrigger value="expired">
                      Expired
                      <span className="ml-2 px-1.5 py-0.5 text-xs bg-muted/60 text-muted-foreground rounded-full">
                        {expiredClaims.length}
                      </span>
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="pending">
                    {pendingClaims.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {pendingClaims.map((win) => (
                          <WinCard 
                            key={win.id} 
                            win={win} 
                            status="pending"
                            onClaim={() => handleClaim(win.id)}
                          />
                        ))}
                      </div>
                    ) : (
                      <EmptyState 
                        title="No Prizes to Claim"
                        description="You don't have any unclaimed prizes at the moment."
                        actionText="Browse Competitions"
                        actionLink="/competitions"
                      />
                    )}
                  </TabsContent>
                  
                  <TabsContent value="claimed">
                    {claimedPrizes.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {claimedPrizes.map((win) => (
                          <WinCard key={win.id} win={win} status="claimed" />
                        ))}
                      </div>
                    ) : (
                      <EmptyState 
                        title="No Claimed Prizes"
                        description="You haven't claimed any prizes yet."
                        actionText="Browse Competitions"
                        actionLink="/competitions"
                      />
                    )}
                  </TabsContent>
                  
                  <TabsContent value="expired">
                    {expiredClaims.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {expiredClaims.map((win) => (
                          <WinCard key={win.id} win={win} status="expired" />
                        ))}
                      </div>
                    ) : (
                      <EmptyState 
                        title="No Expired Claims"
                        description="You don't have any expired prize claims."
                        actionText="Browse Competitions"
                        actionLink="/competitions"
                      />
                    )}
                  </TabsContent>
                </Tabs>
              ) : (
                <EmptyState 
                  title="No Wins Yet"
                  description="You haven't won any competitions yet. Keep entering for your chance to win amazing prizes!"
                  actionText="Browse Competitions"
                  actionLink="/competitions"
                  icon={<Award className="h-12 w-12 text-orange-500 mx-auto mb-4" />}
                />
              )}
            </>
          )}
          
          <div className="mt-12 text-center">
            <h2 className="text-2xl font-bold mb-4">Want to Win More Prizes?</h2>
            <p className="text-muted-foreground mb-6">
              Explore our latest competitions and increase your chances of winning!
            </p>
            <Link href="/competitions">
              <Button size="lg" className="shine-btn group relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full bg-white/20 transform -translate-x-full group-hover:translate-x-full transition-transform duration-500"></div>
                Browse Competitions <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
  );
}

// Win card component
function WinCard({ 
  win, 
  status,
  onClaim 
}: { 
  win: WinnerWithCompetition; 
  status: 'pending' | 'claimed' | 'expired';
  onClaim?: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className={`overflow-hidden h-full flex flex-col ${status === 'expired' ? 'opacity-70' : ''}`}>
        <div className="relative h-40">
          <img 
            src={win.competition.imageUrl || "https://placehold.co/400x200/1a1f2b/FFFFFF/png?text=No+Image"} 
            alt={win.competition.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-transparent to-background/80"></div>
          
          <div className="absolute top-2 left-2">
            <CategoryBadge 
              category={win.competition.category} 
              brand={win.competition.brand}
            />
          </div>
          
          {status === 'pending' && (
            <div className="absolute top-2 right-2 bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded animate-pulse">
              CLAIM NOW
            </div>
          )}
          
          {status === 'claimed' && (
            <div className="absolute top-2 right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded">
              CLAIMED
            </div>
          )}
          
          {status === 'expired' && (
            <div className="absolute top-2 right-2 bg-gray-500 text-white text-xs font-bold px-2 py-1 rounded">
              EXPIRED
            </div>
          )}
          
          <div className="absolute bottom-2 left-2 right-2 flex justify-between">
            <div className="text-xs bg-primary text-white rounded px-2 py-1 font-semibold">
              WINNER!
            </div>
            <div className="text-xs bg-background/80 text-primary rounded px-2 py-1">
              Value: {formatCurrency(win.competition.prizeValue)}
            </div>
          </div>
        </div>
        
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">{win.competition.title}</CardTitle>
          <CardDescription className="flex items-center justify-between">
            <span className="flex items-center">
              <Trophy className="h-4 w-4 mr-1 text-orange-500" /> 
              <span>You won!</span>
            </span>
            <span className="text-muted-foreground text-xs">
              <Calendar className="h-3 w-3 inline mr-1" />
              {new Date(win.announcedAt).toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
              })}
            </span>
          </CardDescription>
        </CardHeader>
        
        <CardContent className="pb-2 flex-grow">
          {status === 'pending' && (
            <div className="mb-2">
              <p className="text-sm text-orange-500 flex items-center mb-1">
                <Clock className="h-4 w-4 mr-1" />
                <span>Claim within 14 days</span>
              </p>
              <p className="text-xs text-muted-foreground">
                You need to claim this prize before it expires. Once claimed, we'll arrange delivery.
              </p>
            </div>
          )}
          
          {status === 'claimed' && (
            <div className="mb-2">
              <p className="text-sm text-green-500 flex items-center mb-1">
                <Check className="h-4 w-4 mr-1" />
                <span>Prize claimed successfully!</span>
              </p>
              <p className="text-xs text-muted-foreground">
                Your prize has been claimed and is being processed for delivery.
              </p>
            </div>
          )}
          
          {status === 'expired' && (
            <div className="mb-2">
              <p className="text-sm text-red-500 flex items-center mb-1">
                <Clock className="h-4 w-4 mr-1" />
                <span>Claim period expired</span>
              </p>
              <p className="text-xs text-muted-foreground">
                The claim period for this prize has expired. Please ensure to claim future wins promptly.
              </p>
            </div>
          )}
        </CardContent>
        
        <CardFooter>
          {status === 'pending' && (
            <Button
              onClick={onClaim}
              className="w-full bg-orange-500 hover:bg-orange-600 shine-btn group relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-full bg-white/20 transform -translate-x-full group-hover:translate-x-full transition-transform duration-500"></div>
              <Package className="mr-2 h-4 w-4" /> Claim Your Prize
            </Button>
          )}
          
          {status === 'claimed' && (
            <Button
              variant="outline"
              className="w-full border-green-500 text-green-500"
            >
              <Check className="mr-2 h-4 w-4" /> Already Claimed
            </Button>
          )}
          
          {status === 'expired' && (
            <Button
              variant="outline"
              className="w-full"
              disabled
            >
              Claim Period Expired
            </Button>
          )}
        </CardFooter>
      </Card>
    </motion.div>
  );
}

// Empty state component
function EmptyState({ 
  title, 
  description, 
  actionText, 
  actionLink,
  icon
}: { 
  title: string; 
  description: string; 
  actionText: string; 
  actionLink: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="text-center py-16 px-4 bg-card rounded-lg border border-border">
      {icon || <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />}
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-muted-foreground mb-6 max-w-md mx-auto">{description}</p>
      <Link href={actionLink}>
        <Button>
          {actionText} <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </Link>
    </div>
  );
}
