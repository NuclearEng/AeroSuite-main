import React, { ComponentType, FC, lazy, Suspense, useState, useEffect } from 'react';
import { handleError } from './errorHandling';

interface LazyLoadOptions {
  fallback?: React.ReactNode;
  loadingDelay?: number;
  errorComponent?: ComponentType<{error: Error;retry: () => void;}>;
}

interface CustomComponentPropsWithRef<T> {
  ref?: React.Ref<T>;
  [key: string]: any;
}

function WithSuspense<T>(
Component: FC<CustomComponentPropsWithRef<T>>,
options: LazyLoadOptions = {})
: FC<CustomComponentPropsWithRef<T>> {
  const { fallback = null, loadingDelay = 0, errorComponent: ErrorComponent } = options;

  return function WrappedComponent(props: CustomComponentPropsWithRef<T>) {
    const [showLoading, setShowLoading] = useState(false);

    useEffect(() => {
      const timer = setTimeout(() => {
        setShowLoading(true);
      }, loadingDelay);

      return () => {
        clearTimeout(timer);
      };
    }, [loadingDelay]);

    if (!showLoading) {
      return null;
    }

    return (
      <Suspense fallback={fallback}>
        <ErrorBoundary ErrorComponent={ErrorComponent}>
          <Component {...props} />
        </ErrorBoundary>
      </Suspense>);

  };
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  ErrorComponent?: ComponentType<{error: Error;retry: () => void;}>;
}

interface ErrorBoundaryState {
  error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error): void {
    console.error('Error loading component:', error);
  }

  retry = (): void => {
    this.setState({ error: null });
  };

  render(): React.ReactNode {
    const { error } = this.state;
    const { children, ErrorComponent } = this.props;

    if (error) {
      if (ErrorComponent) {
        return <ErrorComponent error={error} retry={this.retry} />;
      }
      return null;
    }

    return children;
  }
}

export function lazyLoad<T>(
factory: () => Promise<{default: FC<CustomComponentPropsWithRef<T>>;}>,
options: LazyLoadOptions = {})
: FC<CustomComponentPropsWithRef<T>> {
  const LazyComponent = lazy(() => {
    return factory().catch((error) => {
      console.error('Failed to load component:', error);
      throw error;
    });
  });

  return WithSuspense(LazyComponent, options);
}