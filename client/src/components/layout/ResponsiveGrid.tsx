import React from 'react';
import { Grid, GridProps, Box, styled } from '@mui/material';
import useResponsive from '../../hooks/useResponsive';

interface ResponsiveGridProps extends Omit<GridProps, 'spacing'> {
  children: React.ReactNode;
  spacing?: number | { xs?: number; sm?: number; md?: number; lg?: number; xl?: number };
  columnSpacing?: number | { xs?: number; sm?: number; md?: number; lg?: number; xl?: number };
  rowSpacing?: number | { xs?: number; sm?: number; md?: number; lg?: number; xl?: number };
  mobileDirection?: 'row' | 'column' | 'row-reverse' | 'column-reverse';
  tabletDirection?: 'row' | 'column' | 'row-reverse' | 'column-reverse';
  desktopDirection?: 'row' | 'column' | 'row-reverse' | 'column-reverse';
  mobileSingleColumn?: boolean;
  items?: React.ReactNode[];
  itemProps?: Record<string, any>[];
  equalHeight?: boolean;
}

/**
 * A responsive grid component that adapts to different screen sizes.
 * It simplifies the creation of grid layouts that respond well on mobile devices.
 */
const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  spacing = 2,
  columnSpacing,
  rowSpacing,
  mobileDirection = 'column',
  tabletDirection = 'row',
  desktopDirection = 'row',
  mobileSingleColumn = true,
  container = true,
  items,
  itemProps = [],
  equalHeight = false,
  ...props
}) => {
  const { isMobile, isTablet } = useResponsive();
  
  // Determine the current direction based on screen size
  const direction = isMobile ? mobileDirection : isTablet ? tabletDirection : desktopDirection;

  // Get the appropriate spacing values based on screen size
  const getSpacingValue = (spacingProp: typeof spacing) => {
    if (typeof spacingProp === 'object') {
      if (isMobile && spacingProp.xs !== undefined) return spacingProp.xs;
      if (isTablet && spacingProp.sm !== undefined) return spacingProp.sm;
      if (!isMobile && !isTablet && spacingProp.md !== undefined) return spacingProp.md;
      // Default to the smallest applicable value
      return spacingProp.xs || spacingProp.sm || spacingProp.md || 2;
    }
    return spacingProp;
  };

  // Calculate the spacing values
  const gridSpacing = getSpacingValue(spacing);
  const gridColumnSpacing = columnSpacing ? getSpacingValue(columnSpacing) : gridSpacing;
  const gridRowSpacing = rowSpacing ? getSpacingValue(rowSpacing) : gridSpacing;

  // If items are provided, render them as Grid items
  if (items && Array.isArray(items)) {
    return (
      <Grid
        container
        direction={direction}
        columnSpacing={gridColumnSpacing}
        rowSpacing={gridRowSpacing}
        {...props}
      >
        {items.map((item, index: any) => {
          // Default props for mobile/non-mobile
          const defaultMobileProps = mobileSingleColumn ? { xs: 12 } : {};
          const defaultDesktopProps = { sm: 6, md: 4, lg: 3 };
          
          // Combine with any custom item props
          const itemSpecificProps = itemProps[index] || {};
          
          return (
            <Grid
              item
              key={index}
              {...defaultMobileProps}
              {...(isMobile ? {} : defaultDesktopProps)}
              {...itemSpecificProps}
              sx={{
                height: equalHeight ? '100%' : 'auto',
                ...(itemSpecificProps.sx || {})
              }}
            >
              {item}
            </Grid>
          );
        })}
      </Grid>
    );
  }

  // Otherwise, just render the children with responsive props
  return (
    <Grid
      container={container}
      direction={direction}
      columnSpacing={gridColumnSpacing}
      rowSpacing={gridRowSpacing}
      {...props}
    >
      {children}
    </Grid>
  );
};

// Companion component for grid item with responsive sizing
export const ResponsiveGridItem: React.FC<GridProps> = ({ 
  children, 
  xs = 12, 
  sm, 
  md, 
  lg, 
  xl,
  ...props 
}) => {
  const { isMobile, isTablet, isDesktop } = useResponsive();
  
  // Determine appropriate grid sizes based on screen
  const gridProps = {
    xs,
    sm: isMobile ? xs : sm,
    md: isMobile ? xs : isTablet ? sm : md,
    lg: isMobile ? xs : isTablet ? sm : !isDesktop ? md : lg,
    xl: isMobile ? xs : isTablet ? sm : !isDesktop ? md : xl || lg,
    ...props
  };
  
  return (
    <Grid item {...gridProps}>
      {children}
    </Grid>
  );
};

export default ResponsiveGrid; 