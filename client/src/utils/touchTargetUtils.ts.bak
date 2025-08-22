import { SxProps, Theme } from '@mui/material';
import useResponsive from '../hooks/useResponsive';

/**
 * Minimum touch target size according to WCAG 2.5.5 (AAA) and Material Design guidelines
 * https://www.w3.org/WAI/WCAG21/Understanding/target-size.html
 * https://material.io/design/usability/accessibility.html#layout-and-typography
 */
export const MIN_TOUCH_TARGET_SIZE = 48; // pixels

/**
 * Interface for touch target options
 */
export interface TouchTargetOptions {
  /**
   * Minimum size in pixels for the touch target
   */
  minSize?: number;
  
  /**
   * Whether to apply the touch target size to width
   */
  applyWidth?: boolean;
  
  /**
   * Whether to apply the touch target size to height
   */
  applyHeight?: boolean;
  
  /**
   * Whether to center the content within the touch target
   */
  centerContent?: boolean;
  
  /**
   * Additional styles to apply
   */
  additionalStyles?: SxProps<Theme>;
}

/**
 * Hook to get enhanced touch target styles for mobile devices
 * 
 * @param options - Touch target options
 * @returns SxProps object with touch target styles
 */
export const useTouchTargetStyles = (options: TouchTargetOptions = {}): SxProps<Theme> => {
  const { isMobile } = useResponsive();
  
  const {
    minSize = MIN_TOUCH_TARGET_SIZE,
    applyWidth = true,
    applyHeight = true,
    centerContent = true,
    additionalStyles = {}
  } = options;
  
  if (!isMobile) {
    return additionalStyles;
  }
  
  return {
    ...(applyWidth && { minWidth: minSize }),
    ...(applyHeight && { minHeight: minSize }),
    ...(centerContent && {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }),
    ...additionalStyles
  };
};

/**
 * Creates enhanced touch target styles for mobile devices
 * 
 * @param isMobile - Whether the device is mobile
 * @param options - Touch target options
 * @returns SxProps object with touch target styles
 */
export const createTouchTargetStyles = (
  isMobile: boolean,
  options: TouchTargetOptions = {}
): SxProps<Theme> => {
  const {
    minSize = MIN_TOUCH_TARGET_SIZE,
    applyWidth = true,
    applyHeight = true,
    centerContent = true,
    additionalStyles = {}
  } = options;
  
  if (!isMobile) {
    return additionalStyles;
  }
  
  return {
    ...(applyWidth && { minWidth: minSize }),
    ...(applyHeight && { minHeight: minSize }),
    ...(centerContent && {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }),
    ...additionalStyles
  };
};

/**
 * Calculates the appropriate spacing for mobile devices
 * 
 * @param defaultSpacing - Default spacing value
 * @param mobileSpacing - Mobile spacing value (optional)
 * @param isMobile - Whether the device is mobile
 * @returns The appropriate spacing value
 */
export const getResponsiveSpacing = (
  defaultSpacing: number | string,
  mobileSpacing?: number | string,
  isMobile?: boolean
): number | string => {
  if (isMobile && mobileSpacing !== undefined) {
    return mobileSpacing;
  }
  return defaultSpacing;
};

/**
 * Creates responsive padding styles based on device type
 * 
 * @param defaultPadding - Default padding value or object
 * @param mobilePadding - Mobile padding value or object (optional)
 * @param isMobile - Whether the device is mobile
 * @returns SxProps object with padding styles
 */
export const createResponsivePadding = (
  defaultPadding: number | string | Record<string, number | string>,
  mobilePadding?: number | string | Record<string, number | string>,
  isMobile?: boolean
): SxProps<Theme> => {
  if (isMobile && mobilePadding !== undefined) {
    if (typeof mobilePadding === 'object') {
      return { ...mobilePadding };
    }
    return { p: mobilePadding };
  }
  
  if (typeof defaultPadding === 'object') {
    return { ...defaultPadding };
  }
  return { p: defaultPadding };
};

export default {
  MIN_TOUCH_TARGET_SIZE,
  useTouchTargetStyles,
  createTouchTargetStyles,
  getResponsiveSpacing,
  createResponsivePadding
}; 