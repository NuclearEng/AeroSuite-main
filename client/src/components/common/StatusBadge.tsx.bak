import React from 'react';
import { Chip, ChipProps, useTheme } from '@mui/material';

export type StatusType = 'scheduled' | 'in-progress' | 'completed' | 'cancelled' | 'pending' | 'active' | 'expired' | 'success' | 'warning' | 'error' | 'info' | 'default';

interface StatusBadgeProps {
  status: StatusType | string;
  label?: string;
  size?: 'small' | 'medium';
  sx?: ChipProps['sx'];
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ 
  status, 
  label, 
  size = 'small',
  sx
}) => {
  const theme = useTheme();
  
  // Map status to color and variant
  const getStatusConfig = () => {
    switch (status) {
      case 'scheduled':
      case 'pending':
      case 'info':
        return { 
          color: 'info', 
          variant: 'filled' as const
        };
      
      case 'in-progress':
      case 'warning':
        return { 
          color: 'warning', 
          variant: 'filled' as const
        };
      
      case 'completed':
      case 'active':
      case 'success':
        return { 
          color: 'success', 
          variant: 'filled' as const
        };
      
      case 'cancelled':
      case 'expired':
      case 'error':
        return { 
          color: 'error', 
          variant: 'filled' as const
        };
        
      default:
        return { 
          color: 'default', 
          variant: 'outlined' as const
        };
    }
  };
  
  const config = getStatusConfig();
  const displayLabel = label || status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ');
  
  return (
    <Chip
      label={displayLabel}
      color={config.color as ChipProps['color']}
      variant={config.variant}
      size={size}
      sx={{
        fontWeight: 600,
        borderRadius: '6px',
        textTransform: 'capitalize',
        ...sx
      }}
    />
  );
};

export default StatusBadge; 