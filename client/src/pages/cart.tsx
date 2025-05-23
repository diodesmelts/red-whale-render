import { Button } from "@/components/ui/button";
import { ShoppingCart, Plus, Minus, Trash2, AlertCircle } from "lucide-react";
import { useCart } from "@/hooks/use-cart"; 
import { apiRequest } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useState } from "react";
import { processImageUrl } from "@/lib/image-utils";
import { CheckoutModal } from "@/components/checkout/checkout-modal";
import { CartExpiryTimer } from "@/components/cart/cart-expiry-timer";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function CartPage() {
  const { cartItems, cartTotal, updateCartItem, removeFromCart, clearCart } = useCart();
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  // We'll now allow non-logged in users to view the cart, but will prompt for login at checkout

  const createPaymentIntentMutation = useMutation({
    mutationFn: async () => {
      console.log('Creating payment intent with cart data:', {
        amount: cartTotal,
        itemCount: cartItems.length,
        cartItemsSummary: cartItems.map(item => ({
          id: item.competitionId,
          title: item.title,
          price: item.ticketPrice,
          quantity: item.ticketCount,
          subtotal: item.ticketPrice * item.ticketCount
        }))
      });
      
      try {
        // Create payment intent for the total cart amount
        const paymentRes = await apiRequest("POST", "/api/create-payment-intent", {
          amount: cartTotal,
          cartItems: cartItems.map(item => ({
            competitionId: item.competitionId,
            ticketCount: item.ticketCount,
            selectedNumbers: item.selectedNumbers || []
          }))
        });
        
        // If we get a response, log status and headers for debugging
        console.log('Payment intent API response status:', paymentRes.status);
        
        if (!paymentRes.ok) {
          let errorData;
          try {
            errorData = await paymentRes.json();
            console.error('Payment intent creation failed:', errorData);
          } catch (parseError) {
            console.error('Failed to parse error response:', parseError);
            console.error('Response text:', await paymentRes.text());
            throw new Error(`Payment service error (${paymentRes.status}): Could not process request`);
          }
          
          throw new Error(errorData.message || `Payment service error (${paymentRes.status})`);
        }
        
        const data = await paymentRes.json();
        console.log('Payment intent created successfully:', {
          hasClientSecret: !!data.clientSecret,
          clientSecretPrefix: data.clientSecret ? 
            `${data.clientSecret.substring(0, 10)}...` : 'missing'
        });
        
        return data;
      } catch (error) {
        console.error('Exception during payment intent creation:', error);
        if (error instanceof Error) {
          throw error;
        } else {
          throw new Error('Unknown error during checkout initialization');
        }
      }
    },
    onSuccess: (data) => {
      if (!data.clientSecret) {
        console.error('Payment intent response missing client secret');
        toast({
          title: "Checkout initialization failed",
          description: "Invalid response from payment service",
          variant: "destructive",
        });
        setIsProcessing(false);
        return;
      }
      
      setClientSecret(data.clientSecret);
      setIsCheckoutOpen(true);
    },
    onError: (error: any) => {
      console.error('Payment intent mutation error:', error);
      toast({
        title: "Checkout initialization failed",
        description: error.message || "Failed to initialize checkout",
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  });

  const createEntriesMutation = useMutation({
    mutationFn: async () => {
      // Send the entire cart in a single request
      const stripePaymentId = `stripe_payment_${Date.now()}`;
      const entryRes = await apiRequest("POST", "/api/entries", {
        paymentStatus: "completed",
        stripePaymentId,
        cartItems: cartItems.map(item => ({
          competitionId: item.competitionId,
          ticketCount: item.ticketCount,
          selectedNumbers: item.selectedNumbers || []
        }))
      });
      
      if (!entryRes.ok) {
        const errorData = await entryRes.json();
        throw new Error(errorData.message || "Failed to create entries");
      }
      
      return entryRes.json();
    },
    onSuccess: (data) => {
      // Check if there were any errors in the response
      if (data.errors && data.errors.length > 0) {
        // Show a warning if some entries were created but others failed
        toast({
          title: "Partial success",
          description: "Some entries were created but others failed. Check your entries page for details.",
          variant: "warning",
        });
      } else {
        toast({
          title: "Purchase successful!",
          description: "Thank you for your purchase!",
        });
      }
      
      // Clear the cart and redirect to entries page
      clearCart();
      navigate("/my-entries");
    },
    onError: (error: any) => {
      toast({
        title: "Entry creation failed",
        description: error.message || "Your payment was processed but we couldn't create your entries",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsProcessing(false);
      setIsCheckoutOpen(false);
    }
  });

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      toast({
        title: "Cart is empty",
        description: "Please add items to your cart before checking out",
        variant: "destructive",
      });
      return;
    }
    
    // Check if user is logged in before proceeding to checkout
    if (!user) {
      toast({
        title: "Login required",
        description: "Please login or create an account to complete your purchase",
      });
      
      // Save current page to return after authentication
      localStorage.setItem('returnToAfterAuth', '/cart');
      
      // Redirect to authentication page
      navigate('/auth');
      return;
    }
    
    setIsProcessing(true);
    createPaymentIntentMutation.mutate();
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      <h1 className="text-3xl font-bold mb-6 flex items-center gap-2">
        <ShoppingCart className="h-8 w-8" />
        Your Cart
      </h1>
      
      {cartItems.length === 0 ? (
        <div className="text-center p-8 bg-muted rounded-lg">
          <ShoppingCart className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Your cart is empty</h2>
          <p className="text-muted-foreground mb-6">
            Browse competitions and add tickets to your cart to get started.
          </p>
          <Button onClick={() => navigate("/")}>
            Browse Competitions
          </Button>
        </div>
      ) : (
        <>
          <Alert className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Your selected numbers are reserved</AlertTitle>
            <AlertDescription className="flex flex-col gap-2">
              <p>Numbers are reserved for 30 minutes from the time you add them to your cart. Complete your purchase before they expire to secure your tickets.</p>
              
              {cartItems.length > 0 && (
                <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {cartItems.map(item => item.expiresAt && (
                    <div key={`timer-${item.competitionId}`} className="bg-muted p-2 rounded-md flex items-center justify-between">
                      <span className="text-sm font-medium truncate max-w-[150px]">{item.title}:</span>
                      <CartExpiryTimer expiresAt={item.expiresAt} />
                    </div>
                  ))}
                </div>
              )}
            </AlertDescription>
          </Alert>
          <div className="bg-card rounded-lg shadow-sm overflow-hidden mb-6">
            <div className="hidden sm:grid grid-cols-12 gap-4 bg-muted p-4 font-medium text-sm">
              <div className="col-span-6">Competition</div>
              <div className="col-span-2">Price</div>
              <div className="col-span-2">Quantity</div>
              <div className="col-span-2 text-right">Total</div>
            </div>
            
            <div className="divide-y">
              {cartItems.map((item) => (
                <div 
                  key={item.competitionId} 
                  className="grid grid-cols-1 sm:grid-cols-12 gap-4 p-4 items-center"
                >
                  <div className="sm:col-span-6 flex gap-3 items-start">
                    <div className="w-16 h-16 bg-muted rounded flex-shrink-0 overflow-hidden">
                      {item.imageUrl && (
                        <img 
                          src={processImageUrl(item.imageUrl)} 
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium">{item.title}</h3>
                      <p className="text-sm text-muted-foreground sm:hidden">
                        £{item.ticketPrice.toFixed(2)} per ticket
                      </p>
                      
                      {item.expiresAt && (
                        <div className="mt-1">
                          <CartExpiryTimer expiresAt={item.expiresAt} />
                        </div>
                      )}
                      
                      {item.selectedNumbers && item.selectedNumbers.length > 0 && (
                        <div className="mt-1">
                          <p className="text-xs font-medium text-[#002147] mb-1">Your lucky numbers:</p>
                          <div className="flex flex-wrap gap-1" data-testid={`selected-numbers-${item.competitionId}`}>
                            {item.selectedNumbers.sort((a, b) => a - b).map(number => (
                              <span 
                                key={`${item.competitionId}-${number}`}
                                className="inline-flex items-center justify-center bg-[#002147] text-white text-xs rounded-full h-6 w-6 shadow-sm"
                                data-testid={`cart-number-${item.competitionId}-${number}`}
                              >
                                {number}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="sm:col-span-2 hidden sm:block">
                    £{item.ticketPrice.toFixed(2)}
                  </div>
                  
                  <div className="sm:col-span-2 flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => updateCartItem(item.competitionId, item.ticketCount - 1)}
                      aria-label="Decrease quantity"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    
                    <span className="w-8 text-center">{item.ticketCount}</span>
                    
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => updateCartItem(item.competitionId, item.ticketCount + 1)}
                      aria-label="Increase quantity"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="sm:col-span-2 flex justify-between sm:justify-end items-center">
                    <span className="sm:mr-4">£{(item.ticketPrice * item.ticketCount).toFixed(2)}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => removeFromCart(item.competitionId)}
                      aria-label="Remove item"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-between">
            <Button 
              variant="outline"
              onClick={clearCart}
            >
              Clear Cart
            </Button>
            
            <div className="bg-card p-4 rounded-lg shadow-sm">
              <div className="flex justify-between mb-2">
                <span className="font-medium">Subtotal:</span>
                <span>£{cartTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between mb-4">
                <span className="font-medium">Total:</span>
                <span className="text-lg font-bold">£{cartTotal.toFixed(2)}</span>
              </div>
              <Button 
                className="w-full"
                onClick={handleCheckout}
                disabled={isProcessing}
              >
                {isProcessing ? "Processing..." : "Checkout"}
              </Button>
            </div>
          </div>
          
          {/* Stripe Checkout Modal */}
          <CheckoutModal
            isOpen={isCheckoutOpen}
            onClose={() => {
              setIsCheckoutOpen(false);
              setIsProcessing(false);
            }}
            onSuccess={() => createEntriesMutation.mutate()}
            clientSecret={clientSecret}
            amount={cartTotal}
            cartItems={cartItems}
          />
        </>
      )}
    </div>
  );
}