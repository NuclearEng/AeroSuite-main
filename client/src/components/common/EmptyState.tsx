import React from 'react';
import {
  Box,
  Typography,
  Paper,
  SvgIconProps
} from '@mui/material';
import { ViewList as ViewListIcon } from '@mui/icons-material';

interface EmptyStateProps {
  message: string;
  icon?: React.ReactElement<SvgIconProps>;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  message,
  icon = <ViewListIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 2 }} />
}) => {
  return (
    <Box sx={{ textAlign: 'center', p: 3 }}>
      <Paper 
        elevation={0} 
        sx={{ 
          p: 3, 
          bgcolor: 'background.default',
          border: '1px dashed',
          borderColor: 'divider'
        }}
      >
        {icon}
        <Typography color="textSecondary" gutterBottom>
          {message}
        </Typography>
      </Paper>
    </Box>
  );
};

export default EmptyState; 