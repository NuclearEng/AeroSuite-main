import React, { ReactNode } from 'react';
import ErrorDialog from './ErrorDialog';
import ErrorBoundary from './ErrorBoundary';
import useErrorHandling from '../../hooks/useErrorHandling';
import { AppError, ErrorRecoveryAction } from '../../utils/errorHandling';

interface ErrorHandlerProps {
  children: ReactNode;
  context?: string;
  defaultRecoveryAction?: ErrorRecoveryAction;
  onError?: (error: AppError) => void;
  withBoundary?: boolean;
  boundaryFallback?: ReactNode | ((error: AppError, resetErrorBoundary: () => void) => ReactNode);
  boundaryResetKeys?: any[];
}

/**
 * A component that provides comprehensive error handling
 * 
 * This component combines error boundaries for catching render errors
 * and error dialogs for displaying API and other runtime errors.
 */
const ErrorHandler: React.FC<ErrorHandlerProps> = ({
  children,
  context,
  defaultRecoveryAction,
  onError,
  withBoundary = true,
  boundaryFallback,
  boundaryResetKeys
}) => {
  const {
    error,
    isDialogOpen,
    closeErrorDialog,
    getRecoveryActions
  } = useErrorHandling({
    context,
    defaultRecoveryAction,
    onError
  });
  
  // Wrap content with error boundary if requested
  const content = withBoundary ? (
    <ErrorBoundary
      fallback={boundaryFallback}
      onError={onError}
      resetOnPropsChange={!!boundaryResetKeys}
      resetKeys={boundaryResetKeys}
    >
      {children}
    </ErrorBoundary>
  ) : children;
  
  return (
    <>
      {content}
      
      <ErrorDialog
        open={isDialogOpen}
        error={error}
        onClose={closeErrorDialog}
        actions={getRecoveryActions()}
      />
    </>
  );
};

export default ErrorHandler;

/**
 * Create a higher-order component with error handling
 */
export const withErrorHandler = <P extends object>(
  Component: React.ComponentType<P>,
  options: Omit<ErrorHandlerProps, 'children'> = {}
) => {
  const WithErrorHandler: React.FC<P> = (props) => (
    <ErrorHandler {...options}>
      <Component {...props} />
    </ErrorHandler>
  );
  
  WithErrorHandler.displayName = `WithErrorHandler(${Component.displayName || Component.name || 'Component'})`;
  
  return WithErrorHandler;
}; 