import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useState } from "react"
import { CartItem } from "@/hooks/use-cart"
import { StripeCheckout } from "./stripe-checkout"

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

  const handleSuccess = () => {
    setIsCheckoutSuccessful(true)
    setTimeout(() => {
      onSuccess()
    }, 1500)
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
        {clientSecret ? (
          <div className="py-4">
            <StripeCheckout
              clientSecret={clientSecret}
              amount={amount}
              cartItems={cartItems}
              onSuccess={handleSuccess}
              onCancel={onClose}
            />
          </div>
        ) : (
          <div className="flex items-center justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            <span className="ml-2">Loading payment details...</span>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}