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

  // Fetch ticket statuses when the dialog opens
  useEffect(() => {
    if (isDialogOpen && competitionId) {
      console.log(`🎟️ Fetching ticket statuses for competition ${competitionId}`);
      
      // New unified ticket status approach
      const fetchTicketStatuses = async () => {
        try {
          // Use the new unified ticket status endpoint
          const response = await fetch(`/api/competitions/${competitionId}/ticket-status`);
          
          if (response.ok) {
            const ticketStatus = await response.json();
            
            console.log(`🎟️ Received ticket statuses for competition ${competitionId}:`, {
              purchased: ticketStatus.ticketStatuses.purchased.length,
              reserved: ticketStatus.ticketStatuses.reserved.length,
              available: ticketStatus.ticketStatuses.available.length
            });
            
            // Combine purchased and reserved tickets as taken
            const takenTickets = [
              ...ticketStatus.ticketStatuses.purchased,
              ...ticketStatus.ticketStatuses.reserved
            ];
            
            console.log(`🎟️ Setting ${takenTickets.length} numbers as taken`);
            setTakenNumbers(takenTickets);
          } else {
            console.error('Failed to fetch ticket statuses:', await response.text());
            
            // Fallback to legacy endpoint if new endpoint fails
            console.log(`🔄 Falling back to legacy endpoint for competition ${competitionId}`);
            fetchTakenNumbers();
          }
        } catch (error) {
          console.error('Error fetching ticket statuses:', error);
          // Fall back to legacy implementation
          fetchTakenNumbers();
        }
      };

      fetchTicketStatuses();
    }
  }, [isDialogOpen, competitionId]);

  const fetchTakenNumbers = async () => {
    try {
      console.log(`🔍 Fetching taken numbers for competition ${competitionId}`);
      
      // COMPARISON DATA: Get admin stats to compare (this request is made just for debugging)
      try {
        const adminStatsResponse = await fetch(`/api/competitions/${competitionId}/admin-stats`);
        if (adminStatsResponse.ok) {
          const adminStats = await adminStatsResponse.json();
          console.log(`📊 ADMIN VIEW: Competition ${competitionId} has:`, {
            total: adminStats.totalTickets,
            purchased: adminStats.purchasedTickets,
            availableCount: adminStats.availableTickets,
            purchasedNumbers: adminStats.allNumbers?.purchased?.length,
            firstFewPurchased: adminStats.allNumbers?.purchased?.slice(0, 5)
          });
        }
      } catch (statsError) {
        console.error('❌ Error fetching admin stats for comparison:', statsError);
      }
      
      // Use a POST for active cart items (needed to sync with other users' carts)
      // First make a request to fetch active cart items with an empty cart
      try {
        // Using the updated endpoint path that's more explicit
        const cartResponse = await fetch(`/api/competitions/cart-items/${competitionId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ cartItems: [] }),
          credentials: 'include'
        });
        
        if (cartResponse.ok) {
          const cartData = await cartResponse.json();
          console.log(`✅ Received ${cartData.inCartNumbers?.length || 0} active cart items:`, {
            inCartNumbers: cartData.inCartNumbers?.slice(0, 5) // Just show first 5 for debugging
          });
          
          // Now fetch taken numbers
          try {
            const takenResponse = await fetch(`/api/competitions/${competitionId}/taken-numbers`, {
              credentials: 'include'
            });
            
            if (takenResponse.ok) {
              const takenData = await takenResponse.json();
              console.log(`✅ Received ${takenData.takenNumbers?.length || 0} taken numbers:`, {
                takenNumbers: takenData.takenNumbers?.slice(0, 10) // Just show first 10 for debugging
              });
              
              // Combine the two sets of numbers
              const allTakenNumbers = [
                ...(takenData.takenNumbers || []),
                ...(cartData.inCartNumbers || [])
              ];
              
              // Remove duplicates using Set
              const uniqueTakenNumbers = Array.from(new Set(allTakenNumbers));
              console.log(`🔄 Combined ${uniqueTakenNumbers.length} unique unavailable numbers:`, {
                firstFew: uniqueTakenNumbers.slice(0, 10)
              });
              
              setTakenNumbers(uniqueTakenNumbers);
              return;
            } else {
              console.warn(`⚠️ Failed to fetch taken numbers: ${takenResponse.status}`);
            }
          } catch (takenError) {
            console.error('❌ Error fetching taken numbers:', takenError);
          }
          
          // If we got here, the taken numbers request failed but cart request succeeded
          console.log('⚠️ Using only cart data because taken-numbers endpoint failed');
          setTakenNumbers(cartData.inCartNumbers || []);
          return;
        } else {
          console.warn(`⚠️ Failed to fetch cart items: ${cartResponse.status}`);
        }
      } catch (cartError) {
        console.error('❌ Error fetching cart items:', cartError);
      }
      
      // If all requests fail, use currently stored data or an empty array
      console.log('ℹ️ Using fallback for taken numbers');
      setTakenNumbers(prevTakenNumbers => prevTakenNumbers.length ? prevTakenNumbers : []);
    } catch (error) {
      console.error("❌ Critical error fetching taken numbers:", error);
      // Keep the previous state to avoid UI disruption
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