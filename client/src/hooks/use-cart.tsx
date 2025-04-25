import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useToast } from "@/hooks/use-toast";
import { Competition } from "@shared/schema";

export type CartItem = {
  competitionId: number;
  title: string;
  imageUrl: string | null;
  ticketPrice: number;
  ticketCount: number;
};

interface CartContextType {
  cartItems: CartItem[];
  cartCount: number;
  cartTotal: number;
  addToCart: (competition: Competition, ticketCount: number) => void;
  removeFromCart: (competitionId: number) => void;
  updateCartItem: (competitionId: number, ticketCount: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// Provider component that wraps parts of the app that need cart access
export function CartProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const { toast } = useToast();

  // Calculate derived values
  const cartCount = cartItems.reduce((total, item) => total + item.ticketCount, 0);
  const cartTotal = cartItems.reduce(
    (total, item) => total + item.ticketPrice * item.ticketCount, 
    0
  );

  // Initialize cart from local storage
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem('bw-cart');
      if (savedCart) {
        setCartItems(JSON.parse(savedCart));
      }
    } catch (error) {
      console.error('Failed to load cart from local storage:', error);
    }
  }, []);

  // Save cart to local storage on changes
  useEffect(() => {
    try {
      localStorage.setItem('bw-cart', JSON.stringify(cartItems));
    } catch (error) {
      console.error('Failed to save cart to local storage:', error);
    }
  }, [cartItems]);

  // Add competition tickets to cart
  const addToCart = (competition: Competition, ticketCount: number) => {
    if (ticketCount <= 0) {
      toast({
        title: "Invalid quantity",
        description: "Please select at least 1 ticket",
        variant: "destructive"
      });
      return;
    }

    // Check if this competition is already in the cart
    const existingIndex = cartItems.findIndex(
      item => item.competitionId === competition.id
    );

    if (existingIndex >= 0) {
      // Competition already in cart, update quantity
      const existingItem = cartItems[existingIndex];
      const newQuantity = existingItem.ticketCount + ticketCount;
      
      // Check if this would exceed max tickets per user
      if (newQuantity > competition.maxTicketsPerUser) {
        toast({
          title: "Maximum tickets exceeded",
          description: `You can only purchase up to ${competition.maxTicketsPerUser} tickets for this competition`,
          variant: "destructive"
        });
        return;
      }

      // Update quantity
      const newCartItems = [...cartItems];
      newCartItems[existingIndex] = {
        ...existingItem,
        ticketCount: newQuantity
      };
      setCartItems(newCartItems);
    } else {
      // New competition, add to cart
      const newCartItem: CartItem = {
        competitionId: competition.id,
        title: competition.title,
        imageUrl: competition.imageUrl,
        ticketPrice: competition.ticketPrice,
        ticketCount: ticketCount
      };
      setCartItems([...cartItems, newCartItem]);
    }

    toast({
      title: "Added to cart",
      description: `${ticketCount} ticket(s) for ${competition.title} added to your cart`,
    });
  };

  // Remove competition from cart
  const removeFromCart = (competitionId: number) => {
    setCartItems(cartItems.filter(item => item.competitionId !== competitionId));
    toast({
      title: "Removed from cart",
      description: "Item removed from your cart",
    });
  };

  // Update quantity for a specific competition
  const updateCartItem = (competitionId: number, ticketCount: number) => {
    if (ticketCount <= 0) {
      // Remove the item if quantity is 0 or negative
      removeFromCart(competitionId);
      return;
    }

    setCartItems(
      cartItems.map(item => 
        item.competitionId === competitionId
          ? { ...item, ticketCount }
          : item
      )
    );
  };

  // Clear the entire cart
  const clearCart = () => {
    setCartItems([]);
    toast({
      title: "Cart cleared",
      description: "All items have been removed from your cart",
    });
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        cartCount,
        cartTotal,
        addToCart,
        removeFromCart,
        updateCartItem,
        clearCart
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

// Custom hook to use the cart context
export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}