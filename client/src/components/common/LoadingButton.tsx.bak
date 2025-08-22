import React from 'react';
import { Button, ButtonProps, CircularProgress } from '@mui/material';
import { useTheme } from '@mui/material/styles';

interface LoadingButtonProps extends ButtonProps {
  loading?: boolean;
  loadingPosition?: 'start' | 'center' | 'end';
  loadingSize?: number;
}

const LoadingButton: React.FC<LoadingButtonProps> = ({
  children,
  loading = false,
  loadingPosition = 'center',
  loadingSize = 24,
  disabled,
  startIcon,
  endIcon,
  sx,
  ...props
}) => {
  const theme = useTheme();
  // Determine if the button should be disabled
  const isDisabled = disabled || loading;
  
  // Create modified props for icons when loading
  const modifiedStartIcon = loading && loadingPosition === 'start' 
    ? <CircularProgress size={loadingSize} color="inherit" /> 
    : startIcon;
    
  const modifiedEndIcon = loading && loadingPosition === 'end' 
    ? <CircularProgress size={loadingSize} color="inherit" /> 
    : endIcon;

  return (
    <Button
      disabled={isDisabled}
      startIcon={modifiedStartIcon}
      endIcon={modifiedEndIcon}
      sx={{
        position: 'relative',
        '& .MuiCircularProgress-root': {
          transition: theme.transitions.create('opacity', {
            duration: theme.transitions.duration.shorter,
            easing: theme.transitions.easing.easeInOut,
          }),
        },
        ...sx,
      }}
      {...props}
    >
      {loading && loadingPosition === 'center' ? (
        <>
          <span style={{ visibility: 'hidden' }}>{children}</span>
          <CircularProgress
            size={loadingSize}
            color="inherit"
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              marginTop: `-${loadingSize / 2}px`,
              marginLeft: `-${loadingSize / 2}px`,
            }}
          />
        </>
      ) : (
        children
      )}
    </Button>
  );
};

export default LoadingButton; 