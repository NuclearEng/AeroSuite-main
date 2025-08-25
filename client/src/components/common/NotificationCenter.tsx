import React, { useState, useEffect } from 'react';
import { Badge, IconButton, Menu, MenuItem } from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import io from 'socket.io-client';

const NotificationCenter: React.FC = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notifications, setNotifications] = useState([
    { id: 1, message: 'New supplier added' },
    { id: 2, message: 'Inspection due soon' },
  ]);

  useEffect(() => {
    const socket = io();
    socket.on('notification', (data) => {
      setNotifications((prev) => [...prev, data]);
    });
    return () => {
      socket.disconnect();
    };
  }, []);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <>
      <Badge badgeContent={notifications.length} color="secondary">
        <IconButton onClick={handleClick}>
          <NotificationsIcon />
        </IconButton>
      </Badge>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
      >
        {notifications.map((notif) => (
          <MenuItem key={notif.id}>{notif.message}</MenuItem>
        ))}
      </Menu>
    </>
  );
};

export default NotificationCenter;
