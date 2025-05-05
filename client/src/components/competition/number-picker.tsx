import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertCircle, Shuffle } from "lucide-react";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";

interface NumberPickerProps {
  maxNumber: number;
  selectedCount: number;
  initialSelectedNumbers?: number[];
  onChange: (selectedNumbers: number[]) => void;
  disabled?: boolean;
}

export function NumberPicker({
  maxNumber,
  selectedCount,
  initialSelectedNumbers = [],
  onChange,
  disabled = false,
}: NumberPickerProps) {
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>(initialSelectedNumbers);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Ensure initialSelectedNumbers is reflected in state
  useEffect(() => {
    setSelectedNumbers(initialSelectedNumbers);
  }, [initialSelectedNumbers]);

  // Generate an array of numbers from 1 to maxNumber
  const availableNumbers = Array.from({ length: maxNumber }, (_, i) => i + 1);
  
  const handleNumberToggle = (number: number) => {
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
    const availablePool = Array.from({ length: maxNumber }, (_, i) => i + 1);
    
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
    
    setSelectedNumbers(randomNumbers.sort((a, b) => a - b));
  };
  
  const handleApply = () => {
    onChange(selectedNumbers);
    setIsDialogOpen(false);
  };
  
  const handleClear = () => {
    setSelectedNumbers([]);
  };
  
  return (
    <div className="w-full">
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button 
            variant="outline" 
            className="w-full text-sm" 
            disabled={disabled}
          >
            {selectedNumbers.length > 0 
              ? `${selectedNumbers.length} Number${selectedNumbers.length !== 1 ? 's' : ''} Selected` 
              : 'Select Numbers'}
          </Button>
        </DialogTrigger>
        
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Select Your Numbers</DialogTitle>
            <DialogDescription>
              Choose {selectedCount} number{selectedCount !== 1 ? 's' : ''} from 1 to {maxNumber}.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-5 gap-2 py-4">
            {availableNumbers.map(number => (
              <div
                key={number}
                className={`
                  flex items-center justify-center w-10 h-10 rounded-full cursor-pointer border
                  ${selectedNumbers.includes(number) 
                    ? 'bg-[#002147] text-white border-[#002147]'
                    : 'bg-white text-gray-800 border-gray-200 hover:border-[#002147]'}
                  ${(selectedNumbers.length >= selectedCount && !selectedNumbers.includes(number))
                    ? 'opacity-50 cursor-not-allowed'
                    : ''}
                `}
                onClick={() => handleNumberToggle(number)}
              >
                {number}
              </div>
            ))}
          </div>
          
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                className="flex items-center gap-2"
                onClick={handleLuckyDip}
              >
                <Shuffle className="h-4 w-4" /> Lucky Dip
              </Button>
              
              <Button 
                variant="outline" 
                onClick={handleClear}
              >
                Clear All
              </Button>
            </div>
            
            {selectedNumbers.length !== selectedCount && (
              <div className="text-xs text-amber-500 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Please select exactly {selectedCount} numbers
              </div>
            )}
            
            <div className="flex justify-between">
              <Button 
                variant="outline" 
                onClick={() => setIsDialogOpen(false)}
              >
                Cancel
              </Button>
              
              <Button 
                onClick={handleApply}
                disabled={selectedNumbers.length !== selectedCount}
              >
                Apply
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {selectedNumbers.length > 0 && (
        <div className="mt-2">
          <div className="text-xs text-muted-foreground mb-1">Your selected numbers:</div>
          <div className="flex flex-wrap gap-1">
            {selectedNumbers.map(number => (
              <span 
                key={number}
                className="inline-flex items-center justify-center bg-[#002147] text-white text-xs rounded-full h-5 w-5"
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