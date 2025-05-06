import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle } from 'lucide-react';
import { CartItem } from '@/hooks/use-cart';

// Make sure to call loadStripe outside of a component's render to avoid
// recreating the Stripe object on every render.
// This is your test publishable API key.
const stripeKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
console.log('Stripe public key status:', stripeKey ? 'Found' : 'Missing');

// Enhanced debugging for Stripe initialization
let stripePromise: ReturnType<typeof loadStripe> | null = null;

// Log environment information
console.log('Environment:', {
  mode: import.meta.env.MODE,
  isProduction: import.meta.env.PROD,
  baseUrl: import.meta.env.BASE_URL,
  isStripeKeyPresent: !!stripeKey,
  stripeKeyPrefix: stripeKey ? stripeKey.substring(0, 7) + '...' : 'missing',
  currentUrl: window.location.href,
  host: window.location.host
});

try {
  if (!stripeKey) {
    console.error('Missing Stripe public key (VITE_STRIPE_PUBLIC_KEY)');
  } else {
    console.log('Attempting to initialize Stripe with key prefix:', stripeKey.substring(0, 7) + '...');
    
    // Initialize Stripe with detailed error handling
    stripePromise = loadStripe(stripeKey)
      .then(stripe => {
        console.log('Stripe initialization successful:', !!stripe);
        return stripe;
      })
      .catch(error => {
        console.error('Stripe initialization failed with error:', error);
        if (error instanceof Error) {
          console.error('Error details:', {
            message: error.message,
            name: error.name,
            stack: error.stack
          });
        }
        return null;
      });
  }
} catch (err) {
  console.error('Exception during Stripe setup:', err);
  if (err instanceof Error) {
    console.error('Error details:', {
      message: err.message,
      name: err.name,
      stack: err.stack
    });
  }
}

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
      
      <div className="flex flex-col sm:flex-row justify-between mt-4 gap-3">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel}
          disabled={isLoading}
          className="w-full sm:w-auto order-2 sm:order-1"
        >
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={isLoading || !stripe || !elements}
          className="w-full sm:w-auto order-1 sm:order-2"
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
  const [stripeError, setStripeError] = useState<string | null>(null);

  // Check Stripe initialization
  useEffect(() => {
    // After a timeout, check if Stripe was initialized successfully
    const timer = setTimeout(() => {
      if (!stripePromise) {
        console.error("Stripe initialization failed or timed out");
        setStripeError("Payment system could not be initialized. Please check your payment configuration.");
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

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

  // Show error if Stripe failed to initialize
  if (stripeError) {
    return (
      <div className="bg-card border rounded-lg p-4 sm:p-6 shadow-lg max-w-md mx-auto overflow-y-auto">
        <h2 className="text-xl font-semibold mb-1">Complete your purchase</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Total: £{amount.toFixed(2)} for {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}
        </p>
        
        <div className="bg-destructive/10 text-destructive p-4 rounded-md mb-4 flex items-start">
          <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium">Payment System Error</p>
            <p className="text-sm mt-1">{stripeError}</p>
            <p className="text-sm mt-2">Please check your payment configuration or try again later.</p>
          </div>
        </div>
        
        <div className="flex justify-between">
          <Button 
            type="button"
            variant="outline" 
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button 
            type="button"
            onClick={() => window.location.reload()}
          >
            Reload Page
          </Button>
        </div>
      </div>
    );
  }

  // Show loading message if stripePromise is null but we haven't timed out yet
  if (!stripePromise) {
    return (
      <div className="bg-card border rounded-lg p-4 sm:p-6 shadow-lg max-w-md mx-auto overflow-y-auto">
        <h2 className="text-xl font-semibold mb-1">Complete your purchase</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Total: £{amount.toFixed(2)} for {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}
        </p>
        
        <div className="flex flex-col items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-sm text-muted-foreground">Initializing payment system...</p>
        </div>
        
        <Button 
          type="button"
          variant="outline" 
          onClick={onCancel}
          className="w-full mt-4"
        >
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-[#002147] text-white border rounded-lg p-4 sm:p-6 shadow-lg max-w-md mx-auto overflow-y-auto">
      <h2 className="text-xl font-semibold mb-1">Complete your purchase</h2>
      <p className="text-sm text-white/80 mb-4 sm:mb-6">
        Total: £{amount.toFixed(2)} for {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}
      </p>
      
      <Elements stripe={stripePromise} options={options}>
        <CheckoutForm 
          clientSecret={clientSecret}
          onSuccess={onSuccess}
          onCancel={onCancel}
        />
      </Elements>
      
      <div className="mt-4 text-xs text-white/70">
        <p>Your payment is processed securely through Stripe.</p>
      </div>
    </div>
  );
}