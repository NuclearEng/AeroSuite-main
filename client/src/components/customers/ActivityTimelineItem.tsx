import React from 'react';
import {
  Typography,
  Avatar,
  Chip,
  Tooltip,
  Box,
  Link } from
'@mui/material';
import {
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent } from
'@mui/lab';
import {
  CalendarToday as CalendarIcon,
  Person as PersonIcon,
  Assignment as AssignmentIcon,
  Business as BusinessIcon,
  Description as DocumentIcon,
  Notes as NotesIcon,
  Inventory as InventoryIcon,
  FactCheck as InspectionIcon,
  Message as MessageIcon,
  Verified as VerifiedIcon,
  Error as ErrorIcon,
  FolderSpecial as FolderIcon,
  Edit as EditIcon,
  Add as AddIcon,
  Delete as DeleteIcon } from
'@mui/icons-material';
import { formatDistanceToNow, format } from 'date-fns';
import { CustomerActivity } from '../../hooks/useCustomerActivities';

// Helper function to get activity icon based on type
export const GetActivityIcon = (activityType: string) => {
  switch (activityType) {
    case 'inspection_scheduled':
      return <CalendarIcon />;
    case 'inspection_completed':
      return <InspectionIcon />;
    case 'document_added':
    case 'document_updated':
      return <DocumentIcon />;
    case 'communication':
      return <MessageIcon />;
    case 'status_change':
      return <VerifiedIcon />;
    case 'supplier_added':
      return <AddIcon />;
    case 'supplier_removed':
      return <DeleteIcon />;
    case 'note_added':
      return <NotesIcon />;
    case 'contract_updated':
      return <EditIcon />;
    case 'user_assigned':
      return <PersonIcon />;
    default:
      return <AssignmentIcon />;
  }
};

// Helper function to get activity color based on type
export const getActivityColor = (activityType: string): string => {
  switch (activityType) {
    case 'inspection_scheduled':
      return 'info';
    case 'inspection_completed':
      return 'success';
    case 'document_added':
    case 'document_updated':
      return 'secondary';
    case 'communication':
      return 'info';
    case 'status_change':
      return 'warning';
    case 'supplier_added':
      return 'success';
    case 'supplier_removed':
      return 'error';
    case 'note_added':
      return 'default';
    case 'contract_updated':
      return 'warning';
    case 'user_assigned':
      return 'info';
    default:
      return 'default';
  }
};

// Format the activity timestamp for display
export const formatActivityTime = (timestamp: string) => {
  const date = new Date(timestamp);
  const relativeTime = formatDistanceToNow(date, { addSuffix: true });
  return {
    relative: relativeTime,
    formatted: format(date, 'MMM d, yyyy h:mm a')
  };
};

interface ActivityTimelineItemProps {
  activity: CustomerActivity;
  isLast: boolean;
  onNavigate?: (url: string) => void;
}

const ActivityTimelineItem: React.FC<ActivityTimelineItemProps> = ({
  activity,
  isLast,
  onNavigate
}) => {
  const time = formatActivityTime(activity.createdAt);
  const activityColor = getActivityColor(activity.activityType);

  const handleLinkClick = (url: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    if (onNavigate) {
      onNavigate(url);
    }
  };

  return (
    <TimelineItem>
      <TimelineOppositeContent
        sx={{ flex: 0.2, minWidth: 120 }}
        color="text.secondary">

        <Tooltip title={time.formatted}>
          <Typography variant="body2">{time.relative}</Typography>
        </Tooltip>
      </TimelineOppositeContent>
      
      <TimelineSeparator>
        <TimelineDot color={activityColor as any}>
          {GetActivityIcon(activity.activityType)}
        </TimelineDot>
        {!isLast && <TimelineConnector />}
      </TimelineSeparator>
      
      <TimelineContent sx={{ py: '12px', px: 2 }}>
        <Typography variant="subtitle2" component="span">
          {activity.title}
        </Typography>
        
        {activity.description &&
        <Typography variant="body2" color="text.secondary">
            {activity.description}
          </Typography>
        }
        
        <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {activity.performedBy &&
          <Chip
            size="small"
            icon={<PersonIcon />}
            label={`${activity.performedBy.firstName} ${activity.performedBy.lastName}`}
            variant="outlined" />

          }
          
          {activity.relatedEntities?.inspection &&
          <Chip
            size="small"
            label={activity.relatedEntities.inspection.title}
            variant="outlined"
            color="primary" />}
          {activity.relatedEntities?.supplier &&
          <Chip
            size="small"
            label={activity.relatedEntities.supplier.name}
            variant="outlined"
            color="secondary" />}
        </Box>
      </TimelineContent>
    </TimelineItem>);

};

export default ActivityTimelineItem;