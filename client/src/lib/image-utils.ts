/**
 * Utility functions for handling images
 */

/**
 * Processes an image URL for proper display
 * - Ensures absolute URLs for relative paths
 * - Handles different environment scenarios
 */
export function processImageUrl(url: string | null | undefined): string {
  if (!url) {
    return "https://placehold.co/600x600/1a1f2b/FFFFFF/png?text=No+Image";
  }

  // If URL is already absolute, return it as is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  // If URL is relative, make it absolute
  if (url.startsWith('/uploads/')) {
    return `${window.location.origin}${url}`;
  }

  // Default - return unchanged
  return url;
}

/**
 * Get Cloudinary transformed URL for responsive images
 */
export function getCloudinaryUrl(url: string | null | undefined, options: { width?: number, height?: number, quality?: number, crop?: string } = {}): string {
  if (!url) {
    return "https://placehold.co/600x600/1a1f2b/FFFFFF/png?text=No+Image";
  }

  // If not a Cloudinary URL, return processed URL
  if (!url.includes('cloudinary.com')) {
    return processImageUrl(url);
  }

  // Extract Cloudinary parts
  const baseUrlParts = url.split('/upload/');
  if (baseUrlParts.length !== 2) {
    return url; // Not a standard Cloudinary URL format
  }

  const transformations: string[] = [];
  
  if (options.width) transformations.push(`w_${options.width}`);
  if (options.height) transformations.push(`h_${options.height}`);
  if (options.quality) transformations.push(`q_${options.quality}`);
  if (options.crop) transformations.push(`c_${options.crop}`);
  
  // Default to a quality of 90 if no transformations
  if (transformations.length === 0) {
    transformations.push('q_90');
  }

  // Rebuild the URL with transformations
  return `${baseUrlParts[0]}/upload/${transformations.join(',')}/f_auto/${baseUrlParts[1]}`;
}

/**
 * Get appropriate image size based on viewport
 * Usage: <img srcSet={getResponsiveImageSrcSet(imageUrl)} />
 */
export function getResponsiveImageSrcSet(url: string | null | undefined): string {
  if (!url) {
    return "https://placehold.co/600x600/1a1f2b/FFFFFF/png?text=No+Image";
  }

  // If not a Cloudinary URL, return processed URL
  if (!url.includes('cloudinary.com')) {
    return processImageUrl(url);
  }

  return `
    ${getCloudinaryUrl(url, { width: 400 })} 400w,
    ${getCloudinaryUrl(url, { width: 600 })} 600w,
    ${getCloudinaryUrl(url, { width: 800 })} 800w,
    ${getCloudinaryUrl(url, { width: 1200 })} 1200w
  `.trim();
}