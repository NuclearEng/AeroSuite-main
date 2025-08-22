import React, { lazy, Suspense } from 'react';
import { CircularProgress, Box, Typography } from '@mui/material';

/**
 * Enhanced loading fallback component with configurable options
 */
interface LoadingFallbackProps {
  message?: string;
  height?: string | number;
  showSpinner?: boolean;
}

const LoadingFallback: React.FC<LoadingFallbackProps> = ({ 
  message = 'Loading...', 
  height = '200px',
  showSpinner = true
}) => (
  <Box 
    display="flex" 
    flexDirection="column"
    justifyContent="center" 
    alignItems="center" 
    height={height}
    data-testid="loading-fallback"
    role="alert"
    aria-busy="true"
    aria-live="polite"
  >
    {showSpinner && <CircularProgress size={40} thickness={4} />}
    <Typography variant="body1" sx={{ mt: 2, color: 'text.secondary' }}>
      {message}
    </Typography>
  </Box>
);

/**
 * Lazy load a route component with Suspense and enhanced loading fallback
 * 
 * @param importFn Function that returns a dynamic import promise
 * @param options Optional configuration for the loading fallback
 * @returns Lazy loaded component
 */
const lazyRoute = (
  importFn: () => Promise<{ default: React.ComponentType<any> }>,
  options: LoadingFallbackProps = {}
) => {
  const LazyComponent = lazy(importFn);
  
  return (props: any) => (
    <Suspense fallback={<LoadingFallback {...options} />}>
      <LazyComponent {...props} />
    </Suspense>
  );
};

export default lazyRoute; 