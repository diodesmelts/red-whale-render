import { createContext, ReactNode, useContext, useEffect, useState, useCallback } from "react";
import { Competition } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export type CartItem = {
  competitionId: number;
  title: string;
  imageUrl: string | null;
  ticketPrice: number;
  ticketCount: number;
  selectedNumbers: number[];
  maxTicketsPerUser: number;
  totalTickets: number;
  addedAt: number; // Timestamp when the item was added to cart
  expiresAt: number; // Timestamp when the reservation expires
};

type CartContextType = {
  cartItems: CartItem[];
  cartCount: number;
  cartTotal: number;
  addToCart: (competition: Competition, quantity: number, selectedNumbers?: number[]) => void;
  updateCartItem: (competitionId: number, quantity: number, selectedNumbers?: number[]) => void;
  removeFromCart: (competitionId: number) => void;
  clearCart: () => void;
};

const CART_STORAGE_KEY = "bluewhale-cart";
// 30 minutes in milliseconds
const RESERVATION_TIME = 30 * 60 * 1000;

export const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const { toast } = useToast();

  // Load cart from localStorage on mount and remove expired items
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem(CART_STORAGE_KEY);
      if (savedCart) {
        const parsedCart = JSON.parse(savedCart);
        
        // Filter out expired items
        const now = Date.now();
        const validItems = parsedCart.filter(item => {
          // Keep items that don't have an expiration yet (for backwards compatibility)
          // or items that haven't expired yet
          return !item.expiresAt || item.expiresAt > now;
        });
        
        // If we filtered out items, show a notification
        if (validItems.length < parsedCart.length) {
          toast({
            title: "Some items in your cart have expired",
            description: "Items are reserved for 30 minutes before they become available to others.",
            variant: "destructive",
          });
        }
        
        setCartItems(validItems);
      }
    } catch (error) {
      console.error("Failed to load cart from localStorage:", error);
    }
  }, [toast]);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
    } catch (error) {
      console.error("Failed to save cart to localStorage:", error);
    }
  }, [cartItems]);
  
  // Periodically check for expired items (every 30 seconds)
  useEffect(() => {
    const checkExpiredItems = () => {
      const now = Date.now();
      setCartItems(prevItems => {
        // Check if any items are expired
        const validItems = prevItems.filter(item => {
          return !item.expiresAt || item.expiresAt > now;
        });
        
        // If we have removed items, return the new array, otherwise return the same array
        // to avoid unnecessary re-renders
        if (validItems.length < prevItems.length) {
          toast({
            title: "Some items in your cart have expired",
            description: "Items are reserved for 30 minutes before they become available to others.",
            variant: "destructive",
          });
          return validItems;
        }
        
        return prevItems;
      });
    };
    
    // Check every 30 seconds
    const interval = setInterval(checkExpiredItems, 30 * 1000);
    
    // Clean up interval when component unmounts
    return () => clearInterval(interval);
  }, [toast]);

  // Calculate cart total and count
  const cartCount = cartItems.reduce((total, item) => total + item.ticketCount, 0);
  const cartTotal = cartItems.reduce(
    (total, item) => total + item.ticketPrice * item.ticketCount, 
    0
  );

  const addToCart = (competition: Competition, quantity: number, selectedNumbers: number[] = []) => {
    if (quantity <= 0) return;

    setCartItems((prevItems) => {
      // Check if this competition is already in the cart
      const existingItemIndex = prevItems.findIndex(
        (item) => item.competitionId === competition.id
      );

      // If the competition exists in the cart, update the quantity
      if (existingItemIndex >= 0) {
        const item = prevItems[existingItemIndex];
        const newQuantity = Math.min(
          item.ticketCount + quantity,
          competition.maxTicketsPerUser
        );

        // If we're not adding any more tickets, don't update
        if (newQuantity === item.ticketCount) {
          toast({
            title: "Maximum tickets reached",
            description: `You can only purchase up to ${competition.maxTicketsPerUser} tickets for this competition.`,
            variant: "destructive",
          });
          return prevItems;
        }

        // Combine previously selected numbers with new ones
        const updatedNumbers = [...item.selectedNumbers, ...selectedNumbers].slice(0, newQuantity);

        const updatedItems = [...prevItems];
        updatedItems[existingItemIndex] = {
          ...item,
          ticketCount: newQuantity,
          selectedNumbers: updatedNumbers,
        };

        toast({
          title: "Cart updated",
          description: `Updated ${competition.title} ticket quantity to ${newQuantity}.`,
        });

        return updatedItems;
      }

      // Otherwise, add as a new item
      toast({
        title: "Added to cart",
        description: `${quantity} ticket${quantity !== 1 ? 's' : ''} for ${competition.title} added to your cart.`,
      });

      const now = Date.now();
      return [
        ...prevItems,
        {
          competitionId: competition.id,
          title: competition.title,
          imageUrl: competition.imageUrl,
          ticketPrice: competition.ticketPrice,
          ticketCount: quantity,
          selectedNumbers: selectedNumbers.slice(0, quantity),
          maxTicketsPerUser: competition.maxTicketsPerUser,
          totalTickets: competition.totalTickets,
          addedAt: now,
          expiresAt: now + RESERVATION_TIME,
        },
      ];
    });
  };

  const updateCartItem = (competitionId: number, quantity: number, selectedNumbers?: number[]) => {
    if (quantity <= 0) {
      removeFromCart(competitionId);
      return;
    }

    setCartItems((prevItems) => {
      const item = prevItems.find((item) => item.competitionId === competitionId);
      if (!item) return prevItems;

      // Make sure we don't exceed the maximum tickets
      const newQuantity = Math.min(quantity, item.maxTicketsPerUser);
      
      if (newQuantity === item.ticketCount && !selectedNumbers) {
        return prevItems;
      }

      // Handle the selected numbers
      let updatedNumbers = item.selectedNumbers;
      
      // If new numbers are provided, use them
      if (selectedNumbers) {
        updatedNumbers = selectedNumbers.slice(0, newQuantity);
      } 
      // If quantity decreased, trim the selected numbers
      else if (newQuantity < item.ticketCount) {
        updatedNumbers = item.selectedNumbers.slice(0, newQuantity);
      }

      return prevItems.map((item) =>
        item.competitionId === competitionId
          ? { 
              ...item, 
              ticketCount: newQuantity, 
              selectedNumbers: updatedNumbers,
              // Keep the original timestamps when updating
              addedAt: item.addedAt || Date.now(),
              expiresAt: item.expiresAt || (Date.now() + RESERVATION_TIME)
            }
          : item
      );
    });
  };

  const removeFromCart = (competitionId: number) => {
    setCartItems((prevItems) => {
      const item = prevItems.find((item) => item.competitionId === competitionId);
      if (!item) return prevItems;

      toast({
        title: "Removed from cart",
        description: `${item.title} removed from your cart.`,
      });

      return prevItems.filter((item) => item.competitionId !== competitionId);
    });
  };

  const clearCart = () => {
    setCartItems([]);
    toast({
      title: "Cart cleared",
      description: "All items have been removed from your cart.",
    });
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        cartCount,
        cartTotal,
        addToCart,
        updateCartItem,
        removeFromCart,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}