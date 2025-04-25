import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { ShoppingCart, Plus, Minus } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { Competition } from "@shared/schema";
import { useNavigate } from "wouter";

interface AddToCartProps {
  competition: Competition;
  layout?: "row" | "column";
  buttonVariant?: "default" | "outline" | "secondary" | "destructive" | "ghost" | "link";
  withNavigation?: boolean;
}

export function AddToCart({ 
  competition, 
  layout = "row", 
  buttonVariant = "default",
  withNavigation = false
}: AddToCartProps) {
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useCart();
  const navigate = useNavigate();

  const handleDecrement = () => {
    setQuantity((prev) => (prev > 1 ? prev - 1 : 1));
  };

  const handleIncrement = () => {
    // Make sure we don't exceed max tickets per user
    if (quantity < competition.maxTicketsPerUser) {
      setQuantity((prev) => prev + 1);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (isNaN(value) || value < 1) {
      setQuantity(1);
    } else if (value > competition.maxTicketsPerUser) {
      setQuantity(competition.maxTicketsPerUser);
    } else {
      setQuantity(value);
    }
  };

  const handleAddToCart = () => {
    addToCart(competition, quantity);
    if (withNavigation) {
      navigate("/cart");
    }
  };

  return (
    <div className={`flex ${layout === "column" ? "flex-col gap-2" : "items-center gap-3"}`}>
      <div className="flex items-center">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-8 w-8 rounded-r-none"
          onClick={handleDecrement}
          aria-label="Decrease quantity"
        >
          <Minus className="h-4 w-4" />
        </Button>
        <Input
          type="number"
          min={1}
          max={competition.maxTicketsPerUser}
          value={quantity}
          onChange={handleInputChange}
          className="h-8 w-16 rounded-none text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-8 w-8 rounded-l-none"
          onClick={handleIncrement}
          aria-label="Increase quantity"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <Button
        type="button"
        variant={buttonVariant}
        className="gap-2"
        onClick={handleAddToCart}
      >
        <ShoppingCart className="h-4 w-4" />
        <span>Add to Cart</span>
      </Button>
    </div>
  );
}