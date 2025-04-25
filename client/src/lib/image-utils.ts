/**
 * Processes an image URL to ensure it's properly formatted based on the environment
 * 
 * This handles relative paths, ensuring they point to the correct location
 * in both development and production environments.
 */
export function processImageUrl(imageUrl: string | null): string {
  if (!imageUrl) return '';
  
  const isProduction = window.location.hostname.includes('bluewhalecompetitions.co.uk');
  const hostname = window.location.hostname;
  const isRender = hostname.includes('onrender.com');
  const origin = window.location.origin;
  
  // Skip processing for already absolute URLs
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  
  // If Cloudinary URL
  if (imageUrl.includes('res.cloudinary.com')) {
    return imageUrl;
  }
  
  // Handle relative URLs - ensure they start with a slash
  const normalizedPath = imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`;
  
  // Log debugging information
  console.log('🖼️ Processing image URL:', normalizedPath, {
    isProduction,
    hostname,
    isRender,
    origin
  });
  
  // Use the current origin to build absolute URL
  const finalUrl = `${origin}${normalizedPath}`;
  console.log('🖼️ Final image URL:', finalUrl);
  
  return finalUrl;
}