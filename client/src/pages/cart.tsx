import { Button } from "@/components/ui/button";
import { ShoppingCart, Plus, Minus, Trash2 } from "lucide-react";
import { useCart } from "@/hooks/use-cart"; 
import { apiRequest } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useState } from "react";
import { processImageUrl } from "@/lib/image-utils";
import { CheckoutModal } from "@/components/checkout/checkout-modal";

export default function CartPage() {
  const { cartItems, cartTotal, updateCartItem, removeFromCart, clearCart } = useCart();
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  // If the user isn't logged in, redirect to auth page
  if (!user) {
    navigate('/auth');
    return null;
  }

  const createPaymentIntentMutation = useMutation({
    mutationFn: async () => {
      // Create payment intent for the total cart amount
      const paymentRes = await apiRequest("POST", "/api/create-payment-intent", {
        amount: cartTotal,
        cartItems: cartItems.map(item => ({
          competitionId: item.competitionId,
          ticketCount: item.ticketCount
        }))
      });
      
      if (!paymentRes.ok) {
        const error = await paymentRes.json();
        throw new Error(error.message || "Failed to create payment intent");
      }
      
      return await paymentRes.json();
    },
    onSuccess: (data) => {
      setClientSecret(data.clientSecret);
      setIsCheckoutOpen(true);
    },
    onError: (error: any) => {
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
      return await Promise.all(
        cartItems.map(async (item) => {
          const entryRes = await apiRequest("POST", "/api/entries", {
            competitionId: item.competitionId,
            ticketCount: item.ticketCount,
            paymentStatus: "completed",
            stripePaymentId: `stripe_payment_${Date.now()}`
          });
          
          if (!entryRes.ok) {
            throw new Error(`Failed to create entry for ${item.title}`);
          }
          
          return entryRes.json();
        })
      );
    },
    onSuccess: () => {
      toast({
        title: "Purchase successful!",
        description: "Thank you for your purchase!",
      });
      
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
                  <div className="sm:col-span-6 flex gap-3 items-center">
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