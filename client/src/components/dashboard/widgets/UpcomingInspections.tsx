import React from 'react';
import { 
  Box, 
  Typography, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemAvatar, 
  Avatar, 
  Chip, 
  Divider 
} from '@mui/material';
import { 
  Schedule as ScheduleIcon,
  Business as BusinessIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { format } from 'date-fns';

const UpcomingInspections: React.FC = () => {
  // Mock data - in a real app this would come from an API
  const upcomingInspections = [
    {
      id: 'INS-1001',
      title: 'Component Quality Inspection',
      supplier: 'Aerospace Systems Inc.',
      date: new Date(Date.now() + 86400000), // Tomorrow
      inspector: 'John Smith',
      status: 'scheduled'
    },
    {
      id: 'INS-1002',
      title: 'Annual Quality Audit',
      supplier: 'Precision Machining Ltd.',
      date: new Date(Date.now() + 172800000), // Day after tomorrow
      inspector: 'Jane Doe',
      status: 'scheduled'
    },
    {
      id: 'INS-1003',
      title: 'Raw Material Quality Check',
      supplier: 'MetalWorks Co.',
      date: new Date(Date.now() + 259200000), // 3 days from now
      inspector: 'David Johnson',
      status: 'draft'
    },
    {
      id: 'INS-1004',
      title: 'Dimensional Verification',
      supplier: 'Precision Components Inc.',
      date: new Date(Date.now() + 345600000), // 4 days from now
      inspector: 'Sarah Williams',
      status: 'scheduled'
    },
    {
      id: 'INS-1005',
      title: 'Process Compliance Review',
      supplier: 'Advanced Manufacturing Solutions',
      date: new Date(Date.now() + 432000000), // 5 days from now
      inspector: 'Michael Brown',
      status: 'draft'
    }
  ];

  // Status color mapping
  const getStatusColor = (status: string) => {
    switch(status) {
      case 'scheduled':
        return 'primary';
      case 'draft':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <Box>
      <List sx={{ width: '100%', p: 0 }}>
        {upcomingInspections.map((inspection, index: any) => (
          <React.Fragment key={inspection.id}>
            <ListItem 
              alignItems="flex-start"
              sx={{ 
                py: 2,
                cursor: 'pointer',
                '&:hover': { bgcolor: 'action.hover' }
              }}
            >
              <ListItemAvatar>
                <Avatar sx={{ bgcolor: theme => theme.palette.primary.light }}>
                  <ScheduleIcon />
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="subtitle1" fontWeight="medium">
                      {inspection.title}
                    </Typography>
                    <Chip 
                      label={inspection.status} 
                      size="small"
                      color={getStatusColor(inspection.status) as any}
                      sx={{ textTransform: 'capitalize' }}
                    />
                  </Box>
                }
                secondary={
                  <Box sx={{ mt: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                      <BusinessIcon sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        {inspection.supplier}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                      <ScheduleIcon sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        {format(inspection.date, 'MMM d, yyyy')}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <PersonIcon sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        {inspection.inspector}
                      </Typography>
                    </Box>
                  </Box>
                }
              />
            </ListItem>
            {index < upcomingInspections.length - 1 && <Divider component="li" />}
          </React.Fragment>
        ))}
      </List>
    </Box>
  );
};

export default UpcomingInspections; 