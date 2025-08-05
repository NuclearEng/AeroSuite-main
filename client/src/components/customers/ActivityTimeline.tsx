import React from 'react';
import {
  Box,
  IconButton,
  Tooltip
} from '@mui/material';
import { Timeline } from '@mui/lab';
import { Refresh as RefreshIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { CustomerActivity } from '../../hooks/useCustomerActivities';
import ActivityTimelineItem from './ActivityTimelineItem';
import LoadingState from '../common/LoadingState';
import ErrorState from '../common/ErrorState';
import EmptyState from '../common/EmptyState';

interface ActivityTimelineProps {
  activities: CustomerActivity[];
  loading: boolean;
  error: string | null;
  onRefresh?: () => void;
  emptyMessage?: string;
}

const ActivityTimeline: React.FC<ActivityTimelineProps> = ({
  activities,
  loading,
  error,
  onRefresh,
  emptyMessage = 'No activities found for this customer'
}) => {
  const navigate = useNavigate();

  if (loading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={onRefresh} />;
  }

  if (!activities || activities.length === 0) {
    return <EmptyState message={emptyMessage} />;
  }

  const handleNavigate = (url: string) => {
    navigate(url);
  };

  return (
    <Box sx={{ position: 'relative' }}>
      {onRefresh && (
        <Box sx={{ position: 'absolute', top: 0, right: 0 }}>
          <Tooltip title="Refresh">
            <IconButton onClick={onRefresh} size="small">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      )}
      
      <Timeline position="right">
        {activities.map((activity, index) => (
          <ActivityTimelineItem 
            key={activity._id} 
            activity={activity}
            isLast={index === activities.length - 1}
            onNavigate={handleNavigate}
          />
        ))}
      </Timeline>
    </Box>
  );
};

export default ActivityTimeline; 