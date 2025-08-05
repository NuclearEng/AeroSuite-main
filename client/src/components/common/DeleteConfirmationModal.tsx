import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button,
  Box,
  Alert,
  IconButton,
  useTheme,
} from '@mui/material';
import {
  Warning as WarningIcon,
  Close as CloseIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';

interface DeleteConfirmationModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title?: string;
  message?: string;
  itemName?: string;
  itemType?: string;
  loading?: boolean;
  error?: string | null;
  confirmButtonText?: string;
  cancelButtonText?: string;
  severity?: 'warning' | 'error';
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  open,
  onClose,
  onConfirm,
  title = 'Confirm Deletion',
  message,
  itemName,
  itemType = 'item',
  loading = false,
  error = null,
  confirmButtonText = 'Delete',
  cancelButtonText = 'Cancel',
  severity = 'warning',
}) => {
  const theme = useTheme();

  const defaultMessage = itemName
    ? `Are you sure you want to delete "${itemName}"? This action cannot be undone.`
    : `Are you sure you want to delete this ${itemType}? This action cannot be undone.`;

  const handleConfirm = async () => {
    await onConfirm();
  };

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      maxWidth="sm"
      fullWidth
      aria-labelledby="delete-confirmation-dialog-title"
      aria-describedby="delete-confirmation-dialog-description"
    >
      <DialogTitle id="delete-confirmation-dialog-title">
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <WarningIcon 
              color={severity} 
              sx={{ fontSize: 28 }} 
            />
            <Typography variant="h6" component="span">
              {title}
            </Typography>
          </Box>
          <IconButton
            aria-label="close"
            onClick={onClose}
            disabled={loading}
            sx={{
              color: theme.palette.grey[500],
              '&:hover': {
                color: theme.palette.grey[700],
              },
            }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        <Box id="delete-confirmation-dialog-description">
          <Typography variant="body1" paragraph>
            {message || defaultMessage}
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}

          <Alert severity={severity} sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>Warning:</strong> This action is permanent and cannot be reversed.
            </Typography>
          </Alert>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button
          onClick={onClose}
          disabled={loading}
          variant="outlined"
          color="inherit"
        >
          {cancelButtonText}
        </Button>
        <Button
          onClick={handleConfirm}
          disabled={loading}
          variant="contained"
          color="error"
          startIcon={loading ? null : <DeleteIcon />}
          sx={{ minWidth: 100 }}
        >
          {loading ? 'Deleting...' : confirmButtonText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteConfirmationModal;