/**
 * Higher Order Component (HOC) Pattern
 * 
 * @task RF015 - Implement component composition patterns
 * 
 * The HOC pattern creates a function that takes a component and returns a new component
 * with enhanced functionality. This pattern is useful for reusing component logic and
 * cross-cutting concerns like loading states, error handling, and authentication.
 * 
 * Examples: withLoading and withErrorHandling HOCs
 */

import React, { ComponentType, useState, useEffect } from 'react';

// Types for the withLoading HOC
interface WithLoadingProps {
  isLoading?: boolean;
  loadingMessage?: string;
}

/**
 * withLoading HOC
 * 
 * Adds loading state handling to a component
 */
export function WithLoading<P extends object>(
WrappedComponent: ComponentType<P>,
LoadingComponent: ComponentType<{message?: string;}> = DefaultLoadingComponent)
{
  // Return a new component with loading functionality
  return function WithLoadingComponent({
    isLoading = false,
    loadingMessage = 'Loading...',
    ...props
  }: P & WithLoadingProps) {
    // Show loading component if isLoading is true
    if (isLoading) {
      return <LoadingComponent message={loadingMessage} />;
    }

    // Otherwise, render the wrapped component
    return <WrappedComponent {...props as P} />;
  };
}

// Default loading component
const DefaultLoadingComponent: React.FC<{message?: string;}> = ({ message = 'Loading...' }) =>
<div className="loading-container">
    <div className="loading-spinner"></div>
    <p>{message}</p>
  </div>;


// Types for the withErrorHandling HOC
interface WithErrorHandlingProps {
  onError?: (error: Error) => void;
}

interface WithErrorHandlingState {
  hasError: boolean;
  error: Error | null;
}

/**
 * withErrorHandling HOC
 * 
 * Adds error boundary functionality to a component
 */
export function WithErrorHandling<P extends object>(
WrappedComponent: ComponentType<P>,
ErrorComponent: ComponentType<{error: Error | null;onReset: () => void;}> = DefaultErrorComponent)
{
  // Return a class component that acts as an error boundary
  return class WithErrorHandling extends React.Component<P & WithErrorHandlingProps, WithErrorHandlingState> {
    constructor(props: P & WithErrorHandlingProps) {
      super(props);
      this.state = { hasError: false, error: null };
      this.handleReset = this.handleReset.bind(this);
    }

    static getDerivedStateFromError(error: Error): WithErrorHandlingState {
      return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
      console.error('Error in WithErrorHandling HOC:', error, errorInfo);
      if (this.props.onError) {
        this.props.onError(error);
      }
    }

    handleReset(): void {
      this.setState({ hasError: false, error: null });
    }

    render(): React.ReactNode {
      if (this.state.hasError) {
        return <ErrorComponent error={this.state.error} onReset={this.handleReset} />;
      }

      return <WrappedComponent {...this.props} />;
    }
  };
}

// Default error component
const DefaultErrorComponent: React.FC<{error: Error | null;onReset: () => void;}> = ({
  error,
  onReset
}) =>
<div className="error-container">
    <h3>Something went wrong</h3>
    <p>{error?.message || 'Unknown error'}</p>
    <button onClick={onReset}>Try Again</button>
  </div>;


/**
 * withDataFetching HOC
 * 
 * Combines loading and error handling with data fetching
 */
export function WithDataFetching<P extends object, T>(
WrappedComponent: ComponentType<P & {data: T;}>,
fetchData: () => Promise<T>,
LoadingComponent: ComponentType<{message?: string;}> = DefaultLoadingComponent,
ErrorComponent: ComponentType<{error: Error | null;onReset: () => void;}> = DefaultErrorComponent)
{
  return function WithDataFetching(props: P) {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const [data, setData] = useState<T | null>(null);

    const fetchDataAndHandleStates = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const result = await fetchData();
        setData(result);
      } catch (_err) {
        setError(_err instanceof Error ? _err : new Error('An unknown error occurred'));
      } finally {
        setIsLoading(false);
      }
    };

    useEffect(() => {
      fetchDataAndHandleStates();
    }, []);

    if (isLoading) {
      return <LoadingComponent />;
    }

    if (error) {
      return <ErrorComponent error={error} onReset={fetchDataAndHandleStates} />;
    }

    return <WrappedComponent {...props} data={data as T} />;
  };
}

export type { WithLoadingProps, WithErrorHandlingProps, WithErrorHandlingState };