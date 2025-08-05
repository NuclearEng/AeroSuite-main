import React from 'react';
import {
  Box,
  CardHeader,
  IconButton,
  Typography
} from '@mui/material';
import {
  History as HistoryIcon,
  FilterList as FilterListIcon
} from '@mui/icons-material';

interface ActivityHistoryHeaderProps {
  showFilters: boolean;
  toggleFilters: () => void;
}

const ActivityHistoryHeader: React.FC<ActivityHistoryHeaderProps> = ({
  showFilters,
  toggleFilters
}) => {
  return (
    <CardHeader
      title={
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <HistoryIcon sx={{ mr: 1 }} />
          <Typography variant="h6">Activity History</Typography>
        </Box>
      }
      action={
        <IconButton onClick={toggleFilters} color={showFilters ? 'primary' : 'default'}>
          <FilterListIcon />
        </IconButton>
      }
    />
  );
};

export default ActivityHistoryHeader; 