import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency: string = "GBP"): string {
  // Format amount as currency
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount / 100);
}

export function formatDate(date: Date | string): string {
  // Format date to a user-friendly format
  if (typeof date === "string") {
    date = new Date(date);
  }
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function calculateTimeRemaining(endDate: Date | string): {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
} {
  const targetDate = typeof endDate === "string" ? new Date(endDate) : endDate;
  const now = new Date();
  const diff = targetDate.getTime() - now.getTime();

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true };
  }

  // Calculate time units
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return { days, hours, minutes, seconds, isExpired: false };
}

export function getCategoryColor(category: string): string {
  switch (category.toLowerCase()) {
    case "family":
      return "category-family";
    case "appliances":
      return "category-appliances";
    case "cash":
      return "category-cash";
    default:
      return "primary";
  }
}

export function truncateString(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength) + "...";
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return function(...args: Parameters<T>) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), delay);
  };
}

/**
 * Ensures an image URL is properly formatted for displaying in the app
 * - Absolute URLs (http/https) are returned as is
 * - Cloudinary URLs are returned as is
 * - Data URLs are returned as is
 * - Relative URLs (/uploads/*) have the current origin prepended
 */
export function getImageUrl(url: string | null | undefined): string {
  if (!url) return '';
  
  // Clean the URL (remove extra spaces)
  const cleanUrl = url.trim();
  
  // Return empty string for empty URLs
  if (cleanUrl === '') return '';
  
  // Already absolute URL (http/https) or data URL or Cloudinary
  if (
    cleanUrl.startsWith('http') || 
    cleanUrl.startsWith('data:') || 
    cleanUrl.includes('cloudinary.com')
  ) {
    return cleanUrl;
  }
  
  // Relative URL - add origin
  return `${window.location.origin}${cleanUrl}`;
}
