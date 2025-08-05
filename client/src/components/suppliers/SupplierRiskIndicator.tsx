import React from 'react';
import Box from '@mui/material/Box';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';

export type SupplierRiskLevel = 'Low' | 'Medium' | 'High' | 'Critical';

export interface SupplierRiskIndicatorProps {
  risk: SupplierRiskLevel;
  reason?: string;
}

const riskColor = {
  Low: 'success.main',
  Medium: 'warning.main',
  High: 'error.main',
  Critical: 'error.dark',
} as const;

const riskIcon = {
  Low: <CheckCircleIcon color="success" />,
  Medium: <WarningIcon color="warning" />,
  High: <ErrorIcon color="error" />,
  Critical: <ErrorIcon color="error" sx={{ color: 'error.dark' }} />,
};

const SupplierRiskIndicator: React.FC<SupplierRiskIndicatorProps> = ({ risk, reason }) => {
  return (
    <Tooltip title={reason || `Risk: ${risk}`}> 
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }} aria-label={`Supplier risk: ${risk}`}>
        {riskIcon[risk]}
        <Typography variant="body2" sx={{ color: riskColor[risk], fontWeight: 600 }}>
          {risk}
        </Typography>
      </Box>
    </Tooltip>
  );
};

export default SupplierRiskIndicator; 