import React, { useState, useRef, useEffect } from 'react';

/**
 * LazyLoadedImage Component
 * 
 * A component that loads images only when they become visible in the viewport.
 * This helps improve performance by reducing initial page load time and
 * conserving bandwidth for images that may never be seen by the user.
 * 
 * Implementation of RF034 - Add lazy loading for routes and components
 */

interface LazyLoadedImageProps {
  /** Source URL of the image */
  src: string;
  
  /** Alternative text for the image */
  alt: string;
  
  /** Width of the image */
  width?: number | string;
  
  /** Height of the image */
  height?: number | string;
  
  /** CSS class name for the image */
  className?: string;
  
  /** Placeholder to show while the image is loading */
  placeholder?: React.ReactNode;
  
  /** Root margin for the intersection observer */
  rootMargin?: string;
  
  /** Threshold for the intersection observer */
  threshold?: number;
  
  /** Whether to blur the image while loading */
  blurEffect?: boolean;
  
  /** Function called when the image is loaded */
  onLoad?: () => void;
  
  /** Function called when the image fails to load */
  onError?: (error: Error) => void;
}

/**
 * LazyLoadedImage component
 */
export const LazyLoadedImage: React.FC<LazyLoadedImageProps> = ({
  src,
  alt,
  width,
  height,
  className = '',
  placeholder,
  rootMargin = '200px',
  threshold = 0,
  blurEffect = true,
  onLoad,
  onError
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Set up intersection observer to detect when the image is visible
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          // Unobserve once visible
          if (containerRef.current) {
            observer.unobserve(containerRef.current);
          }
        }
      },
      { rootMargin, threshold }
    );
    
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    
    return () => {
      observer.disconnect();
    };
  }, [rootMargin, threshold]);
  
  // Handle image load event
  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };
  
  // Handle image error event
  const handleError = () => {
    const error = new Error(`Failed to load image: ${src}`);
    setError(error);
    onError?.(error);
  };
  
  // Determine the styles based on loading state
  const getStyles = () => {
    const styles: React.CSSProperties = {};
    
    if (width) {
      styles.width = width;
    }
    
    if (height) {
      styles.height = height;
    }
    
    if (blurEffect && !isLoaded && isVisible) {
      styles.filter = 'blur(10px)';
      styles.transition = 'filter 0.3s ease-out';
    }
    
    return styles;
  };
  
  return (
    <div 
      ref={containerRef}
      className={`lazy-image-container ${className}`}
      style={{ 
        position: 'relative',
        overflow: 'hidden',
        width: width || 'auto',
        height: height || 'auto'
      }}
    >
      {!isLoaded && placeholder && (
        <div className="lazy-image-placeholder">
          {placeholder}
        </div>
      )}
      
      {isVisible && !error && (
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          className={`lazy-image ${isLoaded ? 'lazy-image-loaded' : ''}`}
          style={getStyles()}
          onLoad={handleLoad}
          onError={handleError}
        />
      )}
      
      {error && (
        <div className="lazy-image-error">
          <p>Failed to load image</p>
        </div>
      )}
    </div>
  );
};

export default LazyLoadedImage; 