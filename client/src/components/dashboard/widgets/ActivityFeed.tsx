import React from 'react';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemText from '@mui/material/ListItemText';
import Avatar from '@mui/material/Avatar';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

export interface ActivityEvent {
  id: string;
  user: string;
  userAvatarUrl?: string;
  action: string;
  target?: string;
  timestamp: string;
  iconUrl?: string;
}

export interface ActivityFeedProps {
  events: ActivityEvent[];
  title?: string;
}

const ActivityFeed: React.FC<ActivityFeedProps> = ({ events, title = 'Activity Feed' }) => {
  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2 }}>{title}</Typography>
      <List>
        {events.map(event => (
          <ListItem key={event.id} alignItems="flex-start" sx={{ mb: 1 }}>
            <ListItemAvatar>
              <Avatar src={event.userAvatarUrl || event.iconUrl} alt={event.user} />
            </ListItemAvatar>
            <ListItemText
              primary={<><b>{event.user}</b> {event.action} {event.target && <b>{event.target}</b>}</>}
              secondary={<Typography variant="caption" color="text.secondary">{event.timestamp}</Typography>}
            />
          </ListItem>
        ))}
      </List>
    </Box>
  );
};

export default ActivityFeed; 