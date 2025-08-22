import React from 'react';
import { Chip, ChipProps } from '@mui/material';

export interface StatusChipProps extends Omit<ChipProps, 'color'> {
  status: string;
  statusMapping?: Record<string, 'success' | 'warning' | 'error' | 'info' | 'default'>;
  capitalize?: boolean;
}

/**
 * Displays a status value as a colored chip with consistent styling
 */
const StatusChip: React.FC<StatusChipProps> = ({
  status,
  statusMapping,
  capitalize = true,
  ...chipProps
}) => {
  // Default mappings for common status values
  const defaultStatusMapping: Record<string, 'success' | 'warning' | 'error' | 'info' | 'default'> = {
    // General statuses
    active: 'success',
    inactive: 'default',
    pending: 'warning',
    completed: 'success',
    failed: 'error',
    error: 'error',
    warning: 'warning',
    info: 'info',
    
    // Compliance statuses
    compliant: 'success',
    'minor-issues': 'warning',
    'major-issues': 'error',
    'non-compliant': 'error',
    'pending-review': 'info',
    
    // Certification statuses
    expired: 'error',
    suspended: 'warning',
    'not-applicable': 'default',
    
    // Non-conformance statuses
    open: 'error',
    'in-progress': 'warning',
    closed: 'success',
    verified: 'success',
    
    // Non-conformance severity
    critical: 'error',
    major: 'error',
    minor: 'warning',
    observation: 'info',
    
    // Improvement plan statuses
    planned: 'info',
    inprogress: 'warning',
    overdue: 'error',
    cancelled: 'default',
  };

  // Determine the color based on status and mapping
  const mapping = statusMapping || defaultStatusMapping;
  const color = mapping[status.toLowerCase()] || 'default';
  
  // Format the label
  let label = status;
  if (capitalize) {
    // Handle hyphenated status values
    label = status
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  return <Chip label={label} color={color} size="small" {...chipProps} />;
};

export default StatusChip; 