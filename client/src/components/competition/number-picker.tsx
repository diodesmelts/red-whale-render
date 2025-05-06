import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertCircle, Shuffle, Dice5, Lock } from "lucide-react";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface NumberPickerProps {
  maxNumber: number;
  selectedCount: number;
  initialSelectedNumbers?: number[];
  onChange: (selectedNumbers: number[]) => void;
  disabled?: boolean;
  competitionId?: number;
}

export function NumberPicker({
  maxNumber,
  selectedCount,
  initialSelectedNumbers = [],
  onChange,
  disabled = false,
  competitionId,
}: NumberPickerProps) {
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>(initialSelectedNumbers);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [takenNumbers, setTakenNumbers] = useState<number[]>([]);
  const { toast } = useToast();
  
  // Ensure initialSelectedNumbers is reflected in state
  useEffect(() => {
    setSelectedNumbers(initialSelectedNumbers);
  }, [initialSelectedNumbers]);

  // Fetch taken numbers when the dialog opens
  useEffect(() => {
    if (isDialogOpen && competitionId) {
      fetchTakenNumbers();
    }
  }, [isDialogOpen, competitionId]);

  const fetchTakenNumbers = async () => {
    try {
      // This is a placeholder. You would need to implement this API endpoint
      // to return numbers that are already taken by other users
      const response = await apiRequest("GET", `/api/competitions/${competitionId}/taken-numbers`);
      const data = await response.json();
      setTakenNumbers(data.takenNumbers || []);
    } catch (error) {
      console.error("Failed to fetch taken numbers:", error);
      // For now, we'll use a placeholder set of taken numbers for demonstration
      setTakenNumbers([2, 15, 27, 42, 56, 78, 91]);
    }
  };

  // Generate an array of numbers from 1 to maxNumber
  const availableNumbers = Array.from({ length: maxNumber }, (_, i) => i + 1);
  
  const isNumberTaken = (number: number) => {
    return takenNumbers.includes(number) && !initialSelectedNumbers.includes(number);
  };
  
  const handleNumberToggle = (number: number) => {
    // Don't allow selecting numbers that are taken by others
    if (isNumberTaken(number)) return;
    
    if (selectedNumbers.includes(number)) {
      // Remove number if already selected
      setSelectedNumbers(prev => prev.filter(n => n !== number));
    } else if (selectedNumbers.length < selectedCount) {
      // Add number if we haven't reached the limit
      setSelectedNumbers(prev => [...prev, number]);
    }
  };
  
  const handleLuckyDip = () => {
    // Generate random non-repeating numbers
    const randomNumbers: number[] = [];
    // Filter out numbers that are already taken
    const availablePool = Array.from({ length: maxNumber }, (_, i) => i + 1)
      .filter(num => !isNumberTaken(num));
    
    // Handle case where there aren't enough numbers available
    if (availablePool.length < selectedCount) {
      toast({
        title: "Not enough numbers available",
        description: `Only ${availablePool.length} numbers are available. Please try again or select manually.`,
        variant: "destructive",
      });
      return;
    }
    
    for (let i = 0; i < selectedCount; i++) {
      if (availablePool.length === 0) break;
      
      // Pick a random index from the remaining pool
      const randomIndex = Math.floor(Math.random() * availablePool.length);
      // Get the number at that index
      const selectedNumber = availablePool[randomIndex];
      // Remove the number from the pool to avoid duplicates
      availablePool.splice(randomIndex, 1);
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
  
  const handleApply = () => {
    onChange(selectedNumbers);
    setIsDialogOpen(false);
    
    if (selectedNumbers.length === selectedCount) {
      toast({
        title: "Numbers Selected",
        description: `You've selected: ${selectedNumbers.join(", ")}`,
        variant: "default",
      });
    }
  };
  
  const handleClear = () => {
    setSelectedNumbers([]);
  };
  
  return (
    <div className="w-full" data-testid="number-picker-component">
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button 
            variant="outline" 
            className="w-full text-sm flex items-center justify-center gap-2" 
            disabled={disabled}
            data-testid="number-picker-trigger"
          >
            {selectedNumbers.length > 0 
              ? (
                <>
                  <div className="bg-[#002147] text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                    {selectedNumbers.length}
                  </div>
                  <span>Number{selectedNumbers.length !== 1 ? 's' : ''} Selected</span>
                </>
              ) 
              : (
                <>
                  <Dice5 className="h-4 w-4" />
                  <span>Select Your Numbers</span>
                </>
              )}
          </Button>
        </DialogTrigger>
        
        <DialogContent className="sm:max-w-md" data-testid="number-picker-dialog">
          <DialogHeader>
            <DialogTitle className="text-[#002147] flex items-center gap-2">
              <Dice5 className="h-5 w-5" />
              Select Your Lucky Numbers
            </DialogTitle>
            <DialogDescription>
              Choose {selectedCount} unique number{selectedCount !== 1 ? 's' : ''} from 1 to {maxNumber} for your ticket{selectedCount !== 1 ? 's' : ''}.
            </DialogDescription>
          </DialogHeader>
          
          <div className="max-h-[280px] overflow-y-auto pr-2 my-2 custom-scrollbar">
            <div className="grid grid-cols-5 gap-2 py-2" data-testid="number-grid">
              {availableNumbers.map(number => {
                const isTaken = isNumberTaken(number);
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
                      ${(selectedNumbers.length >= selectedCount && !selectedNumbers.includes(number) && !isTaken)
                        ? 'opacity-50 cursor-not-allowed'
                        : ''}
                    `}
                    onClick={() => handleNumberToggle(number)}
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
                onClick={handleClear}
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
            
            {selectedNumbers.length !== selectedCount && (
              <div className="text-xs text-amber-500 flex items-center gap-1 bg-amber-50 p-2 rounded border border-amber-100">
                <AlertCircle className="h-3 w-3" />
                Please select exactly {selectedCount} number{selectedCount !== 1 ? 's' : ''} to continue
              </div>
            )}
            
            <DialogFooter className="flex justify-between sm:justify-between gap-2">
              <Button 
                variant="outline" 
                onClick={() => setIsDialogOpen(false)}
                className="border-gray-300"
              >
                Cancel
              </Button>
              
              <Button 
                onClick={handleApply}
                disabled={selectedNumbers.length !== selectedCount}
                className="bg-[#002147] hover:bg-[#002147]/90"
                data-testid="apply-numbers-btn"
              >
                Apply Selection
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
      
      {selectedNumbers.length > 0 && (
        <div className="mt-2 bg-[#002147]/5 p-2 rounded-md" data-testid="selected-numbers-display">
          <div className="text-xs font-medium text-[#002147] mb-1">Your selected numbers:</div>
          <div className="flex flex-wrap gap-1">
            {selectedNumbers.map(number => (
              <span 
                key={number}
                className="inline-flex items-center justify-center bg-[#002147] text-white text-xs rounded-full h-6 w-6 shadow-sm"
                data-testid={`selected-number-${number}`}
              >
                {number}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}