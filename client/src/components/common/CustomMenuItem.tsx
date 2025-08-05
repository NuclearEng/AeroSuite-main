import React from 'react';
import { MenuItem, MenuItemProps } from '@mui/material';

interface CustomMenuItemProps extends Omit<MenuItemProps, 'value'> {
  value?: string | number | boolean;
}

/**
 * A wrapper around MUI MenuItem that accepts a value prop
 * This fixes the TypeScript errors with passing value to MenuItem
 */
const CustomMenuItem: React.FC<CustomMenuItemProps> = ({ 
  value, 
  children,
  ...props 
}) => {
  // We're only using the value prop for identification and selection
  // It doesn't get passed to the actual MenuItem component
  return (
    <MenuItem {...props}>
      {children}
    </MenuItem>
  );
};

export default CustomMenuItem; 