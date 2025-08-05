import React from 'react';
import {
  Box,
  CircularProgress
} from '@mui/material';

interface LoadingStateProps {
  size?: number;
}

const LoadingState: React.FC<LoadingStateProps> = ({
  size = 40
}) => {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
      <CircularProgress size={size} />
    </Box>
  );
};

export default LoadingState; 