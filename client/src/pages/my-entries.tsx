import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/layout/layout";
import { useAuth } from "@/hooks/use-auth";
import { Link, useLocation } from "wouter";
import { 
  Button, Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter,
  Tabs, TabsContent, TabsList, TabsTrigger 
} from "@/components/ui/index";
import { CountdownTimer } from "@/components/competition/countdown-timer";
import { formatCurrency } from "@/lib/utils";
import { CategoryBadge } from "@/components/competition/category-badge";
import { 
  Ticket, ChevronRight, AlertCircle, Trophy, X, 
  Clock, Calendar, ClipboardList 
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

type EntryWithCompetition = {
  id: number;
  userId: number;
  competitionId: number;
  ticketCount: number;
  paymentStatus: string;
  stripePaymentId?: string;
  createdAt: string;
  competition: {
    id: number;
    title: string;
    description: string;
    imageUrl?: string;
    category: string;
    prizeValue: number;
    ticketPrice: number;
    maxTicketsPerUser: number;
    totalTickets: number;
    ticketsSold: number;
    brand?: string;
    drawDate: string;
    isLive: boolean;
    isFeatured: boolean;
    createdAt: string;
  };
};

export default function MyEntries() {
  const [location, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      navigate("/auth");
    }
  }, [user, navigate]);
  
  // Fetch user entries
  const { data: entries, isLoading, error } = useQuery<EntryWithCompetition[]>({
    queryKey: ["/api/entries"],
    queryFn: async () => {
      const res = await fetch("/api/entries");
      if (!res.ok) throw new Error("Failed to fetch entries");
      return res.json();
    },
    enabled: !!user
  });
  
  // Display error toast if fetch fails
  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: "Failed to load your entries. Please try again.",
        variant: "destructive"
      });
    }
  }, [error, toast]);
  
  // Filter entries by status
  const activeEntries = entries?.filter(entry => 
    new Date(entry.competition.drawDate) > new Date() && 
    entry.competition.isLive && 
    entry.paymentStatus === "completed"
  ) || [];
  
  const pastEntries = entries?.filter(entry => 
    new Date(entry.competition.drawDate) <= new Date() || 
    !entry.competition.isLive
  ) || [];
  
  const pendingEntries = entries?.filter(entry => 
    entry.paymentStatus !== "completed" && 
    new Date(entry.competition.drawDate) > new Date()
  ) || [];
  
  if (!user) {
    return <div className="min-h-screen flex items-center justify-center">Redirecting to login...</div>;
  }

  return (
      <section className="py-16 bg-background flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-block mb-2">
              <ClipboardList className="h-10 w-10 text-primary mx-auto mb-2" />
            </div>
            <h1 className="text-3xl font-bold mb-2">My Entries</h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Track all your active, pending, and past competition entries
            </p>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center my-12">
              <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : (
            <>
              {entries && entries.length > 0 ? (
                <Tabs defaultValue="active" className="w-full">
                  <TabsList className="grid w-full grid-cols-3 mb-8">
                    <TabsTrigger value="active" className="relative">
                      Active
                      <span className="ml-2 px-1.5 py-0.5 text-xs bg-primary/20 text-primary rounded-full">
                        {activeEntries.length}
                      </span>
                    </TabsTrigger>
                    <TabsTrigger value="pending">
                      Pending
                      <span className="ml-2 px-1.5 py-0.5 text-xs bg-orange-500/20 text-orange-500 rounded-full">
                        {pendingEntries.length}
                      </span>
                    </TabsTrigger>
                    <TabsTrigger value="past">
                      Past
                      <span className="ml-2 px-1.5 py-0.5 text-xs bg-muted/60 text-muted-foreground rounded-full">
                        {pastEntries.length}
                      </span>
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="active">
                    {activeEntries.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {activeEntries.map((entry) => (
                          <EntryCard key={entry.id} entry={entry} status="active" />
                        ))}
                      </div>
                    ) : (
                      <EmptyState 
                        title="No Active Entries"
                        description="You don't have any active competition entries at the moment."
                        actionText="Browse Competitions"
                        actionLink="/competitions"
                      />
                    )}
                  </TabsContent>
                  
                  <TabsContent value="pending">
                    {pendingEntries.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {pendingEntries.map((entry) => (
                          <EntryCard key={entry.id} entry={entry} status="pending" />
                        ))}
                      </div>
                    ) : (
                      <EmptyState 
                        title="No Pending Entries"
                        description="You don't have any pending competition entries."
                        actionText="Browse Competitions"
                        actionLink="/competitions"
                      />
                    )}
                  </TabsContent>
                  
                  <TabsContent value="past">
                    {pastEntries.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {pastEntries.map((entry) => (
                          <EntryCard key={entry.id} entry={entry} status="past" />
                        ))}
                      </div>
                    ) : (
                      <EmptyState 
                        title="No Past Entries"
                        description="You don't have any past competition entries."
                        actionText="Browse Competitions"
                        actionLink="/competitions"
                      />
                    )}
                  </TabsContent>
                </Tabs>
              ) : (
                <EmptyState 
                  title="No Entries Found"
                  description="You haven't entered any competitions yet. Start browsing our exciting competitions and join the fun!"
                  actionText="Browse Competitions"
                  actionLink="/competitions"
                  icon={<Ticket className="h-12 w-12 text-primary mb-4" />}
                />
              )}
            </>
          )}
          
          <div className="mt-12 text-center">
            <h2 className="text-2xl font-bold mb-4">Ready for More Chances to Win?</h2>
            <p className="text-muted-foreground mb-6">
              Explore our latest competitions and increase your chances of winning amazing prizes!
            </p>
            <Link href="/competitions">
              <Button size="lg" className="shine-btn group relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full bg-white/20 transform -translate-x-full group-hover:translate-x-full transition-transform duration-500"></div>
                Browse More Competitions <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
  );
}

