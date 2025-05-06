import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import CachedImage from "@/components/ui/cached-image";

export function PaymentCardsPreview() {
  // Fetch the current payment cards image config
  const { data: paymentCardsConfig, isLoading } = useQuery({
    queryKey: ['/api/site-config', 'paymentCardsImage'],
    queryFn: async () => {
      const res = await fetch('/api/site-config/paymentCardsImage', {
        credentials: 'include',
      });
      
      if (res.status === 404) {
        // If the config doesn't exist yet, return null
        return null;
      }
      
      if (!res.ok) {
        throw new Error('Failed to fetch payment cards image config');
      }
      
      return res.json();
    },
    // Reduce polling with a longer staleTime and cacheTime
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,   // 10 minutes
  });
  
  const imageUrl = paymentCardsConfig?.value || '';
  
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium">Current Payment Cards Image</h3>
      
      {isLoading ? (
        <Skeleton className="w-full h-12" />
      ) : imageUrl ? (
        <div className="border rounded p-3 bg-muted/50 flex items-center justify-center">
          <CachedImage
            src={imageUrl}
            alt="Payment cards"
            className="max-h-12"
            fallbackSrc="/placeholder-payment-cards.png"
          />
        </div>
      ) : (
        <div className="border rounded p-3 bg-muted/50 flex items-center justify-center">
          <p className="text-sm text-muted-foreground italic">No payment cards image set</p>
        </div>
      )}
    </div>
  );
}