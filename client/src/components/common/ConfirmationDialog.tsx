import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  IconButton,
  Typography,
  Box,
  Divider,
  useTheme } from
'@mui/material';
import {
  Close as CloseIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Error as ErrorIcon,
  CheckCircle as SuccessIcon,
  Help as HelpIcon } from
'@mui/icons-material';
import { LoadingButton } from './index';
import { animations } from '../../theme/theme';

export type ConfirmationDialogType = 'info' | 'warning' | 'error' | 'success' | 'confirm' | 'delete' | 'custom';

export interface ConfirmationDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string | React.ReactNode;
  confirmButtonText?: string;
  cancelButtonText?: string;
  type?: ConfirmationDialogType;
  loading?: boolean;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | false;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  children?: React.ReactNode;
  disableBackdropClick?: boolean;
  disableEscapeKeyDown?: boolean;
  confirmButtonColor?: 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning';
  cancelButtonColor?: 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning';
  hideCloseButton?: boolean;
  confirmButtonProps?: any;
  cancelButtonProps?: any;
  DialogProps?: any;
}

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmButtonText,
  cancelButtonText = 'Cancel',
  type = 'confirm',
  loading = false,
  maxWidth = 'sm',
  fullWidth = true,
  icon,
  children,
  disableBackdropClick = false,
  disableEscapeKeyDown = false,
  confirmButtonColor,
  cancelButtonColor = 'primary',
  hideCloseButton = false,
  confirmButtonProps = {},
  cancelButtonProps = {},
  DialogProps = {}
}) => {
  const theme = useTheme();

  // Get default icon and text based on type
  const getTypeDefaults = () => {
    switch (type) {
      case 'info':
        return {
          icon: <InfoIcon fontSize="large" color="info" />,
          title: title || 'Information',
          confirmText: confirmButtonText || 'OK',
          confirmColor: confirmButtonColor || 'info'
        };
      case 'warning':
        return {
          icon: <WarningIcon fontSize="large" color="warning" />,
          title: title || 'Warning',
          confirmText: confirmButtonText || 'OK',
          confirmColor: confirmButtonColor || 'warning'
        };
      case 'error':
        return {
          icon: <ErrorIcon fontSize="large" color="error" />,
          title: title || 'Error',
          confirmText: confirmButtonText || 'OK',
          confirmColor: confirmButtonColor || 'error'
        };
      case 'success':
        return {
          icon: <SuccessIcon fontSize="large" color="success" />,
          title: title || 'Success',
          confirmText: confirmButtonText || 'OK',
          confirmColor: confirmButtonColor || 'success'
        };
      case 'delete':
        return {
          icon: <ErrorIcon fontSize="large" color="error" />,
          title: title || 'Confirm Deletion',
          confirmText: confirmButtonText || 'Delete',
          confirmColor: confirmButtonColor || 'error'
        };
      case 'custom':
        return {
          icon: icon,
          title: title,
          confirmText: confirmButtonText || 'Confirm',
          confirmColor: confirmButtonColor || 'primary'
        };
      case 'confirm':
      default:
        return {
          icon: icon || <HelpIcon fontSize="large" color="primary" />,
          title: title || 'Confirm Action',
          confirmText: confirmButtonText || 'Confirm',
          confirmColor: confirmButtonColor || 'primary'
        };
    }
  };

  const { icon: typeIcon, title: typeTitle, confirmText, confirmColor } = getTypeDefaults();

  // Handle backdrop click
  const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (disableBackdropClick) {
      event.stopPropagation();
      return;
    }
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={maxWidth}
      fullWidth={fullWidth}
      onBackdropClick={handleBackdropClick}
      disableEscapeKeyDown={disableEscapeKeyDown}
      TransitionProps={{
        timeout: {
          enter: 300,
          exit: 200
        }
      }}
      PaperProps={{
        elevation: 5,
        sx: {
          borderRadius: 2,
          overflow: 'hidden'
        }
      }}
      {...DialogProps}>

      
      <DialogTitle
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          bgcolor: type !== 'custom' ? `${confirmColor}.light` + '10' : undefined
        }}>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {typeIcon}
          <Typography variant="h6" component="span">
            {typeTitle}
          </Typography>
        </Box>
        {!hideCloseButton &&
        <IconButton
          edge="end"
          color="inherit"
          onClick={onClose}
          aria-label="close"
          sx={{
            transition: animations.microInteraction,
            '&:hover': {
              transform: 'rotate(90deg)'
            }
          }}>

            <CloseIcon />
          </IconButton>
        }
      </DialogTitle>

      <Divider />

      
      <DialogContent sx={{ p: 3 }}>
        {message &&
        <DialogContentText
          sx={{
            color: 'text.primary',
            mb: children ? 2 : 0
          }}>

            {message}
          </DialogContentText>
        }
        {children}
      </DialogContent>

      
      <DialogActions sx={{ p: 2, pt: 0 }}>
        <Button
          variant="outlined"
          onClick={onClose}
          color={cancelButtonColor}
          disabled={loading}
          {...cancelButtonProps}>

          {cancelButtonText}
        </Button>
        <LoadingButton
          variant="contained"
          onClick={onConfirm}
          color={confirmColor}
          loading={loading}
          autoFocus
          {...confirmButtonProps}>

          {confirmText}
        </LoadingButton>
      </DialogActions>
    </Dialog>);

};

export default ConfirmationDialog;