// Entry card component
function EntryCard({ entry, status }: { entry: EntryWithCompetition, status: 'active' | 'pending' | 'past' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className={`overflow-hidden h-full flex flex-col ${status === 'past' ? 'opacity-80' : ''}`}>
        <div className="relative h-40">
          <img 
            src={entry.competition.imageUrl || "https://placehold.co/400x200/1a1f2b/FFFFFF/png?text=No+Image"} 
            alt={entry.competition.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-transparent to-background/80"></div>
          
          <div className="absolute top-2 left-2">
            <CategoryBadge 
              category={entry.competition.category} 
              brand={entry.competition.brand}
            />
          </div>
          
          {status === 'pending' && (
            <div className="absolute top-2 right-2 bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded">
              PAYMENT PENDING
            </div>
          )}
          
          {status === 'past' && (
            <div className="absolute top-2 right-2 bg-gray-500 text-white text-xs font-bold px-2 py-1 rounded">
              COMPLETED
            </div>
          )}
          
          {status === 'active' && (
            <div className="absolute bottom-2 right-2 text-xs">
              <div className="flex items-center space-x-1 bg-background/80 text-primary rounded px-2 py-1">
                <Clock className="h-3 w-3" />
                <span>Ends {new Date(entry.competition.drawDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</span>
              </div>
            </div>
          )}
        </div>
        
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">{entry.competition.title}</CardTitle>
          <CardDescription className="flex items-center justify-between">
            <span>
              <Ticket className="h-4 w-4 inline mr-1" /> {entry.ticketCount} ticket{entry.ticketCount > 1 ? 's' : ''}
            </span>
            <span className="text-primary font-medium">
              {formatCurrency(entry.competition.ticketPrice * entry.ticketCount)}
            </span>
          </CardDescription>
        </CardHeader>
        
        <CardContent className="pb-2 flex-grow">
          {status === 'active' && (
            <div className="mb-2">
              <p className="text-xs text-muted-foreground mb-1">Time Remaining:</p>
              <CountdownTimer drawDate={entry.competition.drawDate} variant="compact" />
            </div>
          )}
          
          {status === 'past' && (
            <div className="flex items-center text-muted-foreground text-sm">
              <Calendar className="h-4 w-4 mr-1" />
              <span>Draw Date: {new Date(entry.competition.drawDate).toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
              })}</span>
            </div>
          )}
          
          {status === 'pending' && (
            <div className="text-orange-500 text-sm flex items-center">
              <AlertCircle className="h-4 w-4 mr-1" />
              <span>Payment completion required</span>
            </div>
          )}
        </CardContent>
        
        <CardFooter>
          <Link href={`/competitions/${entry.competition.id}`} className="w-full">
            <Button
              variant={status === 'past' ? "outline" : "default"}
              className="w-full"
            >
              {status === 'active' && (
                <>View Competition <ChevronRight className="ml-2 h-4 w-4" /></>
              )}
              {status === 'pending' && (
                <>Complete Payment <ChevronRight className="ml-2 h-4 w-4" /></>
              )}
              {status === 'past' && (
                <>View Details <ChevronRight className="ml-2 h-4 w-4" /></>
              )}
            </Button>
          </Link>
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
      {icon || <ClipboardList className="h-12 w-12 text-muted-foreground mx-auto mb-4" />}
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
