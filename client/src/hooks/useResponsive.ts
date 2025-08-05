import { useState, useEffect } from 'react';

// Breakpoint definitions (in px)
export const breakpoints = {
  xs: 0,
  sm: 600,
  md: 960,
  lg: 1280,
  xl: 1920
};

// Device orientation types
export type Orientation = 'portrait' | 'landscape';

// Media query types
export type MediaQuery = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'smUp' | 'mdUp' | 'lgUp' | 'xlUp' | 'smDown' | 'mdDown' | 'lgDown';

/**
 * Enhanced responsive hook for detecting screen size and orientation
 * 
 * @returns Object with various responsive helper methods and properties
 */
const useResponsive = () => {
  const [width, setWidth] = useState<number>(window.innerWidth);
  const [height, setHeight] = useState<number>(window.innerHeight);
  const [orientation, setOrientation] = useState<Orientation>(
    window.innerWidth > window.innerHeight ? 'landscape' : 'portrait'
  );

  // Update dimensions and orientation on resize
  useEffect(() => {
    const handleResize = () => {
      setWidth(window.innerWidth);
      setHeight(window.innerHeight);
      setOrientation(
        window.innerWidth > window.innerHeight ? 'landscape' : 'portrait'
      );
    };

    // Add event listener
    window.addEventListener('resize', handleResize);
    
    // Clean up
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Determine if a media query matches
  const matchesQuery = (query: MediaQuery): boolean => {
    switch (query) {
      case 'xs':
        return width < breakpoints.sm;
      case 'sm':
        return width >= breakpoints.sm && width < breakpoints.md;
      case 'md':
        return width >= breakpoints.md && width < breakpoints.lg;
      case 'lg':
        return width >= breakpoints.lg && width < breakpoints.xl;
      case 'xl':
        return width >= breakpoints.xl;
      case 'smUp':
        return width >= breakpoints.sm;
      case 'mdUp':
        return width >= breakpoints.md;
      case 'lgUp':
        return width >= breakpoints.lg;
      case 'xlUp':
        return width >= breakpoints.xl;
      case 'smDown':
        return width < breakpoints.md;
      case 'mdDown':
        return width < breakpoints.lg;
      case 'lgDown':
        return width < breakpoints.xl;
      default:
        return false;
    }
  };
  
  // Check if device is mobile (based on screen width)
  const isMobile = width < breakpoints.md;
  
  // Check if device is tablet
  const isTablet = width >= breakpoints.md && width < breakpoints.lg;
  
  // Check if device is desktop
  const isDesktop = width >= breakpoints.lg;

  // Get appropriate column count for grid layouts
  const getGridColumns = (
    defaultCols: number = 12,
    options: {
      xs?: number;
      sm?: number;
      md?: number;
      lg?: number;
      xl?: number;
    } = {}
  ): number => {
    if (matchesQuery('xs') && options.xs !== undefined) return options.xs;
    if (matchesQuery('sm') && options.sm !== undefined) return options.sm;
    if (matchesQuery('md') && options.md !== undefined) return options.md;
    if (matchesQuery('lg') && options.lg !== undefined) return options.lg;
    if (matchesQuery('xl') && options.xl !== undefined) return options.xl;
    return defaultCols;
  };

  // Get current breakpoint name
  const getCurrentBreakpoint = (): 'xs' | 'sm' | 'md' | 'lg' | 'xl' => {
    if (matchesQuery('xs')) return 'xs';
    if (matchesQuery('sm')) return 'sm';
    if (matchesQuery('md')) return 'md';
    if (matchesQuery('lg')) return 'lg';
    return 'xl';
  };

  // Calculate height or width based on percentage of viewport
  const viewportUnits = {
    vh: (percentage: number): number => (height * percentage) / 100,
    vw: (percentage: number): number => (width * percentage) / 100
  };

  // Conditional styles based on screen size
  const getResponsiveStyles = <T extends Record<string, any>>(
    baseStyles: T,
    breakpointStyles: Partial<Record<MediaQuery, Partial<T>>>
  ): T => {
    let styles = { ...baseStyles };

    // Apply styles for matching breakpoints
    Object.entries(breakpointStyles).forEach(([query, queryStyles]) => {
      if (matchesQuery(query as MediaQuery)) {
        styles = { ...styles, ...queryStyles };
      }
    });

    return styles;
  };

  // Helper for getting responsive spacings
  const getSpacing = (
    defaultValue: number | string,
    options: {
      xs?: number | string;
      sm?: number | string;
      md?: number | string;
      lg?: number | string;
      xl?: number | string;
    } = {}
  ): number | string => {
    if (matchesQuery('xs') && options.xs !== undefined) return options.xs;
    if (matchesQuery('sm') && options.sm !== undefined) return options.sm;
    if (matchesQuery('md') && options.md !== undefined) return options.md;
    if (matchesQuery('lg') && options.lg !== undefined) return options.lg;
    if (matchesQuery('xl') && options.xl !== undefined) return options.xl;
    return defaultValue;
  };

  return {
    width,
    height,
    orientation,
    breakpoints,
    isMobile,
    isTablet,
    isDesktop,
    matchesQuery,
    getGridColumns,
    getCurrentBreakpoint,
    viewportUnits,
    getResponsiveStyles,
    getSpacing
  };
};

export default useResponsive; 