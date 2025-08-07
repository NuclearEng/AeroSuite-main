import React, { useState, useEffect } from 'react';
import { Box, Skeleton, styled } from '@mui/material';
import {
  ImageSize,
  ImageFormat,
  ImageQuality,
  ImageLoadingStrategy,
  getOptimizedImageUrl,
  getTinyPlaceholder,
  getBestSupportedFormat,
  ImageOptimizationOptions,
  calculateAspectRatio } from
'../../utils/imageOptimization';

// Styled components for the image container
const ImageContainer = styled(Box)(({ theme }) => ({
  position: 'relative',
  overflow: 'hidden',
  display: 'inline-block',
  width: '100%',
  height: 'auto'
}));

// Styled components for the placeholder and blur effect
const BlurredPlaceholder = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  filter: 'blur(20px)',
  transform: 'scale(1.1)', // Slightly larger to prevent blur edges from showing
  backgroundPosition: 'center',
  backgroundSize: 'cover',
  transition: 'opacity 0.3s ease-in-out'
}));

// Styled component for the actual image
const StyledImg = styled('img')(({ theme }) => ({
  display: 'block',
  width: '100%',
  height: 'auto',
  transition: 'opacity 0.3s ease-in-out'
}));

export interface OptimizedImageProps {
  src: string;
  alt: string;
  size?: ImageSize;
  format?: ImageFormat;
  quality?: ImageQuality;
  loading?: ImageLoadingStrategy;
  className?: string;
  style?: React.CSSProperties;
  width?: number | string;
  height?: number | string;
  aspectRatio?: string;
  blur?: boolean;
  fallbackSrc?: string;
  onLoad?: () => void;
  onError?: () => void;
  onClick?: () => void;
}

const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  size = ImageSize.MEDIUM,
  format,
  quality = ImageQuality.HIGH,
  loading = ImageLoadingStrategy.LAZY,
  className,
  style,
  width,
  height,
  aspectRatio,
  blur = true,
  fallbackSrc,
  onLoad,
  onError,
  onClick
}) => {
  // Use the best format supported by the browser if not specified
  const bestFormat = format || getBestSupportedFormat();

  // State for tracking image loading
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [placeholderSrc, setPlaceholderSrc] = useState<string | null>(null);

  // Generate the optimized image URL
  const options: ImageOptimizationOptions = {
    size,
    format: bestFormat,
    quality,
    loading,
    blur
  };

  const optimizedSrc = getOptimizedImageUrl(src, options);
  const imgSrc = hasError && fallbackSrc ? fallbackSrc : optimizedSrc;

  // Load the tiny placeholder for blur-up effect
  useEffect(() => {
    if (blur && loading === ImageLoadingStrategy.PROGRESSIVE) {
      const loadPlaceholder = async () => {
        try {
          const placeholder = await getTinyPlaceholder(src);
          setPlaceholderSrc(placeholder);
        } catch (_error) {
          console.error("Error:", err);
        }
      };

      loadPlaceholder();
    }
  }, [src, blur, loading]);

  // Handle image load event
  const handleLoad = () => {
    setIsLoaded(true);
    if (onLoad) onLoad();
  };

  // Handle image error event
  const handleError = () => {
    setHasError(true);
    if (onError) onError();
  };

  // Determine appropriate loading strategy
  const loadingAttr = loading === ImageLoadingStrategy.LAZY ? 'lazy' :
  loading === ImageLoadingStrategy.EAGER ? 'eager' : undefined;

  return (
    <ImageContainer
      className={className}
      style={{
        ...style,
        width: width || '100%',
        aspectRatio: aspectRatio || 'auto',
        height: height || 'auto'
      }}
      onClick={onClick}>

      
      {!isLoaded && !placeholderSrc &&
      <Skeleton
        variant="rectangular"
        animation="wave"
        width="100%"
        height="100%"
        sx={{ position: 'absolute', top: 0, left: 0 }} />

      }
      
      
      {placeholderSrc && !isLoaded &&
      <BlurredPlaceholder
        style={{
          backgroundImage: `url(${placeholderSrc})`,
          opacity: isLoaded ? 0 : 1
        }} />

      }
      
      
      <StyledImg
        src={imgSrc}
        alt={alt}
        loading={loadingAttr}
        onLoad={handleLoad}
        onError={handleError}
        style={{ opacity: isLoaded ? 1 : 0 }} />

    </ImageContainer>);

};

export default OptimizedImage;