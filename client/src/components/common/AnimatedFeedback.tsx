import React, { useState, useEffect } from 'react';
import { Box, BoxProps, Typography, useTheme, alpha } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import InfoIcon from '@mui/icons-material/Info';
import WarningIcon from '@mui/icons-material/Warning';
import { animationPresets, prefersReducedMotion } from '../../utils/animationUtils';

export type FeedbackType = 'success' | 'error' | 'info' | 'warning';

export interface AnimatedFeedbackProps extends BoxProps {
  /**
   * Type of feedback to display
   * @default 'success'
   */
  type?: FeedbackType;
  
  /**
   * Message to display
   */
  message?: string;
  
  /**
   * Whether to show the feedback
   * @default true
   */
  show?: boolean;
  
  /**
   * Duration in milliseconds before the feedback disappears
   * @default 3000 (0 means it won't disappear)
   */
  duration?: number;
  
  /**
   * Callback when the feedback disappears
   */
  onComplete?: () => void;
  
  /**
   * Whether to use a minimal design
   * @default false
   */
  minimal?: boolean;
  
  /**
   * Whether to show an icon
   * @default true
   */
  showIcon?: boolean;
  
  /**
   * Animation type to use
   * @default 'slideInRight'
   */
  animationType?: keyof typeof animationPresets;
  
  /**
   * Custom icon to use
   */
  icon?: React.ReactNode;
  
  /**
   * Children to render inside the feedback
   */
  children?: React.ReactNode;
}

/**
 * AnimatedFeedback component for displaying animated feedback messages
 */
const AnimatedFeedback: React.FC<AnimatedFeedbackProps> = ({
  type = 'success',
  message,
  show = true,
  duration = 3000,
  onComplete,
  minimal = false,
  showIcon = true,
  animationType = 'slideInRight',
  icon,
  children,
  sx,
  ...boxProps
}) => {
  const theme = useTheme();
  const [visible, setVisible] = useState(show);
  
  // Handle visibility changes
  useEffect(() => {
    setVisible(show);
    
    // Auto-hide after duration
    if (show && duration > 0) {
      const timer = setTimeout(() => {
        setVisible(false);
        onComplete?.();
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [show, duration, onComplete]);
  
  // Get color based on type
  const getColor = () => {
    switch (type) {
      case 'success':
        return theme.palette.success;
      case 'error':
        return theme.palette.error;
      case 'info':
        return theme.palette.info;
      case 'warning':
        return theme.palette.warning;
      default:
        return theme.palette.success;
    }
  };
  
  // Get icon based on type
  const getIcon = () => {
    if (icon) return icon;
    
    switch (type) {
      case 'success':
        return <CheckCircleIcon />;
      case 'error':
        return <ErrorIcon />;
      case 'info':
        return <InfoIcon />;
      case 'warning':
        return <WarningIcon />;
      default:
        return <CheckCircleIcon />;
    }
  };
  
  // Get animation styles
  const animationPreset = animationPresets[animationType];
  const entryAnimation = animationPreset ? animationPreset({
    duration: 300,
    respectReducedMotion: true
  }) : {};
  
  const exitAnimation = animationPresets.fadeOut ? animationPresets.fadeOut({
    duration: 200,
    respectReducedMotion: true
  }) : {};
  
  // If not visible, don't render
  if (!visible && !show) {
    return null;
  }
  
  const color = getColor();
  
  // Minimal version
  if (minimal) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          color: color.main,
          ...(visible ? entryAnimation : exitAnimation),
          ...sx
        }}
        {...boxProps}
      >
        {showIcon && (
          <Box sx={{ mr: 1, display: 'flex', alignItems: 'center' }}>
            {getIcon()}
          </Box>
        )}
        {message && <Typography variant="body2">{message}</Typography>}
        {children}
      </Box>
    );
  }
  
  // Full version
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        p: 2,
        borderRadius: 1,
        bgcolor: alpha(color.main, 0.1),
        border: `1px solid ${alpha(color.main, 0.2)}`,
        color: color.main,
        ...(visible ? entryAnimation : exitAnimation),
        ...sx
      }}
      {...boxProps}
    >
      {showIcon && (
        <Box sx={{ mr: 1.5, display: 'flex', alignItems: 'center' }}>
          {getIcon()}
        </Box>
      )}
      <Box sx={{ flex: 1 }}>
        {message && <Typography variant="body2">{message}</Typography>}
        {children}
      </Box>
    </Box>
  );
};

export default AnimatedFeedback; 