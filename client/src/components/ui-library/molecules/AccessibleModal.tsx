import React, { useEffect } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  IconButton, 
  Typography,
  Box
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import useFocusTrap from '../../../hooks/useFocusTrap';

interface AccessibleModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | false;
  fullWidth?: boolean;
  ariaDescribedBy?: string;
  disableBackdropClick?: boolean;
}

/**
 * An accessible modal component that implements proper focus management
 * and keyboard navigation according to WAI-ARIA practices
 */
const AccessibleModal: React.FC<AccessibleModalProps> = ({
  open,
  onClose,
  title,
  children,
  actions,
  maxWidth = 'sm',
  fullWidth = true,
  ariaDescribedBy,
  disableBackdropClick = false
}) => {
  // Use the focus trap hook to manage focus within the modal
  const containerRef = useFocusTrap(open, onClose);
  
  // Handle escape key and backdrop click
  const handleClose = (event: {}, reason: 'backdropClick' | 'escapeKeyDown') => {
    if (disableBackdropClick && reason === 'backdropClick') {
      return;
    }
    onClose();
  };
  
  // Prevent scrolling of the body when modal is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth={maxWidth}
      fullWidth={fullWidth}
      aria-labelledby="accessible-modal-title"
      aria-describedby={ariaDescribedBy}
      ref={containerRef}
    >
      <DialogTitle id="accessible-modal-title">
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h6" component="h2">
            {title}
          </Typography>
          <IconButton
            edge="end"
            color="inherit"
            onClick={onClose}
            aria-label="close"
            size="large"
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent dividers>
        {children}
      </DialogContent>
      
      {actions && (
        <DialogActions>
          {actions}
        </DialogActions>
      )}
    </Dialog>
  );
};

export default AccessibleModal; 