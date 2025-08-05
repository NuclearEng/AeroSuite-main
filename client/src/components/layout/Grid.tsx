import React from 'react';
import { Box, BoxProps } from '@mui/material';

// Define breakpoint sizes
export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

// Define column sizes (1-12)
export type GridSize = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 'auto' | true | false;

// Grid container props
export interface GridContainerProps extends BoxProps {
  spacing?: number | { [key in Breakpoint]?: number };
  direction?: 'row' | 'column' | 'row-reverse' | 'column-reverse';
  justifyContent?: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around' | 'space-evenly';
  alignItems?: 'flex-start' | 'center' | 'flex-end' | 'stretch' | 'baseline';
  wrap?: 'nowrap' | 'wrap' | 'wrap-reverse';
}

// Grid item props
export interface GridItemProps extends BoxProps {
  xs?: GridSize;
  sm?: GridSize;
  md?: GridSize;
  lg?: GridSize;
  xl?: GridSize;
}

// Convert grid size to percentage width
const getGridSizeStyle = (size: GridSize): string => {
  if (size === true) return '100%';
  if (size === 'auto') return 'auto';
  if (size === false) return '0%';
  return `${(size / 12) * 100}%`;
};

// Get spacing value in pixels
const getSpacing = (spacing: number) => `${spacing * 8}px`;

// Grid Container Component
export const Grid: React.FC<GridContainerProps & { container?: boolean; item?: boolean } & GridItemProps> = ({
  container,
  item,
  spacing = 0,
  direction = 'row',
  justifyContent = 'flex-start',
  alignItems = 'stretch',
  wrap = 'wrap',
  xs,
  sm,
  md,
  lg,
  xl,
  children,
  sx,
  ...props
}) => {
  if (container) {
    // Calculate spacing
    const spacingValue = typeof spacing === 'number' ? getSpacing(spacing) : undefined;
    
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: direction,
          flexWrap: wrap,
          justifyContent,
          alignItems,
          width: '100%',
          ...(spacingValue ? { 
            margin: `-${spacingValue} 0 0 -${spacingValue}`,
            '& > *': { padding: `${spacingValue} 0 0 ${spacingValue}` }
          } : {}),
          ...sx
        }}
        {...props}
      >
        {children}
      </Box>
    );
  }
  
  if (item) {
    return (
      <Box
        sx={{
          ...(xs !== undefined && { width: { xs: getGridSizeStyle(xs) } }),
          ...(sm !== undefined && { width: { sm: getGridSizeStyle(sm) } }),
          ...(md !== undefined && { width: { md: getGridSizeStyle(md) } }),
          ...(lg !== undefined && { width: { lg: getGridSizeStyle(lg) } }),
          ...(xl !== undefined && { width: { xl: getGridSizeStyle(xl) } }),
          // Handle auto-growing items
          ...(xs === true && { flexGrow: 1 }),
          ...sx
        }}
        {...props}
      >
        {children}
      </Box>
    );
  }
  
  // If neither container nor item, just render a Box
  return <Box sx={sx} {...props}>{children}</Box>;
};

export default Grid; 