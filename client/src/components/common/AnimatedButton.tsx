import React, { useState } from 'react';
import { 
  Button, 
  ButtonProps, 
  CircularProgress, 
  Box,
  useTheme
} from '@mui/material';
import { createTransition, prefersReducedMotion } from '../../utils/animationUtils';

export interface AnimatedButtonProps extends ButtonProps {
  /**
   * Whether the button is in a loading state
   * @default false
   */
  loading?: boolean;
  
  /**
   * Whether the button has been clicked successfully
   * @default false
   */
  success?: boolean;
  
  /**
   * Whether the button has encountered an error
   * @default false
   */
  error?: boolean;
  
  /**
   * Animation type for hover effect
   * @default 'scale'
   */
  hoverEffect?: 'scale' | 'glow' | 'lift' | 'none';
  
  /**
   * Animation type for click effect
   * @default 'ripple'
   */
  clickEffect?: 'ripple' | 'pulse' | 'none';
  
  /**
   * Whether to show a success animation when clicked
   * @default false
   */
  showSuccessAnimation?: boolean;
  
  /**
   * Duration of the loading state in milliseconds (0 means indefinite)
   * @default 0
   */
  loadingDuration?: number;
  
  /**
   * Callback when loading completes
   */
  onLoadingComplete?: () => void;
}

/**
 * AnimatedButton component with interactive animations and feedback
 */
const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  children,
  loading = false,
  success = false,
  error = false,
  hoverEffect = 'scale',
  clickEffect = 'ripple',
  showSuccessAnimation = false,
  loadingDuration = 0,
  onLoadingComplete,
  disabled,
  onClick,
  sx,
  ...buttonProps
}) => {
  const theme = useTheme();
  const [isLoading, setIsLoading] = useState(loading);
  const [isSuccess, setIsSuccess] = useState(success);
  const [isError, setIsError] = useState(error);
  const [isClicked, setIsClicked] = useState(false);
  
  // Update state when props change
  React.useEffect(() => {
    setIsLoading(loading);
    setIsSuccess(success);
    setIsError(error);
  }, [loading, success, error]);
  
  // Handle loading duration
  React.useEffect(() => {
    if (isLoading && loadingDuration > 0) {
      const timer = setTimeout(() => {
        setIsLoading(false);
        onLoadingComplete?.();
      }, loadingDuration);
      
      return () => clearTimeout(timer);
    }
  }, [isLoading, loadingDuration, onLoadingComplete]);
  
  // Handle click animation
  React.useEffect(() => {
    if (isClicked) {
      const timer = setTimeout(() => {
        setIsClicked(false);
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [isClicked]);
  
  // Handle success animation
  React.useEffect(() => {
    if (isSuccess && showSuccessAnimation) {
      const timer = setTimeout(() => {
        setIsSuccess(false);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [isSuccess, showSuccessAnimation]);
  
  // Handle click event
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setIsClicked(true);
    onClick?.(event);
  };
  
  // Get hover effect styles
  const getHoverStyles = () => {
    if (prefersReducedMotion()) return {};
    
    switch (hoverEffect) {
      case 'scale':
        return {
          '&:hover': {
            transform: 'scale(1.05)',
          },
        };
      case 'glow':
        return {
          '&:hover': {
            boxShadow: `0 0 10px ${theme.palette.primary.main}`,
          },
        };
      case 'lift':
        return {
          '&:hover': {
            transform: 'translateY(-3px)',
            boxShadow: theme.shadows[4],
          },
        };
      default:
        return {};
    }
  };
  
  // Get click effect styles
  const getClickStyles = () => {
    if (prefersReducedMotion()) return {};
    
    switch (clickEffect) {
      case 'ripple':
        return {
          position: 'relative',
          overflow: 'hidden',
          '&::after': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(255, 255, 255, 0.3)',
            borderRadius: 'inherit',
            opacity: isClicked ? 1 : 0,
            transform: isClicked ? 'scale(1)' : 'scale(0)',
            transition: 'transform 0.3s ease-out, opacity 0.3s ease-out',
          },
        };
      case 'pulse':
        return {
          transform: isClicked ? 'scale(0.95)' : 'scale(1)',
        };
      default:
        return {};
    }
  };
  
  // Get state styles
  const getStateStyles = () => {
    if (isSuccess && showSuccessAnimation) {
      return {
        backgroundColor: theme.palette.success.main,
        borderColor: theme.palette.success.main,
        color: theme.palette.success.contrastText,
      };
    }
    
    if (isError) {
      return {
        backgroundColor: theme.palette.error.main,
        borderColor: theme.palette.error.main,
        color: theme.palette.error.contrastText,
      };
    }
    
    return {};
  };
  
  return (
    <Button
      disabled={disabled || isLoading}
      onClick={handleClick}
      sx={{
        position: 'relative',
        transition: createTransition([
          'transform', 
          'box-shadow', 
          'background-color', 
          'border-color', 
          'color'
        ], { duration: 200 }),
        ...getHoverStyles(),
        ...getClickStyles(),
        ...getStateStyles(),
        ...sx,
      }}
      {...buttonProps}
    >
      {isLoading ? (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <CircularProgress 
            size={20} 
            color="inherit" 
            sx={{ mr: children ? 1 : 0 }} 
          />
          {children}
        </Box>
      ) : (
        children
      )}
    </Button>
  );
};

export default AnimatedButton; 