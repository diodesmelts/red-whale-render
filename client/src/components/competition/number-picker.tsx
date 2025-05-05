import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shuffle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface NumberPickerProps {
  totalTickets: number;
  ticketCount: number;
  selectedNumbers: number[];
  setSelectedNumbers: (numbers: number[]) => void;
}

export default function NumberPicker({
  totalTickets,
  ticketCount,
  selectedNumbers,
  setSelectedNumbers,
}: NumberPickerProps) {
  const { toast } = useToast();
  const [availableNumbers, setAvailableNumbers] = useState<number[]>([]);
  
  useEffect(() => {
    // Generate array of all available numbers (1 to totalTickets)
    const numbers = Array.from({ length: totalTickets }, (_, i) => i + 1);
    setAvailableNumbers(numbers);
  }, [totalTickets]);

  // Reset selected numbers when ticket count changes
  useEffect(() => {
    if (selectedNumbers.length !== ticketCount) {
      setSelectedNumbers([]);
    }
  }, [ticketCount, selectedNumbers.length, setSelectedNumbers]);

  const handleNumberClick = (number: number) => {
    if (selectedNumbers.includes(number)) {
      // Remove number if already selected
      setSelectedNumbers(selectedNumbers.filter(n => n !== number));
    } else if (selectedNumbers.length < ticketCount) {
      // Add number if limit not reached
      setSelectedNumbers([...selectedNumbers, number]);
    } else {
      // Alert user they need to deselect a number first
      toast({
        title: "Maximum numbers selected",
        description: `You can only select ${ticketCount} numbers. Deselect a number first.`,
        variant: "destructive",
      });
    }
  };

  const handleLuckyDip = () => {
    // Generate random unique numbers equal to ticketCount
    const shuffled = [...availableNumbers].sort(() => 0.5 - Math.random());
    const randomNumbers = shuffled.slice(0, ticketCount);
    setSelectedNumbers(randomNumbers);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Select Your Numbers</h3>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleLuckyDip}
          className="flex items-center gap-1"
        >
          <Shuffle className="h-4 w-4" />
          Lucky Dip
        </Button>
      </div>
      
      <div className="p-4 border rounded-md bg-slate-50">
        <p className="mb-3 text-sm text-muted-foreground">
          {selectedNumbers.length === 0 
            ? `Please select ${ticketCount} number${ticketCount > 1 ? 's' : ''}`
            : selectedNumbers.length < ticketCount 
              ? `Selected ${selectedNumbers.length}/${ticketCount} - pick ${ticketCount - selectedNumbers.length} more`
              : `Selected ${ticketCount}/${ticketCount} numbers`
          }
        </p>
        
        <div className="grid grid-cols-10 gap-2">
          {availableNumbers.map((number) => (
            <Badge
              key={number}
              variant={selectedNumbers.includes(number) ? "default" : "outline"}
              className={`
                cursor-pointer h-8 w-8 flex items-center justify-center p-0 
                ${selectedNumbers.includes(number)
                  ? 'bg-[#002147] hover:bg-[#003167]'
                  : 'hover:bg-slate-100'
                }
              `}
              onClick={() => handleNumberClick(number)}
            >
              {number}
            </Badge>
          ))}
        </div>
      </div>
      
      {selectedNumbers.length > 0 && (
        <div className="mt-2">
          <h4 className="text-sm font-medium mb-1">Your selected numbers:</h4>
          <div className="flex flex-wrap gap-1">
            {selectedNumbers.map(number => (
              <Badge key={`selected-${number}`} className="bg-[#002147]">
                {number}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}