import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { ShoppingCart, Plus, Minus } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { Competition } from "@shared/schema";
import { useLocation } from "wouter";
import NumberPicker from "../competition/number-picker";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";

interface AddToCartProps {
  competition: Competition;
  layout?: "row" | "column";
  buttonVariant?: "default" | "outline" | "secondary" | "destructive" | "ghost" | "link";
  withNavigation?: boolean;
  showNumberPicker?: boolean;
}

export function AddToCart({ 
  competition, 
  layout = "row", 
  buttonVariant = "default",
  withNavigation = false,
  showNumberPicker = false,
}: AddToCartProps) {
  const [quantity, setQuantity] = useState(1);
  const [isNumberPickerOpen, setIsNumberPickerOpen] = useState(false);
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const { addToCart } = useCart();
  const [, navigate] = useLocation();

  const handleDecrement = () => {
    setQuantity((prev) => {
      const newQuantity = prev > 1 ? prev - 1 : 1;
      // Trim the selected numbers if we decrease the quantity
      if (selectedNumbers.length > newQuantity) {
        setSelectedNumbers(selectedNumbers.slice(0, newQuantity));
      }
      return newQuantity;
    });
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
      setSelectedNumbers(selectedNumbers.slice(0, 1));
    } else if (value > competition.maxTicketsPerUser) {
      setQuantity(competition.maxTicketsPerUser);
      setSelectedNumbers(selectedNumbers.slice(0, competition.maxTicketsPerUser));
    } else {
      setQuantity(value);
      if (selectedNumbers.length > value) {
        setSelectedNumbers(selectedNumbers.slice(0, value));
      }
    }
  };

  const handleAddToCart = () => {
    if (showNumberPicker && selectedNumbers.length !== quantity) {
      setIsNumberPickerOpen(true);
      return;
    }
    
    addToCart(competition, quantity, selectedNumbers);
    if (withNavigation) {
      navigate("/cart");
    }
  };

  const handleNumberPickerSave = () => {
    // Ensure we have the correct number of tickets selected
    if (selectedNumbers.length === quantity) {
      addToCart(competition, quantity, selectedNumbers);
      setIsNumberPickerOpen(false);
      if (withNavigation) {
        navigate("/cart");
      }
    }
  };

  return (
    <>
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

      {showNumberPicker && (
        <Dialog open={isNumberPickerOpen} onOpenChange={setIsNumberPickerOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Select Your Numbers</DialogTitle>
              <DialogDescription>
                Choose {quantity} unique number{quantity !== 1 ? 's' : ''} for your ticket{quantity !== 1 ? 's' : ''}.
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-4">
              <NumberPicker
                totalTickets={competition.totalTickets}
                ticketCount={quantity}
                selectedNumbers={selectedNumbers}
                setSelectedNumbers={setSelectedNumbers}
              />
            </div>
            
            <DialogFooter>
              <Button 
                onClick={handleNumberPickerSave} 
                disabled={selectedNumbers.length !== quantity}
              >
                Save & Add to Cart
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}