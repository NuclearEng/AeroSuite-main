import React from 'react';
import { Button as MuiButton, ButtonProps as MuiButtonProps } from '@mui/material';

export interface ButtonProps extends MuiButtonProps {
  isLoading?: boolean;
  loadingText?: string;
}

const Button: React.FC<ButtonProps> = ({
  children,
  isLoading = false,
  loadingText,
  disabled,
  ...rest
}) => {
  return (
    <MuiButton
      disabled={isLoading || disabled}
      {...rest}
    >
      {isLoading ? loadingText || 'Loading...' : children}
    </MuiButton>
  );
};

export default Button; 