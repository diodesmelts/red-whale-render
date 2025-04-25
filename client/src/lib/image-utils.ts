/**
 * Processes an image URL to ensure it's properly formatted based on the environment
 * 
 * This handles relative paths, ensuring they point to the correct location
 * in both development and production environments.
 */
export function processImageUrl(imageUrl: string | null): string {
  if (!imageUrl) return "";

  // If the image URL is already absolute, return it as is
  if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
    return imageUrl;
  }

  // Get environment information
  const isProduction = import.meta.env.PROD;
  const hostname = window.location.hostname;
  const isRender = hostname.includes("render.com") || hostname.includes("bluewhalecompetitions.co.uk");
  const origin = window.location.origin;

  // Log debugging info
  console.log("🖼️ Processing image URL:", imageUrl, {
    isProduction,
    hostname,
    isRender,
    origin
  });

  // Different handling for production vs development
  let finalUrl = imageUrl;

  // If the path is relative, make it absolute based on the environment
  if (imageUrl.startsWith("/")) {
    finalUrl = `${origin}${imageUrl}`;
  }

  console.log("🖼️ Final image URL:", finalUrl);
  return finalUrl;
}