import React from 'react';
import {
  Alert,
  Button
} from '@mui/material';

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

const ErrorState: React.FC<ErrorStateProps> = ({
  message,
  onRetry
}) => {
  return (
    <Alert 
      severity="error" 
      action={
        onRetry && (
          <Button color="inherit" size="small" onClick={onRetry}>
            Retry
          </Button>
        )
      }
    >
      {message}
    </Alert>
  );
};

export default ErrorState; 