import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { CartItem } from '@/hooks/use-cart';

// Make sure to call loadStripe outside of a component's render to avoid
// recreating the Stripe object on every render.
// This is your test publishable API key.
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

interface CheckoutFormProps {
  clientSecret: string;
  onSuccess: () => void;
  onCancel: () => void;
}

function CheckoutForm({ clientSecret, onSuccess, onCancel }: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!stripe) {
      return;
    }

    // Check the payment status to handle any redirects from Stripe
    stripe.retrievePaymentIntent(clientSecret).then(({ paymentIntent }) => {
      switch (paymentIntent?.status) {
        case "succeeded":
          setMessage("Payment succeeded!");
          setTimeout(onSuccess, 1000);
          break;
        case "processing":
          setMessage("Your payment is processing.");
          break;
        case "requires_payment_method":
          setMessage("Please provide payment details.");
          break;
        default:
          setMessage("Something went wrong.");
          break;
      }
    });
  }, [stripe, clientSecret, onSuccess]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js hasn't yet loaded.
      return;
    }

    setIsLoading(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.href,
      },
      redirect: 'if_required',
    });

    if (error) {
      setMessage(error.message || "An unexpected error occurred.");
    } else {
      // Payment succeeded
      setMessage("Payment succeeded!");
      setTimeout(onSuccess, 1000);
    }

    setIsLoading(false);
  };

  return (
    <form id="payment-form" onSubmit={handleSubmit}>
      <PaymentElement 
        id="payment-element"
        options={{
          defaultValues: {
            billingDetails: {
              name: '',
            }
          },
          wallets: {
            applePay: 'auto',
            googlePay: 'auto'
          },
          business: {
            name: 'Blue Whale Competitions'
          },
          fields: {
            billingDetails: {
              name: 'auto'
            }
          }
        }}
      />
      
      {message && (
        <div className="mt-4 p-3 bg-muted rounded-md text-sm">
          {message}
        </div>
      )}
      
      <div className="flex justify-between mt-4">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={isLoading || !stripe || !elements}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : null}
          Pay Now
        </Button>
      </div>
    </form>
  );
}

interface StripeCheckoutProps {
  clientSecret: string;
  amount: number;
  cartItems: CartItem[];
  onSuccess: () => void;
  onCancel: () => void;
}

export function StripeCheckout({ 
  clientSecret,
  amount,
  cartItems,
  onSuccess,
  onCancel
}: StripeCheckoutProps) {
  const appearance = {
    theme: 'night' as const,
    variables: {
      colorPrimary: '#3b82f6',
      colorBackground: '#1f2937',
      colorText: '#f9fafb',
      colorDanger: '#ef4444',
      fontFamily: 'Open Sans, sans-serif',
      borderRadius: '0.5rem',
    },
  };

  const options = {
    clientSecret,
    appearance,
  };

  return (
    <div className="bg-card border rounded-lg p-6 shadow-lg max-w-md mx-auto">
      <h2 className="text-xl font-semibold mb-1">Complete your purchase</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Total: £{amount.toFixed(2)} for {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}
      </p>
      
      <Elements stripe={stripePromise} options={options}>
        <CheckoutForm 
          clientSecret={clientSecret}
          onSuccess={onSuccess}
          onCancel={onCancel}
        />
      </Elements>
      
      <div className="mt-4 text-xs text-muted-foreground">
        <p>Your payment is processed securely through Stripe.</p>
      </div>
    </div>
  );
}