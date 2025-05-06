import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Competition, User } from "@shared/schema";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, Search, Trophy, Mail, User as UserIcon, Phone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface WinnerLookupProps {
  competition: Competition;
}

interface TicketOwner {
  ticketNumber: number;
  userId: number;
  userDetails: User;
  purchaseDate: string;
}

export function WinnerLookup({ competition }: WinnerLookupProps) {
  const [ticketNumber, setTicketNumber] = useState<string>("");
  const { toast } = useToast();
  
  const lookupMutation = useMutation({
    mutationFn: async (ticketNum: number) => {
      const res = await apiRequest(
        'GET',
        `/api/admin/competitions/${competition.id}/ticket/${ticketNum}`
      );
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to lookup ticket");
      }
      
      return res.json();
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
    if (!ticketNumber || isNaN(Number(ticketNumber))) {
      toast({
        title: "Invalid Input",
        description: "Please enter a valid ticket number",
        variant: "destructive",
      });
      return;
    }
    
    const ticketNum = parseInt(ticketNumber, 10);
    if (ticketNum < 1 || ticketNum > competition.totalTickets) {
      toast({
        title: "Out of Range",
        description: `Ticket number must be between 1 and ${competition.totalTickets}`,
        variant: "destructive",
      });
      return;
    }
    
    lookupMutation.mutate(ticketNum);
  };
  
  // Query all entries for this competition to have local data
  const { data: allEntries, isLoading: isLoadingEntries } = useQuery({
    queryKey: ['/api/admin/entries', competition.id],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/admin/entries?competitionId=${competition.id}`);
      return res.json();
    },
  });
  
  // Query all users to match with entries
  const { data: allUsers, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['/api/admin/users'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/admin/users');
      return res.json();
    },
  });
  
  // If we already have the data locally, find the ticket owner without an API call
  const findLocalTicketOwner = (ticketNum: number): TicketOwner | null => {
    if (!allEntries || !allUsers) return null;
    
    const entry = allEntries.find(entry => 
      entry.competitionId === competition.id && 
      entry.selectedNumbers.includes(ticketNum)
    );
    
    if (!entry) return null;
    
    const user = allUsers.find(user => user.id === entry.userId);
    if (!user) return null;
    
    return {
      ticketNumber: ticketNum,
      userId: user.id,
      userDetails: user,
      purchaseDate: entry.createdAt
    };
  };
  
  const handleLocalLookup = () => {
    if (!ticketNumber || isNaN(Number(ticketNumber))) {
      toast({
        title: "Invalid Input",
        description: "Please enter a valid ticket number",
        variant: "destructive",
      });
      return;
    }
    
    const ticketNum = parseInt(ticketNumber, 10);
    if (ticketNum < 1 || ticketNum > competition.totalTickets) {
      toast({
        title: "Out of Range",
        description: `Ticket number must be between 1 and ${competition.totalTickets}`,
        variant: "destructive",
      });
      return;
    }
    
    const owner = findLocalTicketOwner(ticketNum);
    if (owner) {
      lookupMutation.data = owner;
    } else {
      lookupMutation.mutate(ticketNum);
    }
  };
  
  const isLoading = isLoadingEntries || isLoadingUsers || lookupMutation.isPending;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Trophy className="mr-2 h-5 w-5 text-amber-500" />
          Winner Lookup
        </CardTitle>
        <CardDescription>
          Find the owner of any ticket number for this competition
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ticket-number">Enter Ticket Number</Label>
            <div className="flex gap-2">
              <Input
                id="ticket-number"
                placeholder={`Enter a number (1-${competition.totalTickets})`}
                value={ticketNumber}
                onChange={(e) => setTicketNumber(e.target.value)}
                type="number"
                min={1}
                max={competition.totalTickets}
                disabled={isLoading}
              />
              <Button 
                onClick={handleLocalLookup} 
                disabled={isLoading}
                variant="secondary"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Search className="h-4 w-4 mr-2" />
                )}
                Lookup
              </Button>
            </div>
          </div>
          
          {lookupMutation.data && (
            <div className="mt-4 border rounded-lg p-4 bg-muted/50">
              <h3 className="text-base font-semibold flex items-center mb-3">
                <Trophy className="mr-2 h-5 w-5 text-amber-500" />
                Ticket Owner Information
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <div className="w-8 flex justify-center mt-1">
                    <UserIcon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Name/Username</p>
                    <p className="text-sm">{lookupMutation.data.userDetails.name || lookupMutation.data.userDetails.username}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-2">
                  <div className="w-8 flex justify-center mt-1">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Email</p>
                    <p className="text-sm">{lookupMutation.data.userDetails.email}</p>
                  </div>
                </div>
                
                {lookupMutation.data.userDetails.phone && (
                  <div className="flex items-start gap-2">
                    <div className="w-8 flex justify-center mt-1">
                      <Phone className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Phone</p>
                      <p className="text-sm">{lookupMutation.data.userDetails.phone}</p>
                    </div>
                  </div>
                )}
                
                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground">
                    Ticket #{lookupMutation.data.ticketNumber} purchased on{" "}
                    {new Date(lookupMutation.data.purchaseDate).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground">
        Only purchased tickets can be looked up. Tickets in cart are not yet assigned to users.
      </CardFooter>
    </Card>
  );
}