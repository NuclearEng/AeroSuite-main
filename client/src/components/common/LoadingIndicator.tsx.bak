import React from 'react';
import { Box, CircularProgress, Typography, useTheme } from '@mui/material';

interface LoadingIndicatorProps {
  message?: string;
  size?: number;
  fullScreen?: boolean;
  overlay?: boolean;
}

/**
 * A reusable loading indicator component
 */
const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  message = 'Loading...',
  size = 40,
  fullScreen = false,
  overlay = false
}) => {
  const theme = useTheme();
  
  const content = (
    <>
      <CircularProgress size={size} thickness={4} />
      {message && (
        <Typography
          variant="body1"
          color="textSecondary"
          sx={{ mt: 2, textAlign: 'center' }}
        >
          {message}
        </Typography>
      )}
    </>
  );
  
  if (fullScreen) {
    return (
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: overlay ? theme.zIndex.modal + 1 : theme.zIndex.appBar - 1,
          bgcolor: overlay ? 'rgba(0, 0, 0, 0.5)' : 'background.paper'
        }}
      >
        {content}
      </Box>
    );
  }
  
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: 4
      }}
    >
      {content}
    </Box>
  );
};

export default LoadingIndicator; 