import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/use-cart";
import { useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type CartIconProps = {
  variant?: "default" | "subtle" | "icon-only";
  className?: string;
};

export function CartIcon({ variant = "default", className }: CartIconProps) {
  const { cartCount, cartTotal } = useCart();
  const [, navigate] = useLocation();

  const handleCartClick = () => {
    navigate("/cart");
  };

  if (variant === "icon-only") {
    return (
      <div className={cn("relative", className)}>
        <Button 
          onClick={handleCartClick} 
          variant="ghost" 
          size="icon" 
          className="relative"
          aria-label="Shopping cart"
        >
          <ShoppingCart className="h-5 w-5" />
          {cartCount > 0 && (
            <Badge 
              className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
              variant="destructive"
            >
              {cartCount > 99 ? "99+" : cartCount}
            </Badge>
          )}
        </Button>
      </div>
    );
  }

  if (variant === "subtle") {
    return (
      <Button 
        onClick={handleCartClick} 
        variant="ghost" 
        size="sm"
        className={cn("gap-2", className)}
      >
        <ShoppingCart className="h-4 w-4" />
        {cartCount > 0 ? (
          <span>
            {cartCount} {cartCount === 1 ? "item" : "items"}
          </span>
        ) : (
          <span>Cart</span>
        )}
      </Button>
    );
  }

  return (
    <Button 
      onClick={handleCartClick} 
      variant="outline" 
      size="sm"
      className={cn("gap-2", className)}
    >
      <ShoppingCart className="h-4 w-4" />
      {cartCount > 0 ? (
        <span>
          {cartCount} {cartCount === 1 ? "item" : "items"} (£{cartTotal.toFixed(2)})
        </span>
      ) : (
        <span>Cart</span>
      )}
    </Button>
  );
}