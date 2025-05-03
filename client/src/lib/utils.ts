import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Add animation utility classes
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes bounce-slow {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-10px); }
  }
  @keyframes pulse-slow {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
  }
  @keyframes spin-slow {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  .animate-bounce-slow {
    animation: bounce-slow 6s ease-in-out infinite;
  }
  .animate-pulse-slow {
    animation: pulse-slow 4s ease-in-out infinite;
  }
  .animate-spin-slow {
    animation: spin-slow 10s linear infinite;
  }
`;
document.head.appendChild(styleSheet);

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
    case "household":
      return "category-household";
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
 * - Special handling for Render environment with API domain separation
 */
export function getImageUrl(url: string | null | undefined): string {
  if (!url) return '';
  
  // Clean the URL (remove extra spaces)
  const cleanUrl = url.trim();
  
  // Return empty string for empty URLs
  if (cleanUrl === '') return '';
  
  // Environment detection - critical for Render
  const isProduction = import.meta.env.MODE === 'production';
  const hostname = window.location.hostname;
  const isRender = hostname.includes('onrender.com');
  
  // Debug logging for image URL resolution
  console.log(`🖼️ Processing image URL: "${cleanUrl}"`, {
    isProduction,
    hostname,
    isRender,
    origin: window.location.origin
  });
  
  // Already absolute URL (http/https) or data URL or Cloudinary
  if (
    cleanUrl.startsWith('http') || 
    cleanUrl.startsWith('data:') || 
    cleanUrl.includes('cloudinary.com')
  ) {
    console.log(`🖼️ Using absolute URL as is: "${cleanUrl}"`);
    return cleanUrl;
  }
  
  // Fix paths with unwanted prefixes
  let fixedPath = cleanUrl;
  // Remove any /./ patterns that might appear
  fixedPath = fixedPath.replace('/./uploads', '/uploads');
  
  // Ensure it starts with a slash
  if (!fixedPath.startsWith('/')) {
    fixedPath = '/' + fixedPath;
  }
  
  // For Render environment, we need to handle the API domain differently
  if (isProduction && isRender) {
    // The render web service URL where images are hosted
    // Assuming format: app-name.onrender.com, the API would be at api-app-name.onrender.com
    // or app-name-api.onrender.com depending on your naming convention
    
    // Get the application domain (remove any subdomains like 'www')
    const currentDomain = hostname;
    
    // This handles either main app -> API or render deployment hostname
    let apiDomain;
    
    // If URL is from same origin, use the same origin
    if (fixedPath.startsWith('/uploads/')) {
      // Assume uploads are on the same domain in Render
      apiDomain = window.location.origin;
      console.log(`🖼️ Using same domain for uploads: "${apiDomain}${fixedPath}"`);
    } else {
      // For other paths, use the current domain
      apiDomain = window.location.origin;
      console.log(`🖼️ Using current domain for API: "${apiDomain}${fixedPath}"`);
    }
    
    return `${apiDomain}${fixedPath}`;
  }
  
  // Standard behavior for non-Render environments
  const finalUrl = `${window.location.origin}${fixedPath}`;
  console.log(`🖼️ Final image URL: "${finalUrl}"`);
  return finalUrl;
}
