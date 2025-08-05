import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Box,
  Chip,
  Typography
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon
} from '@mui/icons-material';

interface SaveConfirmationDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  overallScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  isUpdate: boolean;
}

const SaveConfirmationDialog: React.FC<SaveConfirmationDialogProps> = ({
  open,
  onClose,
  onConfirm,
  overallScore,
  riskLevel,
  isUpdate
}) => {
  // Risk color and icon mapping
  const riskColorMap = {
    low: '#4caf50',
    medium: '#ff9800',
    high: '#f44336'
  };
  
  const riskIconMap = {
    low: <CheckCircleIcon />,
    medium: <WarningIcon />,
    high: <ErrorIcon />
  };
  
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>
        {isUpdate ? 'Update Risk Assessment' : 'Save Risk Assessment'}
      </DialogTitle>
      <DialogContent>
        <DialogContentText>
          You are about to {isUpdate ? 'update' : 'save'} a risk assessment with the following risk profile:
        </DialogContentText>
        
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', my: 3 }}>
          <Chip
            icon={riskIconMap[riskLevel]}
            label={`${riskLevel.toUpperCase()} RISK (${overallScore.toFixed(1)}/5.0)`}
            sx={{
              fontSize: '1rem',
              py: 2.5,
              px: 1.5,
              bgcolor: `${riskColorMap[riskLevel]}15`,
              color: riskColorMap[riskLevel],
              fontWeight: 'bold',
              '& .MuiChip-icon': {
                color: riskColorMap[riskLevel]
              }
            }}
          />
        </Box>
        
        <Typography variant="body2" color="text.secondary">
          {riskLevel === 'low' && 'This supplier appears to present a low risk to your supply chain.'}
          {riskLevel === 'medium' && 'This supplier presents some risk factors that should be monitored.'}
          {riskLevel === 'high' && 'This supplier shows significant risk factors that require attention.'}
          {' '}Are you sure you want to {isUpdate ? 'update' : 'save'} this assessment?
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button 
          onClick={onConfirm} 
          color="primary" 
          variant="contained"
          autoFocus
        >
          {isUpdate ? 'Update Assessment' : 'Save Assessment'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SaveConfirmationDialog; 