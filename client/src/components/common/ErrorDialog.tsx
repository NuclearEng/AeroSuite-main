import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Alert,
  AlertTitle,
  Collapse,
  Divider,
  IconButton
} from '@mui/material';
import {
  Close as CloseIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { 
  AppError, 
  ErrorRecoveryAction, 
  ErrorSeverity, 
  ErrorType,
  getUserFriendlyErrorMessage
} from '../../utils/errorHandling';

interface ErrorDialogProps {
  open: boolean;
  error: AppError | null;
  onClose: () => void;
  title?: string;
  actions?: ErrorRecoveryAction[];
  disableBackdropClick?: boolean;
  fullWidth?: boolean;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

/**
 * A dialog component for displaying errors with user-friendly messages
 * and recovery options
 */
const ErrorDialog: React.FC<ErrorDialogProps> = ({
  open,
  error,
  onClose,
  title,
  actions = [],
  disableBackdropClick = false,
  fullWidth = true,
  maxWidth = 'sm'
}) => {
  const [showDetails, setShowDetails] = useState(false);
  
  if (!error) {
    return null;
  }
  
  const handleClose = (event: {}, reason: string) => {
    if (disableBackdropClick && reason === 'backdropClick') {
      return;
    }
    onClose();
  };
  
  const toggleDetails = () => {
    setShowDetails(!showDetails);
  };
  
  const errorMessage = getUserFriendlyErrorMessage(error);
  
  // Determine severity icon
  let SeverityIcon = ErrorIcon;
  let severityColor = 'error';
  
  if (error.severity === ErrorSeverity.WARNING) {
    SeverityIcon = WarningIcon;
    severityColor = 'warning';
  } else if (error.severity === ErrorSeverity.INFO) {
    SeverityIcon = InfoIcon;
    severityColor = 'info';
  }
  
  // Generate dialog title based on error type if not provided
  const dialogTitle = title || (
    error.type === ErrorType.SERVER
      ? 'Server Error'
      : error.type === ErrorType.NETWORK
        ? 'Network Error'
        : error.type === ErrorType.AUTHENTICATION
          ? 'Authentication Error'
          : error.type === ErrorType.VALIDATION
            ? 'Validation Error'
            : 'Error'
  );
  
  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth={fullWidth}
      maxWidth={maxWidth}
      aria-labelledby="error-dialog-title"
    >
      <DialogTitle id="error-dialog-title" sx={{ display: 'flex', alignItems: 'center' }}>
        <SeverityIcon color={severityColor as any} sx={{ mr: 1 }} />
        <Typography variant="h6" component="span" sx={{ flexGrow: 1 }}>
          {dialogTitle}
        </Typography>
        <IconButton edge="end" onClick={onClose} aria-label="close">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent dividers>
        <Alert 
          severity={
            error.severity === ErrorSeverity.ERROR || error.severity === ErrorSeverity.CRITICAL
              ? 'error'
              : error.severity === ErrorSeverity.WARNING
                ? 'warning'
                : 'info'
          }
          sx={{ mb: 2 }}
        >
          <AlertTitle>
            {error.type === ErrorType.VALIDATION
              ? 'Please check your input'
              : error.type === ErrorType.NETWORK
                ? 'Connection issue'
                : error.type === ErrorType.AUTHENTICATION
                  ? 'Authentication required'
                  : 'Error details'}
          </AlertTitle>
          {errorMessage}
        </Alert>
        
        {error.field && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            <strong>Field:</strong> {error.field}
          </Typography>
        )}
        
        <Box sx={{ mt: 2 }}>
          <Button
            size="small"
            color="inherit"
            onClick={toggleDetails}
            endIcon={showDetails ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          >
            {showDetails ? 'Hide' : 'Show'} Technical Details
          </Button>
          
          <Collapse in={showDetails}>
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
                    fontSize: '0.75rem',
                    maxHeight: '150px',
                    overflow: 'auto'
                  }}>
                    {error.originalError.stack || error.originalError.toString()}
                  </Typography>
                </>
              )}
            </Box>
          </Collapse>
        </Box>
      </DialogContent>
      
      <DialogActions>
        {actions.length > 0 ? (
          // Show custom actions if provided
          actions.map((action, index: any) => (
            <Button
              key={index}
              onClick={() => {
                action.action();
                onClose();
              }}
              color="primary"
              variant={action.primary ? 'contained' : 'outlined'}
            >
              {action.label}
            </Button>
          ))
        ) : (
          // Default close button
          <Button onClick={onClose} color="primary" variant="contained">
            Close
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default ErrorDialog; 