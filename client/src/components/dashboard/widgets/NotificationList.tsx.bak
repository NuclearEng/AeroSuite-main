import React from 'react';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemText from '@mui/material/ListItemText';
import Avatar from '@mui/material/Avatar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import CheckIcon from '@mui/icons-material/Check';
import DeleteIcon from '@mui/icons-material/Delete';
import Box from '@mui/material/Box';

export interface NotificationItem {
  id: string;
  title: string;
  description?: string;
  iconUrl?: string;
  timestamp: string;
  read?: boolean;
}

export interface NotificationListProps {
  notifications: NotificationItem[];
  onMarkRead?: (id: string) => void;
  onDelete?: (id: string) => void;
  title?: string;
}

const NotificationList: React.FC<NotificationListProps> = ({ notifications, onMarkRead, onDelete, title = 'Notifications' }) => {
  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2 }}>{title}</Typography>
      <List>
        {notifications.map(item => (
          <ListItem key={item.id} alignItems="flex-start" sx={{ mb: 1 }}
            secondaryAction={
              <>
                {onMarkRead && !item.read && (
                  <IconButton edge="end" aria-label="mark as read" onClick={() => onMarkRead(item.id)}>
                    <CheckIcon />
                  </IconButton>
                )}
                {onDelete && (
                  <IconButton edge="end" aria-label="delete" onClick={() => onDelete(item.id)}>
                    <DeleteIcon />
                  </IconButton>
                )}
              </>
            }
          >
            <ListItemAvatar>
              <Avatar src={item.iconUrl} alt={item.title} />
            </ListItemAvatar>
            <ListItemText
              primary={item.title}
              secondary={
                <>
                  {item.description && <Typography variant="body2" color="text.secondary">{item.description}</Typography>}
                  <Typography variant="caption" color="text.secondary">{item.timestamp}</Typography>
                </>
              }
            />
          </ListItem>
        ))}
      </List>
    </Box>
  );
};

export default NotificationList; 