import { useState } from "react";
import { useLocation, useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/admin-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { FormControl, FormField, FormItem, FormLabel, FormMessage, Form } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Search, User, AlertTriangle, ExternalLink, CalendarIcon, TicketIcon, MailIcon, PhoneIcon } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

// Schema for the ticket lookup form
const ticketLookupSchema = z.object({
  ticketNumber: z.string()
    .min(1, { message: "Ticket number is required" })
    .refine((val) => !isNaN(Number(val)), { message: "Ticket number must be numeric" })
});

type TicketLookupFormValues = z.infer<typeof ticketLookupSchema>;

// User information response format
interface TicketOwnerResponse {
  ticketNumber: number;
  ticketStatus: string;
  userId: number;
  userDetails: {
    id: number;
    username: string;
    email: string;
    fullName?: string | null;
    phone?: string | null;
    displayName?: string | null;
  };
  purchaseDate?: string | null;
}

export default function TicketLookupPage() {
  const [params, setParams] = useLocation();
  const { competitionId } = useParams<{ competitionId: string }>();

  // Form setup
  const form = useForm<TicketLookupFormValues>({
    resolver: zodResolver(ticketLookupSchema),
    defaultValues: {
      ticketNumber: "",
    },
  });

  const [submittedTicket, setSubmittedTicket] = useState<number | null>(null);
  const { toast } = useToast();

  // Fetch competition details
  const { data: competition, isLoading: competitionLoading } = useQuery({
    queryKey: ['/api/competitions', Number(competitionId)],
    queryFn: async () => {
      const response = await apiRequest(
        "GET", 
        `/api/competitions/${competitionId}`,
      );
      return response.json();
    },
    enabled: !!competitionId,
  });

  // Query to fetch ticket owner
  const {
    data: ticketOwner,
    isLoading: isLoadingTicket,
    error: ticketError,
    isError: isTicketError,
  } = useQuery<TicketOwnerResponse>({
    queryKey: ['/api/admin/competitions', Number(competitionId), 'ticket', submittedTicket],
    queryFn: async () => {
      if (!submittedTicket) throw new Error("No ticket number provided");
      const response = await apiRequest(
        "GET", 
        `/api/admin/competitions/${competitionId}/ticket/${submittedTicket}`
      );
      return response.json();
    },
    enabled: !!submittedTicket && !!competitionId,
    retry: false,
  });

  // Form submission handler
  const onSubmit = (data: TicketLookupFormValues) => {
    const ticketNum = parseInt(data.ticketNumber);
    setSubmittedTicket(ticketNum);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold">Ticket Lookup</h1>
          {competitionLoading ? (
            <div className="text-muted-foreground">Loading competition details...</div>
          ) : (
            <h2 className="text-xl text-muted-foreground flex items-center gap-2">
              {competition?.title || "Competition"} 
              {competition && (
                <span className="text-sm bg-primary/10 text-primary px-2 py-1 rounded-md">
                  ID: {competitionId}
                </span>
              )}
            </h2>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Find Ticket Owner</CardTitle>
            <CardDescription>
              Enter a ticket number to see which user purchased it
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <FormField
                      control={form.control}
                      name="ticketNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ticket Number</FormLabel>
                          <FormControl>
                            <Input
                              type="text"
                              placeholder="Enter ticket number"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      type="submit"
                      disabled={isLoadingTicket}
                      className="gap-2"
                    >
                      {isLoadingTicket ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Searching...
                        </>
                      ) : (
                        <>
                          <Search className="h-4 w-4" />
                          Search
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </form>
            </Form>

            {/* Results or error display */}
            <div className="mt-6">
              {isTicketError && (
                <Alert variant="destructive" className="mb-4">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>
                    {ticketError instanceof Error
                      ? ticketError.message
                      : "Failed to lookup ticket owner. The ticket may not exist or not be purchased yet."}
                  </AlertDescription>
                </Alert>
              )}

              {ticketOwner && (
                <div className="border rounded-lg p-6 space-y-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="bg-primary/10 p-3 rounded-full">
                      <User className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">
                        Ticket Owner Details
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        For ticket #{ticketOwner.ticketNumber}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-1">
                        User ID
                      </h4>
                      <p className="font-medium">{ticketOwner.userId}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-1">
                        Username
                      </h4>
                      <p className="font-medium">{ticketOwner.userDetails.username}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1">
                        <MailIcon className="h-3 w-3" /> Email
                      </h4>
                      <p className="font-medium break-all">{ticketOwner.userDetails.email}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1">
                        <PhoneIcon className="h-3 w-3" /> Phone
                      </h4>
                      <p className="font-medium">
                        {ticketOwner.userDetails.phone || "Not provided"}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-1">
                        Full Name
                      </h4>
                      <p className="font-medium">
                        {ticketOwner.userDetails.fullName || 
                         ticketOwner.userDetails.displayName || 
                         "Not provided"}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1">
                        <CalendarIcon className="h-3 w-3" /> Purchase Date
                      </h4>
                      <p className="font-medium">
                        {ticketOwner.purchaseDate 
                          ? format(new Date(ticketOwner.purchaseDate), "PPP 'at' p")
                          : "Not available"}
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t flex justify-between items-center">
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1"
                        onClick={() => window.location.href = `/admin/users/${ticketOwner.userId}`}
                      >
                        <User className="h-4 w-4" />
                        View User Profile
                      </Button>
                    </div>
                    <div className="text-muted-foreground text-sm flex items-center gap-1">
                      <TicketIcon className="h-3 w-3" />
                      Ticket Status: <span className="font-semibold text-primary">{ticketOwner.ticketStatus}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}