/**
 * @task TS008 - Client error reporting to server
 */
import React, { Component, ErrorInfo, ReactNode } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Alert,
  AlertTitle,
  Stack,
  Divider,
  Collapse,
  IconButton
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  ArrowBack as ArrowBackIcon,
  Home as HomeIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import { 
  AppError, 
  ErrorType, 
  ErrorSeverity,
  parseApiError,
  getUserFriendlyErrorMessage,
  getErrorRecoveryActions,
  logError
} from '../../utils/errorHandling';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode | ((error: AppError, resetErrorBoundary: () => void) => ReactNode);
  onError?: (error: AppError, errorInfo: ErrorInfo) => void;
  resetOnPropsChange?: boolean;
  resetKeys?: any[];
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: AppError | null;
  showDetails: boolean;
}

/**
 * Error Boundary component that catches errors in its child component tree
 * and displays a fallback UI instead of crashing the whole application
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      showDetails: false
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error: parseApiError(error)
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error
    const appError = parseApiError(error);
    logError(appError);
    
    // Call onError callback if provided
    if (this.props.onError) {
      this.props.onError(appError, errorInfo);
    }
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps): void {
    // Reset the error state if resetOnPropsChange is true and resetKeys have changed
    if (
      this.state.hasError &&
      this.props.resetOnPropsChange &&
      this.props.resetKeys &&
      this.props.resetKeys.some((key, index) => key !== prevProps.resetKeys?.[index])
    ) {
      this.resetErrorBoundary();
    }
  }

  resetErrorBoundary = (): void => {
    this.setState({
      hasError: false,
      error: null,
      showDetails: false
    });
  };

  toggleDetails = (): void => {
    this.setState(prevState => ({
      showDetails: !prevState.showDetails
    }));
  };

  renderDefaultFallback = (error: AppError): ReactNode => {
    const recoveryActions = getErrorRecoveryActions(error, {
      label: 'Try Again',
      action: this.resetErrorBoundary,
      primary: true
    });

    const errorMessage = getUserFriendlyErrorMessage(error);
    const severity = error.severity === ErrorSeverity.ERROR || error.severity === ErrorSeverity.CRITICAL
      ? 'error'
      : error.severity === ErrorSeverity.WARNING
        ? 'warning'
        : 'info';

    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          p: 3,
          width: '100%'
        }}
      >
        <Card variant="outlined" sx={{ maxWidth: 600, width: '100%' }}>
          <CardContent>
            <Alert
              severity={severity}
              icon={<ErrorIcon fontSize="inherit" />}
              sx={{ mb: 2 }}
            >
              <AlertTitle>
                {error.type === ErrorType.SERVER
                  ? 'Server Error'
                  : error.type === ErrorType.NETWORK
                    ? 'Network Error'
                    : error.type === ErrorType.AUTHENTICATION
                      ? 'Authentication Error'
                      : 'Error'}
              </AlertTitle>
              {errorMessage}
            </Alert>

            <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
              {recoveryActions.map((action, index) => (
                <Button
                  key={index}
                  variant={action.primary ? 'contained' : 'outlined'}
                  color="primary"
                  onClick={action.action}
                  startIcon={
                    action.label === 'Try Again' ? <RefreshIcon /> :
                    action.label === 'Go Back' ? <ArrowBackIcon /> :
                    action.label === 'Go to Dashboard' ? <HomeIcon /> :
                    undefined
                  }
                >
                  {action.label}
                </Button>
              ))}
            </Stack>

            <Box sx={{ mt: 3 }}>
              <Button
                size="small"
                color="inherit"
                onClick={this.toggleDetails}
                endIcon={this.state.showDetails ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              >
                {this.state.showDetails ? 'Hide' : 'Show'} Technical Details
              </Button>
              
              <Collapse in={this.state.showDetails}>
                <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                  <Typography variant="subtitle2">Error Type: {error.type}</Typography>
                  {error.code && <Typography variant="subtitle2">Error Code: {error.code}</Typography>}
                  {error.requestId && <Typography variant="subtitle2">Request ID: {error.requestId}</Typography>}
                  <Typography variant="subtitle2">Timestamp: {error.timestamp.toLocaleString()}</Typography>
                  
                  {error.originalError && (
                    <>
                      <Divider sx={{ my: 1 }} />
                      <Typography variant="subtitle2">Original Error:</Typography>
                      <Typography variant="body2" component="pre" sx={{ 
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        fontSize: '0.75rem'
                      }}>
                        {error.originalError.stack || error.originalError.toString()}
                      </Typography>
                    </>
                  )}
                </Box>
              </Collapse>
            </Box>
          </CardContent>
        </Card>
      </Box>
    );
  };

  render(): ReactNode {
    const { children, fallback } = this.props;
    const { hasError, error } = this.state;

    if (hasError && error) {
      // Use custom fallback if provided
      if (fallback) {
        if (typeof fallback === 'function') {
          return fallback(error, this.resetErrorBoundary);
        }
        return fallback;
      }

      // Use default fallback
      return this.renderDefaultFallback(error);
    }

    return children;
  }
}

export default ErrorBoundary; 