import React from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  IconButton, 
  Typography, 
  Box,
  Button,
  useTheme
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  children: React.ReactNode;
  actions?: React.ReactNode;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | false;
  fullWidth?: boolean;
  fullScreen?: boolean;
  showCloseButton?: boolean;
  preventBackdropClose?: boolean;
  contentSx?: React.CSSProperties;
  titleSx?: React.CSSProperties;
  showConfirmButtons?: boolean;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  confirmDisabled?: boolean;
  confirmColor?: 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning';
  dividers?: boolean;
  sx?: any;
}

const Modal: React.FC<ModalProps> = ({
  open,
  onClose,
  title,
  children,
  actions,
  maxWidth = 'sm',
  fullWidth = true,
  fullScreen = false,
  showCloseButton = true,
  preventBackdropClose = false,
  contentSx,
  titleSx,
  showConfirmButtons = false,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  confirmDisabled = false,
  confirmColor = 'primary',
  dividers = true,
  sx = {},
}) => {
  const theme = useTheme();
  
  const handleClose = (_: React.MouseEvent<HTMLElement>, reason?: string) => {
    if (preventBackdropClose && reason === 'backdropClick') {
      return;
    }
    onClose();
  };
  
  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
    onClose();
  };
  
  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth={maxWidth}
      fullWidth={fullWidth}
      fullScreen={fullScreen}
      aria-labelledby="modal-title"
      sx={{
        '& .MuiDialog-paper': {
          borderRadius: 2,
          boxShadow: theme.shadows[10]
        },
        ...sx
      }}
    >
      <DialogTitle 
        id="modal-title" 
        sx={{ 
          p: 3, 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          ...titleSx
        }}
      >
        {typeof title === 'string' ? (
          <Typography variant="h6" component="h2" sx={{ fontWeight: 600 }}>
            {title}
          </Typography>
        ) : (
          title
        )}
        
        {showCloseButton && (
          <IconButton
            aria-label="close"
            onClick={() => onClose()}
            sx={{
              color: theme.palette.grey[500],
              transition: 'all 0.2s',
              '&:hover': {
                transform: 'rotate(90deg)',
                color: theme.palette.primary.main
              }
            }}
          >
            <CloseIcon />
          </IconButton>
        )}
      </DialogTitle>
      
      <DialogContent dividers={dividers} sx={{ p: 3, ...contentSx }}>
        {children}
      </DialogContent>
      
      {(actions || showConfirmButtons) && (
        <DialogActions sx={{ p: 2.5 }}>
          {showConfirmButtons ? (
            <>
              <Button 
                variant="outlined" 
                onClick={onClose}
                sx={{ mr: 1 }}
              >
                {cancelText}
              </Button>
              <Button 
                variant="contained" 
                color={confirmColor}
                onClick={handleConfirm}
                disabled={confirmDisabled}
              >
                {confirmText}
              </Button>
            </>
          ) : actions}
        </DialogActions>
      )}
    </Dialog>
  );
};

export default Modal; 