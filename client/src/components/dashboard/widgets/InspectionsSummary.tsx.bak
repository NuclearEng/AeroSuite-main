import React from 'react';
import { Box, Typography, CircularProgress, Divider } from '@mui/material';
import { 
  Assignment as InspectionIcon, 
  CheckCircle as CompletedIcon,
  Schedule as ScheduledIcon,
  Warning as PendingIcon 
} from '@mui/icons-material';

const InspectionsSummary: React.FC = () => {
  // Mock data - in a real app this would come from an API
  const inspectionData = {
    total: 156,
    completed: 87,
    scheduled: 42,
    pending: 27,
    completionRate: 56,
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <InspectionIcon color="primary" sx={{ mr: 1 }} />
          <Typography variant="h6">
            {inspectionData.total} Total Inspections
          </Typography>
        </Box>
        <Box sx={{ position: 'relative', display: 'inline-flex' }}>
          <CircularProgress
            variant="determinate"
            value={inspectionData.completionRate}
            size={40}
            thickness={4}
            sx={{ color: theme => theme.palette.success.main }}
          />
          <Box
            sx={{
              top: 0,
              left: 0,
              bottom: 0,
              right: 0,
              position: 'absolute',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography
              variant="caption"
              component="div"
              color="text.secondary"
              sx={{ fontWeight: 'bold' }}
            >
              {`${Math.round(inspectionData.completionRate)}%`}
            </Typography>
          </Box>
        </Box>
      </Box>
      
      <Divider sx={{ mb: 2 }} />
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <CompletedIcon color="success" sx={{ mr: 1, fontSize: 20 }} />
          <Typography variant="body2">Completed</Typography>
        </Box>
        <Typography variant="body1" fontWeight="bold">
          {inspectionData.completed}
        </Typography>
      </Box>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <ScheduledIcon color="info" sx={{ mr: 1, fontSize: 20 }} />
          <Typography variant="body2">Scheduled</Typography>
        </Box>
        <Typography variant="body1" fontWeight="bold">
          {inspectionData.scheduled}
        </Typography>
      </Box>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <PendingIcon color="warning" sx={{ mr: 1, fontSize: 20 }} />
          <Typography variant="body2">Pending</Typography>
        </Box>
        <Typography variant="body1" fontWeight="bold">
          {inspectionData.pending}
        </Typography>
      </Box>
    </Box>
  );
};

export default InspectionsSummary; 