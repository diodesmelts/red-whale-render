import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Facebook, Instagram, Twitter } from "lucide-react";
import { SiteConfig } from "@shared/schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";

const footerFormSchema = z.object({
  facebookUrl: z.string().optional(),
  instagramUrl: z.string().optional(),
  twitterUrl: z.string().optional(),
  showPaymentIcons: z.boolean().default(true),
  copyrightText: z.string().min(1, "Copyright text is required"),
});

type FooterFormValues = z.infer<typeof footerFormSchema>;

export function FooterSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch current footer settings
  const { data: footerSettings, isLoading } = useQuery<any>({
    queryKey: ["/api/site-config", "footerSettings"],
    queryFn: async () => {
      const res = await fetch("/api/site-config/footerSettings");
      if (!res.ok) {
        // If no footer settings exist yet, return default values
        return { 
          value: JSON.stringify({ 
            facebookUrl: "https://facebook.com/mobycomps",
            instagramUrl: "https://instagram.com/mobycomps",
            twitterUrl: "",
            showPaymentIcons: true,
            copyrightText: "© 2025 Moby Competitions. All rights reserved."
          }) 
        };
      }
      return res.json();
    },
  });

  // Parse the footer settings JSON
  const parsedSettings = footerSettings?.value 
    ? JSON.parse(footerSettings.value)
    : null;

  // Setup form with default values
  const form = useForm<FooterFormValues>({
    resolver: zodResolver(footerFormSchema),
    defaultValues: parsedSettings || {
      facebookUrl: "",
      instagramUrl: "",
      twitterUrl: "",
      showPaymentIcons: true,
      copyrightText: "© 2025 Moby Competitions. All rights reserved.",
    },
  });

  const updateFooterMutation = useMutation({
    mutationFn: async (values: FooterFormValues) => {
      // Convert form values to JSON string for storage
      const response = await fetch('/api/admin/site-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          key: 'footerSettings',
          value: JSON.stringify(values),
          description: 'Footer configuration settings',
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update footer settings');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Footer settings updated",
        description: "The footer settings have been successfully updated",
      });
      
      // Invalidate the query to refresh the footer
      queryClient.invalidateQueries({ queryKey: ['/api/site-config', 'footerSettings'] });
      setIsSubmitting(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
      setIsSubmitting(false);
    },
  });

  const onSubmit = (values: FooterFormValues) => {
    setIsSubmitting(true);
    updateFooterMutation.mutate(values);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Social Media Links</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="facebookUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Facebook className="h-4 w-4" /> Facebook URL
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="https://facebook.com/yourpage" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="instagramUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Instagram className="h-4 w-4" /> Instagram URL
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="https://instagram.com/yourhandle" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="twitterUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Twitter className="h-4 w-4" /> Twitter URL
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="https://twitter.com/yourhandle" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
        
        <Card>
          <CardContent className="pt-6">
            <FormField
              control={form.control}
              name="showPaymentIcons"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Payment Method Icons</FormLabel>
                    <div className="text-sm text-muted-foreground">
                      Show credit card icons in the footer
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>
        
        <FormField
          control={form.control}
          name="copyrightText"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Copyright Text</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="© 2025 Moby Competitions. All rights reserved." 
                  className="resize-none" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button 
          type="submit" 
          className="w-full" 
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving Changes...
            </>
          ) : (
            'Save Footer Settings'
          )}
        </Button>
      </form>
    </Form>
  );
}