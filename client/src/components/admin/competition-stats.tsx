import { useState } from "react";
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
  
  // Fetch ticket statistics
  const { data: stats, isLoading, error } = useQuery<TicketStats>({
    queryKey: ['/api/competitions', competition.id, 'ticket-stats'],
    enabled: !!competition.id,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="flex flex-col items-center justify-center h-48">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <p className="text-muted-foreground text-center">
          Could not load ticket statistics
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          {error instanceof Error ? error.message : "Unknown error"}
        </p>
      </div>
    );
  }

  // Calculate percentages for visualization
  const purchasedPercentage = (stats.purchasedTickets / stats.totalTickets) * 100;
  const inCartPercentage = (stats.inCartTickets / stats.totalTickets) * 100;
  const availablePercentage = (stats.availableTickets / stats.totalTickets) * 100;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Ticket Status Overview</CardTitle>
          <CardDescription>
            Current status of all tickets for this competition
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatCard 
              icon={<TicketIcon />} 
              title="Total Tickets" 
              value={stats.totalTickets.toString()}
              color="bg-gray-100"
            />
            <StatCard 
              icon={<CheckCircle2 />} 
              title="Purchased" 
              value={stats.purchasedTickets.toString()}
              color="bg-green-100"
            />
            <StatCard 
              icon={<ShoppingCart />} 
              title="In Cart" 
              value={stats.inCartTickets.toString()}
              color="bg-blue-100"
            />
            <StatCard 
              icon={<TicketIcon />} 
              title="Available" 
              value={stats.availableTickets.toString()}
              color="bg-amber-100"
            />
          </div>

          {/* Progress Bars */}
          <div className="space-y-3 mt-6">
            <h3 className="text-sm font-medium">Ticket Distribution</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span>Purchased</span>
                <span>{purchasedPercentage.toFixed(1)}%</span>
              </div>
              <Progress value={purchasedPercentage} className="h-2 bg-gray-100" indicatorClassName="bg-green-500" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span>In Cart (Reserved)</span>
                <span>{inCartPercentage.toFixed(1)}%</span>
              </div>
              <Progress value={inCartPercentage} className="h-2 bg-gray-100" indicatorClassName="bg-blue-500" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span>Available</span>
                <span>{availablePercentage.toFixed(1)}%</span>
              </div>
              <Progress value={availablePercentage} className="h-2 bg-gray-100" indicatorClassName="bg-amber-500" />
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            variant="outline" 
            onClick={() => setShowNumberGrid(!showNumberGrid)}
            className="w-full"
          >
            {showNumberGrid ? "Hide" : "Show"} Ticket Number Grid
          </Button>
        </CardFooter>
      </Card>

      {showNumberGrid && (
        <Card>
          <CardHeader>
            <CardTitle>Ticket Number Status</CardTitle>
            <CardDescription>
              View the status of individual ticket numbers
            </CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <div className="grid grid-cols-10 gap-2 md:grid-cols-20">
              {stats.allNumbers.totalRange.map((number) => {
                const isPurchased = stats.allNumbers.purchased.includes(number);
                const isInCart = stats.allNumbers.inCart.includes(number);
                
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