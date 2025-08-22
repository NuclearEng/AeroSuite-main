import React from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Avatar from '@mui/material/Avatar';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Box from '@mui/material/Box';

export interface InspectionCardProps {
  title: string;
  date: string;
  status: 'Pending' | 'In Progress' | 'Complete' | 'Blocked';
  assignee?: string;
  assigneeAvatarUrl?: string;
  location?: string;
  notes?: string;
}

const statusColor = {
  Pending: 'default',
  'In Progress': 'primary',
  Complete: 'success',
  Blocked: 'error',
} as const;

const InspectionCard: React.FC<InspectionCardProps> = ({ title, date, status, assignee, assigneeAvatarUrl, location, notes }) => {
  return (
    <Card sx={{ maxWidth: 400, m: 1 }} aria-label={`Inspection card for ${title}`}>
      <CardHeader
        avatar={assignee ? <Avatar alt={assignee} src={assigneeAvatarUrl} /> : undefined}
        title={title}
        subheader={date}
        action={<Chip label={status} color={statusColor[status]} size="small" />}
      />
      <CardContent>
        {location && (
          <Typography variant="body2" color="text.secondary">Location: {location}</Typography>
        )}
        {notes && (
          <Box mt={1}>
            <Typography variant="body2" color="text.secondary">Notes: {notes}</Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default InspectionCard; 