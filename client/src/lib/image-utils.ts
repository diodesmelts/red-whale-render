/**
 * This utility provides functions for handling image URLs across environments
 */

/**
 * Processes an image URL to ensure it works properly in both development and production environments
 * - In development: Converts relative URLs to absolute using the current origin
 * - In production: Uses the URL as-is (assuming it's already absolute)
 */
export function processImageUrl(imageUrl: string | null): string {
  if (!imageUrl) {
    return "https://placehold.co/400x300/1a1f2b/FFFFFF/png?text=No+Image"; 
  }
  
  // Log the image processing for debugging
  console.log(`🖼️ Processing image URL: "${imageUrl}"`, {
    isProduction: window.location.hostname.includes('bluewhalecompetitions.co.uk'),
    hostname: window.location.hostname,
    isRender: window.location.hostname.includes('onrender.com'),
    origin: window.location.origin
  });
  
  // If the URL is already absolute (starts with http), use it as is
  if (imageUrl.startsWith('http')) {
    console.log(`🖼️ Using absolute URL as is: "${imageUrl}"`);
    return imageUrl;
  }
  
  // If it's a relative URL starting with /uploads, make it absolute
  if (imageUrl.startsWith('/uploads/')) {
    const absoluteUrl = `${window.location.origin}${imageUrl}`;
    console.log(`🖼️ Final image URL: "${absoluteUrl}"`);
    return absoluteUrl;
  }
  
  // For any other case, return the URL as-is
  return imageUrl;
}