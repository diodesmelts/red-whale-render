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
      
      <div className="mt-4 text-xs text-muted-foreground flex items-center justify-center space-x-2">
        <p>Secured by</p>
        <svg 
          className="h-6 w-auto text-muted-foreground" 
          viewBox="0 0 60 25" 
          xmlns="http://www.w3.org/2000/svg"
          fill="currentColor"
        >
          <path d="M59.64 14.28h-8.06v-1.83h8.06v1.83zm0-3.67h-8.06V8.79h8.06v1.82zm0-3.66h-8.06V5.13h8.06v1.82zm-8.06 10.99h8.06v-1.83h-8.06v1.83zm-8.87-5.5c0-.7.6-1.31 1.3-1.31.71 0 1.3.61 1.3 1.31 0 .7-.59 1.31-1.3 1.31s-1.3-.61-1.3-1.31zm-4.14 0c0-.7.59-1.31 1.3-1.31.7 0 1.3.61 1.3 1.31 0 .7-.6 1.31-1.3 1.31-.71 0-1.3-.61-1.3-1.31zm-4.15 0c0-.7.6-1.31 1.3-1.31.71 0 1.31.61 1.31 1.31 0 .7-.6 1.31-1.31 1.31-.7 0-1.3-.61-1.3-1.31zm17.36-6.54H46.4c-.2.92-.68 1.67-1.34 2.18v2.96h-2.2v-2.36c-.55.26-1.28.41-2.11.41-1.21 0-2.36-.3-2.97-.8-.35-.29-.53-.64-.53-1.05 0-.44.21-.81.6-1.07.36-.24.86-.36 1.47-.36.53 0 1.2.12 1.67.36.29.15.53.34.7.57.36-.26.66-.64.88-1.13h-4.12c-.22 0-.53-.06-.77-.17a1.8 1.8 0 01-.9-.9c-.19-.38-.29-.8-.29-1.24 0-.54.15-1.04.45-1.48.29-.42.7-.77 1.22-1a4 4 0 011.75-.38c.58 0 1.13.09 1.62.27.5.19.91.44 1.25.77.34.33.6.72.78 1.16.18.44.27.92.27 1.42 0 .03 0 .06-.3.09h.72c.34-.62.93-1.02 1.62-1.02h4.59v.61c0 .26-.21.47-.47.47zM20.7 5.13l-.56 3.32h-2.38l.56-3.32h2.38zm-4.83 0l-.56 3.32h-2.37l.56-3.32h2.37zm-4.83 0l-.55 3.32H8.13l.55-3.32h2.37zM39.02 0H21.7c-.89 0-1.7.52-2.07 1.33L13.1 18h27.4a1.63 1.63 0 0 0 1.61-1.33L48.57 1.33A1.63 1.63 0 0 0 46.96 0h-7.94z"></path>
        </svg>
      </div>
    </div>
  );
}