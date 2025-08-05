// Dialog component for confirming risk assessment save
import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button,
  Box,
  Alert
} from '@mui/material';
import type { SaveConfirmationDialogProps } from '../types';

const SaveConfirmationDialog: React.FC<SaveConfirmationDialogProps> = ({
  open,
  onClose,
  onConfirm,
  supplier,
  riskLevel,
  overallScore,
  activeAssessment
}) => {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Save Risk Assessment</DialogTitle>
      <DialogContent>
        <Typography variant="body1">
          Are you sure you want to save this risk assessment?
        </Typography>
        
        {activeAssessment && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            This will overwrite the existing assessment for {activeAssessment.supplierName}.
          </Alert>
        )}
        
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2">
            <strong>Supplier:</strong> {supplier?.name}
          </Typography>
          <Typography variant="body2">
            <strong>Risk Level:</strong> {riskLevel.toUpperCase()}
          </Typography>
          <Typography variant="body2">
            <strong>Overall Score:</strong> {overallScore.toFixed(2)}
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={onConfirm} variant="contained" color="primary">
          Confirm
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SaveConfirmationDialog; 