import { useState } from 'react';
import { useParams, useLocation } from 'wouter';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { AdminLayout } from '@/components/admin/admin-layout';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbList } from '@/components/ui/breadcrumb';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Ticket, User, AlertCircle, ExternalLink, Calendar, Mail, Phone } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { format } from 'date-fns';
import { formatPhoneNumber } from '@/lib/utils';

// Define the form schema
const ticketLookupSchema = z.object({
  ticketNumber: z.string().min(1, 'Ticket number is required')
    .refine((val) => !isNaN(parseInt(val)), {
      message: 'Ticket number must be a valid number',
    }),
});

type TicketLookupFormValues = z.infer<typeof ticketLookupSchema>;

// Define the response type from the API
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
  const params = useParams<{ competitionId: string }>();
  const [, navigate] = useLocation();
  const competitionId = params.competitionId;
  const [ticketOwner, setTicketOwner] = useState<TicketOwnerResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  // Load competition details
  const { data: competition, isLoading: isLoadingCompetition } = useQuery({
    queryKey: ['/api/competitions', competitionId],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/competitions/${competitionId}`);
      if (!response.ok) {
        throw new Error('Competition not found');
      }
      return response.json();
    },
    enabled: !!competitionId,
  });

  const form = useForm<TicketLookupFormValues>({
    resolver: zodResolver(ticketLookupSchema),
    defaultValues: {
      ticketNumber: '',
    },
  });

  const onSubmit = async (data: TicketLookupFormValues) => {
    setIsSearching(true);
    setError(null);
    setTicketOwner(null);
    
    try {
      const response = await apiRequest(
        'GET', 
        `/api/admin/competitions/${competitionId}/ticket/${data.ticketNumber}/owner`
      );
      
      if (!response.ok) {
        if (response.status === 404) {
          setError(`No owner found for ticket number ${data.ticketNumber}`);
        } else {
          const errorData = await response.json();
          setError(errorData.message || 'Failed to lookup ticket owner');
        }
        return;
      }
      
      const ownerData = await response.json();
      setTicketOwner(ownerData);
    } catch (err) {
      console.error('Error looking up ticket owner:', err);
      setError('An unexpected error occurred while looking up the ticket owner');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Ticket Lookup</h1>
            <p className="text-muted-foreground">
              Look up who owns a specific ticket number
            </p>
          </div>
        </div>

        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/admin">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/admin/competitions">Competitions</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              {isLoadingCompetition ? (
                <span>Loading...</span>
              ) : (
                competition?.title || 'Competition'
              )}
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink>Ticket Lookup</BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <Card>
          <CardHeader>
            <CardTitle>Find Ticket Owner</CardTitle>
            <CardDescription>
              Enter a ticket number to find out who purchased it
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="ticketNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ticket Number</FormLabel>
                      <FormControl>
                        <div className="flex space-x-2">
                          <Input placeholder="Enter ticket number" {...field} />
                          <Button type="submit" disabled={isSearching}>
                            {isSearching ? "Searching..." : "Search"}
                          </Button>
                        </div>
                      </FormControl>
                      <FormDescription>
                        Enter the ticket number you want to look up
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </form>
            </Form>

            {error && (
              <Alert variant="destructive" className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {ticketOwner && (
              <div className="mt-6 space-y-4">
                <h3 className="text-lg font-semibold">Ticket Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg bg-muted/50">
                    <div className="flex items-center mb-2">
                      <Ticket className="h-5 w-5 mr-2 text-primary" />
                      <h4 className="font-medium">Ticket Details</h4>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Number:</span>
                        <span className="font-semibold">{ticketOwner.ticketNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Status:</span>
                        <span className="font-semibold capitalize">{ticketOwner.ticketStatus}</span>
                      </div>
                      {ticketOwner.purchaseDate && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Purchased:</span>
                          <span className="font-semibold">
                            {format(new Date(ticketOwner.purchaseDate), 'PPP p')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg bg-muted/50">
                    <div className="flex items-center mb-2">
                      <User className="h-5 w-5 mr-2 text-primary" />
                      <h4 className="font-medium">Owner Information</h4>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Username:</span>
                        <span className="font-semibold">{ticketOwner.userDetails.username}</span>
                      </div>
                      {ticketOwner.userDetails.fullName && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Full Name:</span>
                          <span className="font-semibold">{ticketOwner.userDetails.fullName}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Email:</span>
                        <div className="flex items-center">
                          <span className="font-semibold">{ticketOwner.userDetails.email}</span>
                          <a 
                            href={`mailto:${ticketOwner.userDetails.email}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="ml-1 text-primary hover:text-primary/80"
                          >
                            <Mail className="h-3.5 w-3.5" />
                          </a>
                        </div>
                      </div>
                      {ticketOwner.userDetails.phone && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Phone:</span>
                          <div className="flex items-center">
                            <span className="font-semibold">
                              {formatPhoneNumber(ticketOwner.userDetails.phone)}
                            </span>
                            <a 
                              href={`tel:${ticketOwner.userDetails.phone}`}
                              className="ml-1 text-primary hover:text-primary/80"
                            >
                              <Phone className="h-3.5 w-3.5" />
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end mt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => navigate(`/admin/users?id=${ticketOwner.userDetails.id}`)}
                    className="flex items-center"
                  >
                    <ExternalLink className="mr-1 h-4 w-4" />
                    View Full User Profile
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}