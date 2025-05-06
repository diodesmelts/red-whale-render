import { useState, useEffect, memo } from 'react';

interface CachedImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackSrc?: string;
  onLoad?: () => void;
  onError?: () => void;
}

// Keep a global cache of loaded images to prevent unnecessary requests
const imageCache = new Map<string, string>();

const CachedImage = ({ 
  src, 
  alt, 
  className = '', 
  fallbackSrc = '', 
  onLoad, 
  onError 
}: CachedImageProps) => {
  const [imageSrc, setImageSrc] = useState<string>(imageCache.get(src) || src);
  const [error, setError] = useState<boolean>(false);
  
  useEffect(() => {
    // If the image is already in the cache, use it directly
    if (imageCache.has(src)) {
      setImageSrc(imageCache.get(src) || '');
      onLoad?.();
      return;
    }
    
    // Otherwise, load the image and cache it
    const img = new Image();
    
    img.onload = () => {
      // Store in cache
      imageCache.set(src, src);
      setImageSrc(src);
      onLoad?.();
    };
    
    img.onerror = () => {
      setError(true);
      onError?.();
    };
    
    // Set the src to trigger loading
    img.src = src;
    
    // Clean up
    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src, onLoad, onError]);
  
  // If there was an error loading the image and a fallback is provided, use it
  if (error && fallbackSrc) {
    return <img src={fallbackSrc} alt={alt} className={className} />;
  }
  
  return <img src={imageSrc} alt={alt} className={className} />;
};

// Memoize to prevent unnecessary re-renders
export default memo(CachedImage);