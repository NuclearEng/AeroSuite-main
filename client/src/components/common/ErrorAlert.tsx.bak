/**
 * @task TS008 - Client error reporting to server
 */
import React from 'react';
import { 
  Alert, 
  AlertTitle, 
  Box, 
  Button, 
  Paper, 
  Typography 
} from '@mui/material';
import { 
  Error as ErrorIcon, 
  Refresh as RefreshIcon 
} from '@mui/icons-material';

interface ErrorAlertProps {
  message: string;
  title?: string;
  onRetry?: () => void;
  severity?: 'error' | 'warning' | 'info';
  fullPage?: boolean;
}

/**
 * A reusable error alert component
 */
const ErrorAlert: React.FC<ErrorAlertProps> = ({
  message,
  title = 'Error',
  onRetry,
  severity = 'error',
  fullPage = false
}) => {
  if (fullPage) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          p: 4,
          textAlign: 'center',
          height: '100%',
          minHeight: 300
        }}
      >
        <ErrorIcon color={severity} sx={{ fontSize: 64, mb: 2 }} />
        <Typography variant="h5" color="error" gutterBottom>
          {title}
        </Typography>
        <Typography variant="body1" color="textSecondary" paragraph>
          {message}
        </Typography>
        {onRetry && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<RefreshIcon />}
            onClick={onRetry}
            sx={{ mt: 2 }}
          >
            Retry
          </Button>
        )}
      </Box>
    );
  }

  return (
    <Paper sx={{ mb: 3 }}>
      <Alert 
        severity={severity} 
        action={
          onRetry ? (
            <Button 
              color="inherit" 
              size="small" 
              onClick={onRetry}
              startIcon={<RefreshIcon />}
            >
              Retry
            </Button>
          ) : undefined
        }
      >
        <AlertTitle>{title}</AlertTitle>
        {message}
      </Alert>
    </Paper>
  );
};

export default ErrorAlert; 