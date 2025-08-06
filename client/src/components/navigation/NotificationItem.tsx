import React from 'react';
import { Box, Typography, ListItemButton, alpha, useTheme } from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

// Define notification type
export interface Notification {
  id: number;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: 'info' | 'warning' | 'success' | 'error';
}

interface NotificationItemProps {
  notification: Notification;
  onClick?: (id: number) => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onClick }) => {
  const theme = useTheme();

  // Determine icon and color based on notification type
  const GetIcon = () => {
    switch (notification.type) {
      case 'warning':
        return <WarningIcon sx={{ color: theme.palette.warning.main }} />;
      case 'success':
        return <CheckCircleIcon sx={{ color: theme.palette.success.main }} />;
      case 'error':
        return <WarningIcon sx={{ color: theme.palette.error.main }} />;
      case 'info':
      default:
        return <InfoIcon sx={{ color: theme.palette.info.main }} />;
    }
  };

  // Determine background color based on notification type
  const getBackgroundColor = () => {
    if (notification.read) {
      return 'transparent';
    }

    switch (notification.type) {
      case 'warning':
        return alpha(theme.palette.warning.main, 0.1);
      case 'success':
        return alpha(theme.palette.success.main, 0.1);
      case 'error':
        return alpha(theme.palette.error.main, 0.1);
      case 'info':
      default:
        return alpha(theme.palette.info.main, 0.1);
    }
  };

  const handleClick = () => {
    if (onClick) {
      onClick(notification.id);
    }
  };

  return (
    <ListItemButton
      onClick={handleClick}
      sx={{
        py: 1.5,
        px: 2.5,
        borderLeft: notification.read ? 'none' : `3px solid ${theme.palette[notification.type].main}`,
        backgroundColor: getBackgroundColor(),
        transition: 'background-color 0.2s ease',
        '&:hover': {
          backgroundColor: alpha(theme.palette[notification.type].main, 0.05)
        }
      }}>

      <Box sx={{ display: 'flex', alignItems: 'flex-start', width: '100%' }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mr: 2,
            mt: 0.5,
            width: 36,
            height: 36,
            borderRadius: '12px',
            backgroundColor: alpha(theme.palette[notification.type].main, 0.12)
          }}>

          {GetIcon()}
        </Box>
        
        <Box sx={{ flex: 1, pr: 1 }}>
          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: notification.read ? 500 : 600,
              color: notification.read ? theme.palette.text.secondary : theme.palette.text.primary
            }}>

            {notification.title}
          </Typography>
          
          <Typography
            variant="body2"
            sx={{
              color: theme.palette.text.secondary,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              mt: 0.5
            }}>

            {notification.message}
          </Typography>
          
          <Typography
            variant="caption"
            sx={{
              color: theme.palette.text.disabled,
              mt: 0.5,
              display: 'block'
            }}>

            {notification.time}
          </Typography>
        </Box>
      </Box>
    </ListItemButton>);

};

export default NotificationItem;