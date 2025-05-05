import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient, getQueryFn } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Competition, insertCompetitionSchema } from "@shared/schema";
import { COMPETITION_CATEGORIES } from "@/lib/constants";
import { ImageUpload } from "@/components/ui/image-upload";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ChevronLeft, CalendarIcon, Loader2 } from "lucide-react";

// Create a schema for the form that extends the insert schema
const formSchema = insertCompetitionSchema.extend({
  drawDate: z.date({
    required_error: "A draw date is required",
  }),
});

// Get the type from the schema
type FormValues = z.infer<typeof formSchema>;

export default function EditCompetition() {
  const [location, navigate] = useLocation();
  const params = useParams<{ id: string }>();
  const id = parseInt(params.id);
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get competition data
  const { 
    data: competition, 
    isLoading, 
    isError 
  } = useQuery({
    queryKey: ['/api/competitions', id],
    queryFn: async () => {
      const res = await fetch(`/api/competitions/${id}`);
      if (!res.ok) throw new Error('Failed to fetch competition');
      return res.json();
    },
    enabled: !isNaN(id),
  });

  // Initialize the form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "",
      brand: "",
      imageUrl: "",
      prizeValue: 0,
      ticketPrice: 0,
      maxTicketsPerUser: 10,
      totalTickets: 1000,
      isLive: false,
      isFeatured: false,
      drawDate: new Date(),
    },
  });

  // Update form values when competition data is loaded
  useEffect(() => {
    if (competition) {
      try {
        // Ensure drawDate is properly converted to a Date object
        const drawDate = competition.drawDate ? new Date(competition.drawDate) : new Date();
        form.reset({
          ...competition,
          drawDate
        });
      } catch (error) {
        console.error("Error parsing competition data:", error);
        toast({
          title: "Error formatting date",
          description: "There was a problem with the date format. Using current date instead.",
          variant: "destructive"
        });
        // Fallback to current date
        form.reset({
          ...competition,
          drawDate: new Date()
        });
      }
    }
  }, [competition, form, toast]);

  // Update competition mutation
  const updateCompetitionMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      // Convert Date object to ISO string for API
      const apiData = {
        ...data,
        drawDate: data.drawDate instanceof Date 
          ? data.drawDate.toISOString() 
          : (typeof data.drawDate === 'string' 
              ? new Date(data.drawDate).toISOString() 
              : new Date().toISOString())
      };
      
      console.log("Sending to API:", apiData);
      const res = await apiRequest("PATCH", `/api/admin/competitions/${id}`, apiData);
      return await res.json();
    },
    onSuccess: (data: Competition) => {
      queryClient.invalidateQueries({ queryKey: ['/api/competitions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/competitions', id] });
      toast({
        title: "Competition updated",
        description: "Your changes have been saved successfully.",
      });
      navigate(`/admin/listings`);
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating competition",
        description: error.message,
        variant: "destructive",
      });
      setIsSubmitting(false);
    },
  });

  // Form submission handler
  const onSubmit = (data: FormValues) => {
    setIsSubmitting(true);
    
    // Ensure boolean fields are properly set
    const processedData = {
      ...data,
      isLive: Boolean(data.isLive),
      isFeatured: Boolean(data.isFeatured),
      pushToHeroBanner: Boolean(data.pushToHeroBanner)
    };
    
    console.log("Submitting competition data:", processedData);
    updateCompetitionMutation.mutate(processedData);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (isError || !competition) {
    return (
      <div className="container py-10 text-center">
        <h1 className="text-2xl font-bold">Error Loading Competition</h1>
        <p className="text-muted-foreground mt-2">
          The competition could not be found or there was an error loading it.
        </p>
        <Button 
          onClick={() => navigate("/admin/listings")}
          className="mt-6"
        >
          Return to Listings
        </Button>
      </div>
    );
  }

  return (
    <div className="container py-10">
      <div className="flex flex-col gap-6 max-w-3xl mx-auto">
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => navigate("/admin/listings")}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Edit Competition</h1>
            <p className="text-muted-foreground mt-1">
              Update details for "{competition.title}"
            </p>
          </div>
        </div>

        <div className="border rounded-lg p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Basic Details */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Basic Details</h2>
                
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter competition title" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe the competition and prize" 
                          rows={4}
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.entries(COMPETITION_CATEGORIES).map(([key, value]) => (
                              <SelectItem key={key} value={value}>
                                {value.charAt(0).toUpperCase() + value.slice(1)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="brand"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Brand (optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Brand name" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="imageUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <ImageUpload 
                          onImageUploaded={field.onChange}
                          existingImageUrl={field.value}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              {/* Prize & Pricing Details */}
              <div className="space-y-4 pt-4 border-t">
                <h2 className="text-xl font-semibold">Prize & Pricing</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="prizeValue"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Prize Value (£)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="0.00" 
                            {...field}
                            onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="ticketPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ticket Price (£)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="0.00" 
                            value={field.value / 100}  
                            onChange={e => field.onChange(Math.round(parseFloat(e.target.value || "0") * 100))}
                          />
                        </FormControl>
                        <FormDescription>
                          Enter the price in pounds (e.g., 1.00 for £1)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="maxTicketsPerUser"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Max Tickets Per User</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="10" 
                            {...field}
                            onChange={e => field.onChange(parseInt(e.target.value) || 10)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="totalTickets"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Total Available Tickets</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="1000" 
                            {...field}
                            onChange={e => field.onChange(parseInt(e.target.value) || 1000)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="drawDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Draw Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={`w-full pl-3 text-left font-normal ${
                                !field.value ? "text-muted-foreground" : ""
                              }`}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormDescription>
                        The date when the competition draw will take place
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              {/* Visibility Settings */}
              <div className="space-y-4 pt-4 border-t">
                <h2 className="text-xl font-semibold">Visibility Settings</h2>
                
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="isLive"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={Boolean(field.value)}
                            onCheckedChange={(checked) => field.onChange(Boolean(checked))}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Competition is live</FormLabel>
                          <FormDescription>
                            If enabled, the competition will be publicly visible
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="isFeatured"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={Boolean(field.value)}
                            onCheckedChange={(checked) => field.onChange(Boolean(checked))}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Feature this competition</FormLabel>
                          <FormDescription>
                            If enabled, the competition will be highlighted on the homepage
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="pushToHeroBanner"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 bg-blue-50 dark:bg-blue-950/30">
                        <FormControl>
                          <Checkbox
                            checked={Boolean(field.value)}
                            onCheckedChange={(checked) => field.onChange(Boolean(checked))}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Push to Hero Banner</FormLabel>
                          <FormDescription>
                            If enabled, this competition will be featured prominently in the hero banner section
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-4 pt-4 border-t">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => navigate("/admin/listings")}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Saving Changes..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}