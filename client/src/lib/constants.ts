// Competition categories
export const COMPETITION_CATEGORIES = {
  FAMILY: "family",
  HOUSEHOLD: "household",
  CASH: "cash",
  ELECTRONICS: "electronics",
  TRAVEL: "travel",
  BEAUTY: "beauty",
};

// Category colors
export const CATEGORY_COLORS = {
  [COMPETITION_CATEGORIES.FAMILY]: {
    bg: "bg-yellow-500",
    text: "text-yellow-400",
    hover: "hover:bg-yellow-600",
    border: "border-yellow-400",
    glow: "shadow-[0_0_15px_rgba(255,193,7,0.5)]",
    icon: "fas fa-users",
  },
  [COMPETITION_CATEGORIES.HOUSEHOLD]: {
    bg: "bg-pink-500",
    text: "text-pink-400",
    hover: "hover:bg-pink-600",
    border: "border-pink-400",
    glow: "shadow-[0_0_15px_rgba(255,77,148,0.5)]",
    icon: "fas fa-blender",
  },
  [COMPETITION_CATEGORIES.CASH]: {
    bg: "bg-green-500",
    text: "text-green-400",
    hover: "hover:bg-green-600",
    border: "border-green-400",
    glow: "shadow-[0_0_15px_rgba(76,175,80,0.5)]",
    icon: "fas fa-pound-sign",
  },
  [COMPETITION_CATEGORIES.ELECTRONICS]: {
    bg: "bg-primary",
    text: "text-primary",
    hover: "hover:bg-primary/90",
    border: "border-primary",
    glow: "shadow-[0_0_15px_rgba(0,153,255,0.5)]",
    icon: "fas fa-laptop",
  },
  [COMPETITION_CATEGORIES.TRAVEL]: {
    bg: "bg-purple-500",
    text: "text-purple-500",
    hover: "hover:bg-purple-600",
    border: "border-purple-500",
    glow: "shadow-[0_0_15px_rgba(155,89,182,0.5)]",
    icon: "fas fa-plane",
  },
  [COMPETITION_CATEGORIES.BEAUTY]: {
    bg: "bg-rose-500",
    text: "text-rose-400",
    hover: "hover:bg-rose-600",
    border: "border-rose-400",
    glow: "shadow-[0_0_15px_rgba(244,63,94,0.5)]",
    icon: "fas fa-spa",
  },
};

// Mascot options
export const MASCOT_OPTIONS = [
  { value: "blue-whale", label: "Blue Whale", icon: "🐋" },
  { value: "dolphin", label: "Dolphin", icon: "🐬" },
  { value: "octopus", label: "Octopus", icon: "🐙" },
  { value: "shark", label: "Shark", icon: "🦈" },
  { value: "turtle", label: "Turtle", icon: "🐢" },
  { value: "penguin", label: "Penguin", icon: "🐧" },
];

// Payment methods
export const PAYMENT_METHODS = {
  CREDIT_CARD: "credit_card",
  APPLE_PAY: "apple_pay",
};

// URL to the Stripe.js library
export const STRIPE_JS_URL = "https://js.stripe.com/v3/";

// Competition sorting options
export const SORT_OPTIONS = {
  NEWEST: "newest",
  ENDING_SOON: "endingSoon",
  POPULAR: "popular",
};

// Entry status
export const ENTRY_STATUS = {
  PENDING: "pending",
  COMPLETED: "completed",
  FAILED: "failed",
};

// Claim status
export const CLAIM_STATUS = {
  PENDING: "pending",
  CLAIMED: "claimed",
  EXPIRED: "expired",
};
