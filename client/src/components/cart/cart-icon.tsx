import { ShoppingCart } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface CartIconProps {
  variant?: "default" | "outline" | "secondary" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  showTooltip?: boolean;
}

export function CartIcon({ 
  variant = "ghost", 
  size = "icon",
  showTooltip = true
}: CartIconProps) {
  const { cartCount, cartTotal } = useCart();
  const [, navigate] = useLocation();

  return (
    <>
      {showTooltip ? (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={variant}
                size={size}
                className="relative"
                onClick={() => navigate("/cart")}
                aria-label={`Shopping cart with ${cartCount} items`}
              >
                <ShoppingCart className="h-[1.2rem] w-[1.2rem]" />
                {cartCount > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-2 -right-2 h-5 min-w-5 p-0 flex items-center justify-center rounded-full text-xs"
                  >
                    {cartCount}
                  </Badge>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>
                {cartCount === 0
                  ? "Your cart is empty"
                  : `${cartCount} item${cartCount !== 1 ? "s" : ""} - £${cartTotal.toFixed(2)}`}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : (
        <Button
          variant={variant}
          size={size}
          className="relative"
          onClick={() => navigate("/cart")}
          aria-label={`Shopping cart with ${cartCount} items`}
        >
          <ShoppingCart className="h-[1.2rem] w-[1.2rem]" />
          {cartCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-2 -right-2 h-5 min-w-5 p-0 flex items-center justify-center rounded-full text-xs"
            >
              {cartCount}
            </Badge>
          )}
        </Button>
      )}
    </>
  );
}