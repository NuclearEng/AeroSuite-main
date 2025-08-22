import React from 'react';
import { Box, BoxProps } from '@mui/material';
import useResponsive from '../../hooks/useResponsive';
import { MIN_TOUCH_TARGET_SIZE, TouchTargetOptions } from '../../utils/touchTargetUtils';

export interface TouchTargetWrapperProps extends BoxProps {
  /**
   * Children to render inside the touch target wrapper
   */
  children: React.ReactNode;
  
  /**
   * Whether to only apply touch target enhancement on mobile devices
   * @default true
   */
  mobileOnly?: boolean;
  
  /**
   * Minimum size for the touch target
   * @default 48
   */
  minSize?: number;
  
  /**
   * Whether to apply the touch target size to width
   * @default true
   */
  applyWidth?: boolean;
  
  /**
   * Whether to apply the touch target size to height
   * @default true
   */
  applyHeight?: boolean;
  
  /**
   * Whether to center the content within the touch target
   * @default true
   */
  centerContent?: boolean;
}

/**
 * A component that wraps interactive elements to enhance their touch target size
 * following accessibility guidelines (WCAG 2.5.5 Target Size)
 */
const TouchTargetWrapper: React.FC<TouchTargetWrapperProps> = ({
  children,
  mobileOnly = true,
  minSize = MIN_TOUCH_TARGET_SIZE,
  applyWidth = true,
  applyHeight = true,
  centerContent = true,
  sx,
  ...boxProps
}) => {
  const { isMobile } = useResponsive();
  
  // Only apply touch target enhancement if not mobile-only or if on mobile
  const shouldEnhance = !mobileOnly || isMobile;
  
  // Base styles
  const baseStyles = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    ...(sx || {})
  };
  
  // Enhanced styles for touch targets
  const enhancedStyles = {
    ...baseStyles,
    ...(applyWidth && { minWidth: minSize }),
    ...(applyHeight && { minHeight: minSize }),
    ...(centerContent && {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    })
  };
  
  return (
    <Box 
      sx={shouldEnhance ? enhancedStyles : baseStyles}
      {...boxProps}
    >
      {children}
    </Box>
  );
};

export default TouchTargetWrapper; 