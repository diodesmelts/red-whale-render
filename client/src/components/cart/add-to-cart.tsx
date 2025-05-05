import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { ShoppingCart, Plus, Minus, Check } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { Competition } from "@shared/schema";
import { useLocation } from "wouter";
import { NumberPicker } from "@/components/competition/number-picker";
import { useToast } from "@/hooks/use-toast";
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
  const { toast } = useToast();

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
    // If number picker is enabled and we don't have the correct number of selected numbers
    if (showNumberPicker && selectedNumbers.length !== quantity) {
      // Open the number picker dialog instead
      setIsNumberPickerOpen(true);
      
      toast({
        title: "Select your numbers",
        description: `Please select ${quantity} number${quantity !== 1 ? 's' : ''} for your ticket${quantity !== 1 ? 's' : ''}.`,
      });
      return;
    }
    
    // Add to cart with any selected numbers (or empty array if number picker isn't enabled)
    addToCart(competition, quantity, selectedNumbers);
    
    // Show appropriate toast message based on whether numbers are selected
    if (selectedNumbers.length > 0) {
      toast({
        title: `${quantity} ticket${quantity !== 1 ? 's' : ''} added to cart`,
        description: `With your selected numbers: ${selectedNumbers.sort((a, b) => a - b).join(", ")}`,
        variant: "default",
      });
    } else {
      toast({
        title: `${quantity} ticket${quantity !== 1 ? 's' : ''} added to cart`,
        description: `For ${competition.title}`,
        variant: "default",
      });
    }
    
    // Navigate to cart if needed
    if (withNavigation) {
      navigate("/cart");
    }
  };

  const handleNumberPickerSave = () => {
    // Ensure we have the correct number of tickets selected
    if (selectedNumbers.length === quantity) {
      // Add to cart with the selected numbers
      addToCart(competition, quantity, selectedNumbers);
      
      // Show a confirmation toast with the selected numbers
      toast({
        title: "Numbers selected",
        description: `Your lucky numbers: ${selectedNumbers.sort((a, b) => a - b).join(", ")}`,
        variant: "default",
      });
      
      // Close the dialog
      setIsNumberPickerOpen(false);
      
      // Navigate to cart if needed
      if (withNavigation) {
        navigate("/cart");
      }
    } else {
      // Show an error toast if the correct number of tickets is not selected
      toast({
        title: "Selection incomplete",
        description: `Please select exactly ${quantity} numbers to continue.`,
        variant: "destructive",
      });
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
          <DialogTrigger asChild>
            <button 
              className="hidden" 
              data-testid="select-numbers-btn"
              onClick={() => setIsNumberPickerOpen(true)}
            >
              Open Number Picker
            </button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md" data-testid="number-picker-dialog">
            <DialogHeader>
              <DialogTitle>Select Your Numbers</DialogTitle>
              <DialogDescription>
                Choose {quantity} unique number{quantity !== 1 ? 's' : ''} for your ticket{quantity !== 1 ? 's' : ''}.
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-4">
              <NumberPicker
                maxNumber={competition.totalTickets}
                selectedCount={quantity}
                initialSelectedNumbers={selectedNumbers}
                onChange={setSelectedNumbers}
              />
            </div>
            
            <DialogFooter>
              <Button 
                onClick={handleNumberPickerSave} 
                disabled={selectedNumbers.length !== quantity}
                className="bg-[#002147] hover:bg-[#002147]/90 flex items-center gap-2"
                data-testid="save-numbers-btn"
              >
                <Check className="h-4 w-4" />
                Save & Add to Cart
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}