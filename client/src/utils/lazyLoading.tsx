import React, { Suspense, lazy, ComponentType } from 'react';
import { Box, CircularProgress, Typography, Button, Paper, useTheme, alpha } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { SROnly } from './accessibility';

/**
 * Default loading component displayed while the lazy component is loading
 */
export const DefaultLoadingComponent: React.FC<{ message?: string }> = ({ 
  message = 'Loading...' 
}) => {
  const theme = useTheme();
  
  return (
    <Box 
      sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        flexDirection: 'column',
        p: 4,
        minHeight: 200,
        width: '100%'
      }}
      role="status"
      aria-live="polite"
    >
      <CircularProgress size={40} color="primary" />
      <Typography 
        variant="body2" 
        color="text.secondary" 
        sx={{ mt: 2 }}
      >
        {message}
      </Typography>
      <SROnly>Content is loading</SROnly>
    </Box>
  );
};

/**
 * Default error component displayed when the lazy component fails to load
 */
export const DefaultErrorComponent: React.FC<{ 
  error: Error; 
  resetErrorBoundary?: () => void;
}> = ({ 
  error, 
  resetErrorBoundary 
}) => {
  const theme = useTheme();
  
  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 200,
        border: `1px solid ${alpha(theme.palette.error.main, 0.3)}`,
        bgcolor: alpha(theme.palette.error.main, 0.05),
        borderRadius: 1,
      }}
      role="alert"
    >
      <ErrorOutlineIcon 
        color="error" 
        sx={{ fontSize: 40, mb: 2 }} 
      />
      <Typography 
        variant="h6" 
        color="error" 
        align="center" 
        gutterBottom
      >
        Failed to load component
      </Typography>
      <Typography 
        variant="body2" 
        color="text.secondary" 
        align="center" 
        sx={{ mb: 2 }}
      >
        {error.message || 'An unexpected error occurred'}
      </Typography>
      {resetErrorBoundary && (
        <Button 
          variant="outlined" 
          color="primary" 
          onClick={resetErrorBoundary}
          size="small"
        >
          Try Again
        </Button>
      )}
    </Paper>
  );
};

/**
 * Error boundary component to catch errors in lazy loaded components
 */
export class LazyLoadErrorBoundary extends React.Component<
  { 
    children: React.ReactNode; 
    fallback?: React.ComponentType<{ error: Error; resetErrorBoundary: () => void }>;
  }, 
  { 
    hasError: boolean; 
    error: Error | null;
  }
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ComponentType<any> }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Lazy component failed to load:', error, errorInfo);
  }

  resetErrorBoundary = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      const ErrorComponent = this.props.fallback || DefaultErrorComponent;
      return (
        <ErrorComponent 
          error={this.state.error} 
          resetErrorBoundary={this.resetErrorBoundary} 
        />
      );
    }

    return this.props.children;
  }
}

/**
 * Create a lazy loaded component with suspense and error boundary
 * 
 * @param importFn - Dynamic import function for the component
 * @param LoadingComponent - Component to show while loading
 * @param ErrorComponent - Component to show if loading fails
 * @returns Lazy loaded component wrapped in Suspense and ErrorBoundary
 */
export function lazyLoad<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  LoadingComponent: React.ComponentType<any> = DefaultLoadingComponent,
  ErrorComponent?: React.ComponentType<{ error: Error; resetErrorBoundary: () => void }>
) {
  const LazyComponent = lazy(importFn);

  return (props: React.ComponentProps<T>) => (
    <LazyLoadErrorBoundary fallback={ErrorComponent}>
      <Suspense fallback={<LoadingComponent />}>
        <LazyComponent {...props} />
      </Suspense>
    </LazyLoadErrorBoundary>
  );
}

/**
 * Create a lazy loaded route component for React Router
 * 
 * @param importFn - Dynamic import function for the component
 * @param LoadingComponent - Component to show while loading
 * @param ErrorComponent - Component to show if loading fails
 * @returns Lazy loaded component for routes
 */
export function lazyRoute<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  LoadingComponent: React.ComponentType<any> = DefaultLoadingComponent,
  ErrorComponent?: React.ComponentType<{ error: Error; resetErrorBoundary: () => void }>
) {
  return lazyLoad(importFn, LoadingComponent, ErrorComponent);
}

export default lazyLoad; 