import { createContext, ReactNode, useContext, useEffect, useState } from "react";
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

export const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const { toast } = useToast();

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem(CART_STORAGE_KEY);
      if (savedCart) {
        setCartItems(JSON.parse(savedCart));
      }
    } catch (error) {
      console.error("Failed to load cart from localStorage:", error);
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
    } catch (error) {
      console.error("Failed to save cart to localStorage:", error);
    }
  }, [cartItems]);

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
          ? { ...item, ticketCount: newQuantity, selectedNumbers: updatedNumbers }
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