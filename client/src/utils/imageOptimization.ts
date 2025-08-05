/**
 * AeroSuite Image Optimization Utilities
 * 
 * This file contains utilities for optimizing images throughout the application,
 * including resizing, compression, format conversion, and lazy loading.
 */

// Image size presets for different use cases
export enum ImageSize {
  THUMBNAIL = 'thumbnail', // 100x100
  SMALL = 'small',         // 300x300
  MEDIUM = 'medium',       // 600x600
  LARGE = 'large',         // 1200x1200
  ORIGINAL = 'original'    // No resizing
}

// Image format options
export enum ImageFormat {
  JPEG = 'jpeg',
  PNG = 'png',
  WEBP = 'webp',
  AVIF = 'avif'
}

// Image quality presets
export enum ImageQuality {
  LOW = 'low',       // 30% quality
  MEDIUM = 'medium', // 60% quality
  HIGH = 'high',     // 80% quality
  BEST = 'best'      // 95% quality
}

// Image loading strategies
export enum ImageLoadingStrategy {
  EAGER = 'eager',  // Load immediately
  LAZY = 'lazy',    // Use browser's lazy loading
  PROGRESSIVE = 'progressive' // Show low quality image first, then high quality
}

// Configuration options for image optimization
export interface ImageOptimizationOptions {
  size?: ImageSize;
  format?: ImageFormat;
  quality?: ImageQuality;
  loading?: ImageLoadingStrategy;
  blur?: boolean;  // Apply blur-up effect for progressive loading
  alt?: string;    // Accessibility alt text
  className?: string; // CSS class for styling
}

// Dimensions for each image size preset
export const IMAGE_SIZE_DIMENSIONS: Record<ImageSize, { width: number; height: number } | null> = {
  [ImageSize.THUMBNAIL]: { width: 100, height: 100 },
  [ImageSize.SMALL]: { width: 300, height: 300 },
  [ImageSize.MEDIUM]: { width: 600, height: 600 },
  [ImageSize.LARGE]: { width: 1200, height: 1200 },
  [ImageSize.ORIGINAL]: null // No fixed dimensions for original size
};

// Quality value for each quality preset
export const IMAGE_QUALITY_VALUES = {
  [ImageQuality.LOW]: 30,
  [ImageQuality.MEDIUM]: 60,
  [ImageQuality.HIGH]: 80,
  [ImageQuality.BEST]: 95
};

// Default optimization options
export const DEFAULT_OPTIMIZATION_OPTIONS: ImageOptimizationOptions = {
  size: ImageSize.MEDIUM,
  format: ImageFormat.WEBP,
  quality: ImageQuality.HIGH,
  loading: ImageLoadingStrategy.LAZY,
  blur: true
};

/**
 * Generates the URL for an optimized image using the image service
 * 
 * @param originalUrl Original image URL
 * @param options Optimization options
 * @returns Optimized image URL
 */
export const getOptimizedImageUrl = (
  originalUrl: string,
  options: ImageOptimizationOptions = DEFAULT_OPTIMIZATION_OPTIONS
): string => {
  // If running in development mode without the image service, return original URL
  if (process.env.NODE_ENV === 'development' && !process.env.REACT_APP_IMAGE_SERVICE_URL) {
    return originalUrl;
  }

  // Use the configured image service or default to relative path
  const imageServiceUrl = process.env.REACT_APP_IMAGE_SERVICE_URL || '/api/images';
  
  // Merge default options with provided options
  const mergedOptions = { ...DEFAULT_OPTIMIZATION_OPTIONS, ...options };
  
  // Construct the URL with query parameters for optimization
  const url = new URL(imageServiceUrl);
  url.searchParams.append('src', originalUrl);
  
  // Add size parameters if not original
  if (mergedOptions.size !== ImageSize.ORIGINAL) {
    const dimensions = IMAGE_SIZE_DIMENSIONS[mergedOptions.size as ImageSize];
    if (dimensions) {
      url.searchParams.append('width', dimensions.width.toString());
      url.searchParams.append('height', dimensions.height.toString());
    }
  }
  
  // Add format parameter
  url.searchParams.append('format', mergedOptions.format || DEFAULT_OPTIMIZATION_OPTIONS.format as string);
  
  // Add quality parameter
  const quality = IMAGE_QUALITY_VALUES[mergedOptions.quality as ImageQuality] || 
                  IMAGE_QUALITY_VALUES[DEFAULT_OPTIMIZATION_OPTIONS.quality as ImageQuality];
  url.searchParams.append('quality', quality.toString());
  
  return url.toString();
};

/**
 * Calculates the aspect ratio based on original dimensions
 * 
 * @param width Original width
 * @param height Original height
 * @returns Aspect ratio as a string (e.g., "16:9")
 */
export const calculateAspectRatio = (width: number, height: number): string => {
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  const divisor = gcd(width, height);
  return `${width / divisor}:${height / divisor}`;
};

/**
 * Generates a tiny placeholder image for blur-up loading effect
 * 
 * @param originalUrl Original image URL
 * @returns Base64 encoded tiny placeholder image
 */
