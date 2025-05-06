import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { ShoppingCart, Check, Shuffle, AlertCircle } from "lucide-react";
import { Dice5 } from "lucide-react";
import { Lock } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { Competition } from "@shared/schema";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";

// Define response type for taken numbers API
interface TakenNumbersResponse {
  competitionId: number;
  takenNumbers: number[];
}
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
  quantity?: number; // Allow quantity to be passed from parent component
}

export function AddToCart({ 
  competition, 
  layout = "row", 
  buttonVariant = "default",
  withNavigation = false,
  showNumberPicker = false,
  quantity = 1, // Default to 1 if not provided
}: AddToCartProps) {
  const [isNumberPickerOpen, setIsNumberPickerOpen] = useState(false);
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const { addToCart } = useCart();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  // Fetch taken numbers from the API
  const { data: takenNumbersData, isLoading: isLoadingTakenNumbers } = useQuery<TakenNumbersResponse>({
    queryKey: ['/api/competitions', competition.id, 'taken-numbers'],
    // Only fetch when the number picker is open
    enabled: isNumberPickerOpen
  });

  // We've replaced the increment/decrement/input functions with a single slider handler

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

  // Function for Lucky Dip
  const handleLuckyDip = () => {
    // Get taken numbers from API or use fallback
    const takenNumbers = takenNumbersData?.takenNumbers || [2, 15, 27, 42, 56, 78, 91];
    
    // Create pool of available numbers by filtering out taken numbers
    const availablePool = Array.from(
      { length: competition.totalTickets }, 
      (_, i) => i + 1
    ).filter(number => !takenNumbers.includes(number));
    
    // Handle case where there aren't enough available numbers
    if (availablePool.length < quantity) {
      toast({
        title: "Not enough numbers available",
        description: `Only ${availablePool.length} numbers are available. Please try again later or select manually.`,
        variant: "destructive",
      });
      return;
    }
    
    // Generate random non-repeating numbers
    const randomNumbers: number[] = [];
    const shuffledPool = [...availablePool];
    
    for (let i = 0; i < quantity; i++) {
      if (shuffledPool.length === 0) break;
      
      // Pick a random index from the remaining pool
      const randomIndex = Math.floor(Math.random() * shuffledPool.length);
      // Get the number at that index
      const selectedNumber = shuffledPool[randomIndex];
      // Remove the number from the pool to avoid duplicates
      shuffledPool.splice(randomIndex, 1);
      // Add the number to our selection
      randomNumbers.push(selectedNumber);
    }
    
    const sortedNumbers = randomNumbers.sort((a, b) => a - b);
    setSelectedNumbers(sortedNumbers);
    
    toast({
      title: "Lucky Dip",
      description: `Randomly selected numbers: ${sortedNumbers.join(", ")}`,
      variant: "default",
    });
  };

  // When the quantity prop changes, we may need to trim selected numbers
  useEffect(() => {
    if (selectedNumbers.length > quantity) {
      setSelectedNumbers(selectedNumbers.slice(0, quantity));
    }
  }, [quantity, selectedNumbers]);

  return (
    <>
      <div className="w-full">
        <Button
          type="button"
          variant={buttonVariant}
          className="gap-2 w-full"
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
              <DialogTitle className="text-[#002147] flex items-center gap-2">
                <Dice5 className="h-5 w-5" />
                Select Your Lucky Numbers
              </DialogTitle>
              <DialogDescription>
                Choose {quantity} unique number{quantity !== 1 ? 's' : ''} from 1 to {competition.totalTickets} for your ticket{quantity !== 1 ? 's' : ''}.
              </DialogDescription>
            </DialogHeader>
            
            <div className="max-h-[280px] overflow-y-auto pr-2 my-2 custom-scrollbar">
              <div className="grid grid-cols-5 gap-2 py-2" data-testid="number-grid">
                {Array.from({ length: competition.totalTickets }, (_, i) => i + 1).map(number => {
                  // Get taken numbers from API or use fallback
                  const takenNumbers = takenNumbersData?.takenNumbers || [2, 15, 27, 42, 56, 78, 91];
                  const isTaken = takenNumbers.includes(number) && !selectedNumbers.includes(number);
                  
                  return (
                    <div
                      key={number}
                      data-testid={`number-${number}`}
                      className={`
                        flex items-center justify-center w-10 h-10 rounded-full border relative
                        ${selectedNumbers.includes(number) 
                          ? 'bg-[#002147] text-white border-[#002147] shadow-md transform scale-105 transition-all'
                          : isTaken 
                            ? 'bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed opacity-70' 
                            : 'bg-white text-gray-800 border-gray-200 hover:border-[#002147] hover:shadow transition-all cursor-pointer'}
                        ${(selectedNumbers.length >= quantity && !selectedNumbers.includes(number) && !isTaken)
                          ? 'opacity-50 cursor-not-allowed'
                          : ''}
                      `}
                      onClick={() => {
                        if (isTaken) return;
                        
                        if (selectedNumbers.includes(number)) {
                          setSelectedNumbers(prev => prev.filter(n => n !== number));
                        } else if (selectedNumbers.length < quantity) {
                          setSelectedNumbers(prev => [...prev, number]);
                        }
                      }}
                      title={isTaken ? "This number is already taken" : ""}
                    >
                      {isTaken ? (
                        <>
                          {number}
                          <Lock className="absolute top-0 right-0 h-3 w-3 text-gray-400 -mt-1 -mr-1" />
                        </>
                      ) : (
                        number
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <Button 
                  variant="outline" 
                  className="flex items-center gap-2 bg-[#bbd665]/10 border-[#bbd665] text-[#002147] hover:bg-[#bbd665]/20"
                  onClick={handleLuckyDip}
                  data-testid="lucky-dip-btn"
                >
                  <Shuffle className="h-4 w-4" /> Lucky Dip
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={() => setSelectedNumbers([])}
                  className="border-gray-200 text-gray-700 hover:bg-gray-100"
                  data-testid="clear-numbers-btn"
                >
                  Clear All
                </Button>
              </div>
              
              {selectedNumbers.length > 0 && (
                <div className="bg-[#002147]/5 p-2 rounded-md">
                  <div className="text-xs font-medium text-[#002147] mb-1">Your selection:</div>
                  <div className="flex flex-wrap gap-1">
                    {selectedNumbers.map(number => (
                      <span 
                        key={number}
                        className="inline-flex items-center justify-center bg-[#002147] text-white text-xs rounded-full h-6 w-6 shadow-sm"
                      >
                        {number}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {selectedNumbers.length !== quantity && (
                <div className="text-xs text-amber-500 flex items-center gap-1 bg-amber-50 p-2 rounded border border-amber-100">
                  <AlertCircle className="h-3 w-3" />
                  Please select exactly {quantity} number{quantity !== 1 ? 's' : ''} to continue
                </div>
              )}
            
              <DialogFooter className="flex justify-between sm:justify-between gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setIsNumberPickerOpen(false)}
                  className="border-gray-300"
                >
                  Cancel
                </Button>
                
                <Button 
                  onClick={handleNumberPickerSave} 
                  disabled={selectedNumbers.length !== quantity}
                  className="bg-[#002147] hover:bg-[#002147]/90 flex items-center gap-2 text-white"
                  data-testid="save-numbers-btn"
                >
                  <Check className="h-4 w-4" />
                  Save & Add to Cart
                </Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}