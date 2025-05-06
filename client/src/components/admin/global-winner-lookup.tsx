import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { User } from "@shared/schema";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { 
  Loader2, 
  Search, 
  Trophy, 
  Mail, 
  User as UserIcon, 
  Phone, 
  Hash 
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface TicketOwner {
  ticketNumber: number;
  userId: number;
  userDetails: User;
  competitionId: number;
  competitionTitle: string;
  purchaseDate: string;
}

export function GlobalWinnerLookup() {
  const [competitionId, setCompetitionId] = useState<string>("");
  const [ticketNumber, setTicketNumber] = useState<string>("");
  const { toast } = useToast();
  
  // Get competitions for the dropdown
  const { data: competitions, isLoading: isLoadingCompetitions } = useQuery({
    queryKey: ['/api/competitions'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/competitions');
      return res.json();
    },
  });
  
  const lookupMutation = useMutation({
    mutationFn: async ({ compId, ticketNum }: { compId: number, ticketNum: number }) => {
      const res = await apiRequest(
        'GET',
        `/api/admin/competitions/${compId}/ticket/${ticketNum}`
      );
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to lookup ticket");
      }
      
      const ticketData = await res.json();
      
      // Add competition title
      const competition = competitions?.find(c => c.id === compId);
      
      return {
        ...ticketData,
        competitionId: compId,
        competitionTitle: competition?.title || `Competition #${compId}`
      };
    },
    onError: (error) => {
      toast({
        title: "Lookup Failed",
        description: error instanceof Error ? error.message : "Could not find ticket owner",
        variant: "destructive",
      });
    }
  });

  const handleLookup = () => {
    if (!competitionId || !ticketNumber || 
        isNaN(Number(competitionId)) || isNaN(Number(ticketNumber))) {
      toast({
        title: "Invalid Input",
        description: "Please select a competition and enter a valid ticket number",
        variant: "destructive",
      });
      return;
    }
    
    const compId = parseInt(competitionId, 10);
    const ticketNum = parseInt(ticketNumber, 10);
    
    // Check if the competition exists
    const competition = competitions?.find(c => c.id === compId);
    if (!competition) {
      toast({
        title: "Invalid Competition",
        description: "The selected competition does not exist",
        variant: "destructive",
      });
      return;
    }
    
    // Check ticket number range
    if (ticketNum < 1 || ticketNum > competition.totalTickets) {
      toast({
        title: "Out of Range",
        description: `Ticket number must be between 1 and ${competition.totalTickets}`,
        variant: "destructive",
      });
      return;
    }
    
    lookupMutation.mutate({ compId, ticketNum });
  };
  
  const isLoading = isLoadingCompetitions || lookupMutation.isPending;

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="text-2xl flex items-center">
          <Trophy className="mr-2 h-6 w-6 text-amber-500" />
          Winner Lookup
        </CardTitle>
        <CardDescription>
          Find ticket owners across all competitions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="competition-id">Competition</Label>
            <Select
              disabled={isLoading}
              value={competitionId}
              onValueChange={setCompetitionId}
            >
              <SelectTrigger id="competition-id">
                <SelectValue placeholder="Select a competition" />
              </SelectTrigger>
              <SelectContent>
                {competitions?.map(competition => (
                  <SelectItem 
                    key={competition.id} 
                    value={competition.id.toString()}
                    className="cursor-pointer"
                  >
                    <div className="flex items-center justify-between w-full gap-2">
                      <span className="truncate">{competition.title}</span>
                      <Badge variant="outline" className="ml-auto">
                        ID: {competition.id}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="ticket-number">Ticket Number</Label>
            <Input
              id="ticket-number"
              placeholder="Enter ticket number"
              value={ticketNumber}
              onChange={(e) => setTicketNumber(e.target.value)}
              type="number"
              min={1}
              disabled={isLoading || !competitionId}
            />
          </div>
          
          <div className="flex items-end">
            <Button 
              onClick={handleLookup} 
              disabled={isLoading || !competitionId || !ticketNumber}
              className="w-full"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Search className="h-4 w-4 mr-2" />
              )}
              Find Ticket Owner
            </Button>
          </div>
        </div>
        
        {lookupMutation.data && (
          <div className="mt-6 border rounded-lg p-4 bg-muted/30">
            <h3 className="text-lg font-semibold flex items-center mb-4">
              <Trophy className="mr-2 h-5 w-5 text-amber-500" />
              Ticket Owner Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    <UserIcon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Name/Username</p>
                    <p className="font-medium">{lookupMutation.data.userDetails.name || lookupMutation.data.userDetails.username}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Email</p>
                    <p className="font-medium">{lookupMutation.data.userDetails.email}</p>
                  </div>
                </div>
                
                {lookupMutation.data.userDetails.phone && (
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      <Phone className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Phone</p>
                      <p className="font-medium">{lookupMutation.data.userDetails.phone}</p>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    <Hash className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Ticket Number</p>
                    <p className="font-medium">#{lookupMutation.data.ticketNumber}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    <Trophy className="h-5 w-5 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Competition</p>
                    <div className="flex items-center">
                      <p className="font-medium">{lookupMutation.data.competitionTitle}</p>
                      <Badge variant="outline" className="ml-2">
                        ID: {lookupMutation.data.competitionId}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    <Loader2 className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Purchase Date</p>
                    <p className="font-medium">{new Date(lookupMutation.data.purchaseDate).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground">
        Only purchased tickets can be looked up. Tickets in cart are not yet assigned to users.
      </CardFooter>
    </Card>
  );
}