export const getTinyPlaceholder = async (originalUrl: string): Promise<string> => {
  // In a real implementation, this would use the image service to generate a tiny placeholder
  // For now, we'll use a simple color extraction to create a solid color placeholder
  
  try {
    // If image service URL is available, use it to generate a tiny placeholder
    if (process.env.REACT_APP_IMAGE_SERVICE_URL) {
      const url = new URL(process.env.REACT_APP_IMAGE_SERVICE_URL);
      url.searchParams.append('src', originalUrl);
      url.searchParams.append('width', '4');
      url.searchParams.append('height', '4');
      url.searchParams.append('blur', '1');
      url.searchParams.append('format', 'webp');
      url.searchParams.append('quality', '10');
      
      // In a real implementation, we would fetch this and convert to base64
      // For now, return a mock value
      return 'data:image/webp;base64,UklGRkAAAABXRUJQVlA4WAoAAAAQAAAADwAADwAAQUxQSC0AAAABJ6AgbQAA/1QzgP//Qv8bKP//zQwc//+zcnPR//9E9n/e';
    }
    
    // Fallback to a gray placeholder
    return 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2YwZjBmMCIvPjwvc3ZnPg==';
  } catch (_error) {
    console.error('Error generating placeholder:', _error);
    return 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2YwZjBmMCIvPjwvc3ZnPg==';
  }
};

/**
 * Estimates the file size of an image based on dimensions, format, and quality
 * 
 * @param width Image width
 * @param height Image height
 * @param format Image format
 * @param quality Quality setting (0-100)
 * @returns Estimated file size in bytes
 */
export const estimateFileSize = (
  width: number,
  height: number,
  format: ImageFormat = ImageFormat.JPEG,
  quality: number = 80
): number => {
  const pixelCount = width * height;
  
  // Compression factors for different formats (rough estimates)
  const compressionFactors: Record<ImageFormat, number> = {
    [ImageFormat.JPEG]: 0.25,
    [ImageFormat.PNG]: 0.4,
    [ImageFormat.WEBP]: 0.2,
    [ImageFormat.AVIF]: 0.15
  };
  
  // Quality adjustment factor (quality has different impact per format)
  const qualityFactor = format === ImageFormat.PNG ? 1 : (quality / 100) * 1.5;
  
  // 3 bytes per pixel (RGB) * compression * quality adjustment
  return Math.round(pixelCount * 3 * compressionFactors[format] * qualityFactor);
};

/**
 * Checks if an image should be optimized in a specific format
 * 
 * @param originalUrl Original image URL
 * @param targetFormat Desired format
 * @returns Boolean indicating if optimization is needed
 */
export const shouldOptimizeFormat = (originalUrl: string, targetFormat: ImageFormat): boolean => {
  // Extract extension from URL
  const extension = originalUrl.split('.').pop()?.toLowerCase() || '';
  
  // Get equivalent extension for the target format
  const targetExtension = targetFormat.toLowerCase();
  
  // If already in target format, no need to convert
  if (extension === targetExtension) {
    return false;
  }
  
  // For WEBP and AVIF, always optimize if not already in that format
  if (targetFormat === ImageFormat.WEBP || targetFormat === ImageFormat.AVIF) {
    return true;
  }
  
  // For PNG to JPEG, only optimize if not transparent
  // This would require image analysis, which is not possible on client side
  // In a real implementation, this would be handled by the image service
  
  return true;
};

/**
 * Determines if the browser supports a specific image format
 * 
 * @param format Image format to check
 * @returns Boolean indicating browser support
 */
export const isBrowserCompatible = (format: ImageFormat): boolean => {
  if (typeof document === 'undefined') {
    return false; // Server-side rendering check
  }
  
  const canvas = document.createElement('canvas');
  if (!canvas || !canvas.getContext) {
    return false;
  }
  
  switch (format) {
    case ImageFormat.WEBP:
      return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
    case ImageFormat.AVIF:
      // No reliable client-side detection for AVIF yet
      // Use feature detection API when available
      return false;
    case ImageFormat.JPEG:
    case ImageFormat.PNG:
      return true;
    default:
      return false;
  }
};

/**
 * Gets the best supported format for the current browser
 * 
 * @returns The best image format the browser supports
 */
export const getBestSupportedFormat = (): ImageFormat => {
  if (isBrowserCompatible(ImageFormat.AVIF)) {
    return ImageFormat.AVIF;
  }
  if (isBrowserCompatible(ImageFormat.WEBP)) {
    return ImageFormat.WEBP;
  }
  return ImageFormat.JPEG;
};

/**
 * Utility to create a URL for the backend image processing API
 * 
 * @param endpoint API endpoint
 * @param params Query parameters
 * @returns Complete API URL
 */
export const createImageApiUrl = (endpoint: string, params: Record<string, string>): string => {
  const baseUrl = process.env.REACT_APP_API_URL || '';
  const url = new URL(`${baseUrl}/api/images/${endpoint}`);
  
  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      url.searchParams.append(key, value);
    }
  });
  
  return url.toString();
};

export default {
  getOptimizedImageUrl,
  calculateAspectRatio,
  getTinyPlaceholder,
  estimateFileSize,
  shouldOptimizeFormat,
  isBrowserCompatible,
  getBestSupportedFormat,
  createImageApiUrl,
  ImageSize,
  ImageFormat,
  ImageQuality,
  ImageLoadingStrategy
}; 