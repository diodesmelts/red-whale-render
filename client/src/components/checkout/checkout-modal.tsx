import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useState, useEffect } from "react"
import { CartItem } from "@/hooks/use-cart"
import { StripeCheckout } from "./stripe-checkout"
import { AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

interface CheckoutModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  clientSecret: string | null
  amount: number
  cartItems: CartItem[]
}

export function CheckoutModal({
  isOpen,
  onClose,
  onSuccess,
  clientSecret,
  amount,
  cartItems
}: CheckoutModalProps) {
  const [isCheckoutSuccessful, setIsCheckoutSuccessful] = useState(false)
  const [initError, setInitError] = useState<string | null>(null)
  const [loadingTimeout, setLoadingTimeout] = useState(false)

  // Debug log when props change
  useEffect(() => {
    if (isOpen) {
      console.log('CheckoutModal opened with:', {
        clientSecretStatus: clientSecret ? 'Provided' : 'Missing',
        clientSecretPrefix: clientSecret ? 
          `${clientSecret.substring(0, 10)}...` : 'null',
        amount,
        cartItemsCount: cartItems.length,
        cartItemsContent: cartItems.map(item => ({
          competitionId: item.competitionId,
          title: item.title,
          ticketPrice: item.ticketPrice,
          ticketCount: item.ticketCount
        }))
      });
    }
  }, [isOpen, clientSecret, amount, cartItems]);

  // Set a timeout if client secret doesn't load
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    
    if (isOpen && !clientSecret && !initError) {
      timer = setTimeout(() => {
        console.error('Client secret loading timeout after 10 seconds');
        setLoadingTimeout(true);
      }, 10000);
    }
    
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isOpen, clientSecret, initError]);

  const handleSuccess = () => {
    console.log('Payment successful, triggering success flow');
    setIsCheckoutSuccessful(true)
    setTimeout(() => {
      onSuccess()
    }, 1500)
  }

  const handleRetry = () => {
    console.log('Retrying checkout initialization');
    setInitError(null);
    setLoadingTimeout(false);
    window.location.reload();
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Checkout</DialogTitle>
          <DialogDescription>
            Complete your payment securely with Stripe.
          </DialogDescription>
        </DialogHeader>

        {/* Error state */}
        {initError && (
          <div className="py-4">
            <div className="bg-destructive/10 text-destructive p-4 rounded-md mb-4 flex items-start">
              <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Payment System Error</p>
                <p className="text-sm mt-1">{initError}</p>
                <p className="text-sm mt-2">Please check your payment configuration or try again later.</p>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleRetry}>
                Retry
              </Button>
            </div>
          </div>
        )}

        {/* Loading timeout state */}
        {loadingTimeout && !clientSecret && !initError && (
          <div className="py-4">
            <div className="bg-amber-500/10 text-amber-600 p-4 rounded-md mb-4 flex items-start">
              <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Payment Initialization Timeout</p>
                <p className="text-sm mt-1">
                  The payment system is taking longer than expected to initialize. 
                  This could be due to network issues or server problems.
                </p>
                <p className="text-sm mt-2">Would you like to keep waiting or try again?</p>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleRetry}>
                Retry
              </Button>
            </div>
          </div>
        )}

        {/* Loading state */}
        {!clientSecret && !initError && !loadingTimeout && (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            <span className="ml-2 mt-3">Loading payment details...</span>
            <p className="text-xs text-muted-foreground mt-2">
              This may take a few moments. Please be patient.
            </p>
          </div>
        )}

        {/* Stripe checkout form */}
        {clientSecret && !initError && (
          <div className="py-4">
            <StripeCheckout
              clientSecret={clientSecret}
              amount={amount}
              cartItems={cartItems}
              onSuccess={handleSuccess}
              onCancel={onClose}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}