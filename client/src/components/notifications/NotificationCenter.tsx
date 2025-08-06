import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Badge,
  IconButton,
  Menu,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Typography,
  Divider,
  Box,
  Button,
  CircularProgress,
  Tooltip,
  Tabs,
  Tab,
  Chip,
  FormControl,
  FormControlLabel,
  Switch,
  Popover,
  TextField,
  InputAdornment } from
'@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import InfoIcon from '@mui/icons-material/Info';
import ScheduleIcon from '@mui/icons-material/Schedule';
import MarkEmailReadIcon from '@mui/icons-material/MarkEmailRead';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import FilterListIcon from '@mui/icons-material/FilterList';
import SettingsIcon from '@mui/icons-material/Settings';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';

import { RootState } from '../../redux/store';
import {
  fetchNotifications,
  markAsRead,
  markAllAsRead,
  addNotification,
  setUnreadCount,
  Notification } from
'../../redux/slices/notifications.slice';
import { WS_EVENTS, WebSocketStatus } from '../../services/websocketService';
import { useWebSocket } from '../../hooks/useWebSocket';
import persistenceService from '../../services/persistenceService';

/**
 * Notification Center Component
 * 
 * Displays notifications and alerts to the user with real-time updates,
 * filtering, and grouping capabilities.
 */
const NotificationCenter: React.FC = () => {
  // Redux
  const dispatch = useDispatch();
  const { items, unreadCount, loading, error } = useSelector(
    (state: RootState) => state.notifications
  );

  // Local state
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(null);
  const [settingsAnchorEl, setSettingsAnchorEl] = useState<null | HTMLElement>(null);
  const [activeTab, setActiveTab] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filters, setFilters] = useState({
    showInfo: true,
    showSuccess: true,
    showWarning: true,
    showError: true,
    showRead: true,
    showUnread: true
  });
  const [preferences, setPreferences] = useState({
    enableRealTimeNotifications: true,
    notificationSound: true,
    desktopNotifications: false,
    groupSimilarNotifications: true
  });

  // WebSocket connection
  const { subscribe, unsubscribe, status: wsStatus } = useWebSocket();

  // Load notifications when component mounts
  useEffect(() => {
    dispatch(fetchNotifications());

    // Load preferences from local storage
    const savedPreferences = persistenceService.getItem('notificationPreferences');
    if (savedPreferences) {
      try {
        setPreferences(JSON.parse(savedPreferences));
      } catch (_err) {
        console.error("Error:", _error);
      }
    }
  }, [dispatch]);

  // Subscribe to real-time notifications via WebSocket
  useEffect(() => {
    if (preferences.enableRealTimeNotifications) {
      const handleNotification = (data: any) => {
        // Add the notification to the Redux store
        dispatch(addNotification(data));

        // Show browser notification if enabled
        if (preferences.desktopNotifications) {
          showBrowserNotification(data);
        }

        // Play notification sound if enabled
        if (preferences.notificationSound) {
          playNotificationSound();
        }
      };

      // Subscribe to notification events
      const unsubscribeFunc = subscribe(WS_EVENTS.NOTIFICATION, handleNotification);

      return () => {
        unsubscribeFunc();
      };
    }
  }, [dispatch, preferences, subscribe]);

  // Show browser notification
  const showBrowserNotification = useCallback((notification: Notification) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/logo192.png'
      });
    } else if ('Notification' in window && Notification.permission !== 'denied') {
      Notification.requestPermission().then((permission) => {
        if (permission === 'granted') {
          new Notification(notification.title, {
            body: notification.message,
            icon: '/logo192.png'
          });
        }
      });
    }
  }, []);

  // Play notification sound
  const playNotificationSound = useCallback(() => {
    const audio = new Audio('/notification-sound.mp3');
    audio.play().catch((err) => console.error("Error:", _err)));
  }, []);

  // Save preferences to local storage
  const savePreferences = useCallback((newPreferences: typeof preferences) => {
    setPreferences(newPreferences);
    persistenceService.setItem('notificationPreferences', JSON.stringify(newPreferences));
  }, []);

  // Handle opening the notification menu
  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
    dispatch(fetchNotifications()); // Refresh notifications when opening menu
  };

  // Handle closing the notification menu
  const handleClose = () => {
    setAnchorEl(null);
  };

  // Handle opening the filter menu
  const handleFilterClick = (event: React.MouseEvent<HTMLElement>) => {
    setFilterAnchorEl(event.currentTarget);
  };

  // Handle closing the filter menu
  const handleFilterClose = () => {
    setFilterAnchorEl(null);
  };

  // Handle opening the settings menu
  const handleSettingsClick = (event: React.MouseEvent<HTMLElement>) => {
    setSettingsAnchorEl(event.currentTarget);
  };

  // Handle closing the settings menu
  const handleSettingsClose = () => {
    setSettingsAnchorEl(null);
  };

  // Handle notification click
  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      dispatch(markAsRead(notification._id));
    }

    // Navigate to link if provided
    if (notification.link) {
      window.location.href = notification.link;
    }

    handleClose();
  };

  // Handle tab change
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  // Handle marking all as read
  const handleMarkAllAsRead = () => {
    dispatch(markAllAsRead());
  };

  // Handle filter change
  const handleFilterChange = (filterName: keyof typeof filters) => {
    setFilters({
      ...filters,
      [filterName]: !filters[filterName]
    });
  };

  // Handle preference change
  const handlePreferenceChange = (preferenceName: keyof typeof preferences) => {
    const newPreferences = {
      ...preferences,
      [preferenceName]: !preferences[preferenceName]
    };
    savePreferences(newPreferences);
  };

  // Handle search query change
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  // Clear search query
  const handleClearSearch = () => {
    setSearchQuery('');
  };

  // Get icon based on notification type
  const GetNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircleIcon color="success" />;
      case 'error':
        return <ErrorIcon color="error" />;
      case 'warning':
        return <ScheduleIcon color="warning" />;
      default:
        return <InfoIcon color="info" />;
    }
  };

  // Format timestamp to relative time
  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.round(diffMs / 1000);
    const diffMin = Math.round(diffSec / 60);
    const diffHour = Math.round(diffMin / 60);
    const diffDay = Math.round(diffHour / 24);

    if (diffSec < 60) {
      return `${diffSec} seconds ago`;
    } else if (diffMin < 60) {
      return `${diffMin} ${diffMin === 1 ? 'minute' : 'minutes'} ago`;
    } else if (diffHour < 24) {
      return `${diffHour} ${diffHour === 1 ? 'hour' : 'hours'} ago`;
    } else {
      return `${diffDay} ${diffDay === 1 ? 'day' : 'days'} ago`;
    }
  };

  // Group notifications by date
  const groupNotificationsByDate = (notifications: Notification[]) => {
    const groups: {[key: string]: Notification[];} = {};

    notifications.forEach((notification) => {
      const date = new Date(notification.createdAt);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      let groupKey = '';

      if (date.toDateString() === today.toDateString()) {
        groupKey = 'Today';
      } else if (date.toDateString() === yesterday.toDateString()) {
        groupKey = 'Yesterday';
      } else {
        groupKey = date.toLocaleDateString();
      }

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }

      groups[groupKey].push(notification);
    });

    return groups;
  };

  // Filter notifications based on active tab, search query, and filters
  const filteredNotifications = useMemo(() => {
    let filtered = [...items];

    // Filter by tab
    if (activeTab === 1) {
      filtered = filtered.filter((notification) => !notification.read);
    } else if (activeTab === 2) {
      filtered = filtered.filter((notification) => notification.read);
    }

    // Filter by type
    filtered = filtered.filter((notification) => {
      if (notification.type === 'info' && !filters.showInfo) return false;
      if (notification.type === 'success' && !filters.showSuccess) return false;
      if (notification.type === 'warning' && !filters.showWarning) return false;
      if (notification.type === 'error' && !filters.showError) return false;
      if (notification.read && !filters.showRead) return false;
      if (!notification.read && !filters.showUnread) return false;
      return true;
    });

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (notification) =>
        notification.title.toLowerCase().includes(query) ||
        notification.message.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [items, activeTab, filters, searchQuery]);

  // Group notifications if preference is enabled
  const groupedNotifications = useMemo(() => {
    if (preferences.groupSimilarNotifications) {
      return groupNotificationsByDate(filteredNotifications);
    }
    return { 'All': filteredNotifications };
  }, [filteredNotifications, preferences.groupSimilarNotifications]);

  // WebSocket connection status indicator
  const connectionStatus = useMemo(() => {
    if (wsStatus === WebSocketStatus.OPEN) {
      return <Chip size="small" label="Connected" color="success" sx={{ ml: 1 }} />;
    } else if (wsStatus === WebSocketStatus.CONNECTING || wsStatus === WebSocketStatus.RECONNECTING) {
      return <Chip size="small" label="Connecting..." color="warning" sx={{ ml: 1 }} />;
    } else {
      return <Chip size="small" label="Offline" color="error" sx={{ ml: 1 }} />;
    }
  }, [wsStatus]);

  return (
    <>
      <IconButton
        color="inherit"
        aria-label="notifications"
        onClick={handleClick}>

        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>
      
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{
          style: {
            width: '400px',
            maxHeight: '500px'
          }
        }}>

        <Box sx={{ px: 2, py: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Notifications</Typography>
          <Box display="flex" alignItems="center">
            {preferences.enableRealTimeNotifications && connectionStatus}
            <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
              {unreadCount} unread
            </Typography>
          </Box>
        </Box>
        
        <Box sx={{ px: 2, pb: 1, display: 'flex', justifyContent: 'space-between' }}>
          <Box>
            <Tooltip title="Filter notifications">
              <IconButton size="small" onClick={handleFilterClick}>
                <FilterListIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Notification settings">
              <IconButton size="small" onClick={handleSettingsClick}>
                <SettingsIcon />
              </IconButton>
            </Tooltip>
          </Box>
          
          {unreadCount > 0 &&
          <Tooltip title="Mark all as read">
              <Button
              startIcon={<MarkEmailReadIcon />}
              size="small"
              onClick={handleMarkAllAsRead}>

                Mark all read
              </Button>
            </Tooltip>
          }
        </Box>
        
        <Box sx={{ px: 2, pb: 1 }}>
          <TextField
            size="small"
            placeholder="Search notifications"
            fullWidth
            value={searchQuery}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment:
              <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>,

              endAdornment: searchQuery ?
              <InputAdornment position="end">
                  <IconButton
                  size="small"
                  aria-label="clear search"
                  onClick={handleClearSearch}>

                    <ClearIcon fontSize="small" />
                  </IconButton>
                </InputAdornment> :
              null
            }} />

        </Box>
        
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="fullWidth"
          indicatorColor="primary"
          textColor="primary"
          aria-label="notification tabs">

          <Tab label="All" />
          <Tab label="Unread" />
          <Tab label="Read" />
        </Tabs>
        
        <Divider />
        
        {loading &&
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
            <CircularProgress size={24} />
          </Box>
        }
        
        {error &&
        <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography color="error">{error}</Typography>
            <Button
            size="small"
            sx={{ mt: 1 }}
            onClick={() => dispatch(fetchNotifications())}>

              Retry
            </Button>
          </Box>
        }
        
        {!loading && !error && filteredNotifications.length === 0 &&
        <MenuItem>
            <Typography variant="body2" sx={{ py: 1 }}>No notifications</Typography>
          </MenuItem>
        }
        
        {!loading && !error && filteredNotifications.length > 0 &&
        <List sx={{ width: '100%', p: 0 }}>
            {Object.entries(groupedNotifications).map(([date, notifications]) =>
          <React.Fragment key={date}>
                {preferences.groupSimilarNotifications &&
            <ListItem sx={{ bgcolor: 'background.default', py: 0.5 }}>
                    <Typography variant="caption" color="text.secondary" fontWeight="bold">
                      {date}
                    </Typography>
                  </ListItem>
            }
                
                {notifications.map((notification) =>
            <React.Fragment key={notification._id}>
                    <ListItem
                alignItems="flex-start"
                onClick={() => handleNotificationClick(notification)}
                button
                sx={{
                  backgroundColor: notification.read ? 'inherit' : 'rgba(0, 0, 0, 0.04)'
                }}>

                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'transparent' }}>
                          {GetNotificationIcon(notification.type)}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                  primary={
                  <Typography component="div" variant="subtitle2" color="text.primary">
                            {notification.title}
                          </Typography>
                  }
                  secondary={
                  <>
                            <Typography component="span" variant="body2" color="text.primary">
                              {notification.message}
                            </Typography>
                            <Typography component="div" variant="caption" color="text.secondary">
                              {formatTime(notification.createdAt)}
                            </Typography>
                          </>
                  } />

                    </ListItem>
                    <Divider variant="inset" component="li" />
                  </React.Fragment>
            )}
              </React.Fragment>
          )}
          </List>
        }
      </Menu>
      
      
      <Popover
        open={Boolean(filterAnchorEl)}
        anchorEl={filterAnchorEl}
        onClose={handleFilterClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left'
        }}>

        <Box sx={{ p: 2, width: 250 }}>
          <Typography variant="subtitle2" gutterBottom>Filter by Type</Typography>
          <FormControlLabel
            control={
            <Switch
              checked={filters.showInfo}
              onChange={() => handleFilterChange('showInfo')}
              size="small" />

            }
            label="Information" />

          <FormControlLabel
            control={
            <Switch
              checked={filters.showSuccess}
              onChange={() => handleFilterChange('showSuccess')}
              size="small" />

            }
            label="Success" />

          <FormControlLabel
            control={
            <Switch
              checked={filters.showWarning}
              onChange={() => handleFilterChange('showWarning')}
              size="small" />

            }
            label="Warning" />

          <FormControlLabel
            control={
            <Switch
              checked={filters.showError}
              onChange={() => handleFilterChange('showError')}
              size="small" />

            }
            label="Error" />

          
          <Divider sx={{ my: 1 }} />
          
          <Typography variant="subtitle2" gutterBottom>Filter by Status</Typography>
          <FormControlLabel
            control={
            <Switch
              checked={filters.showRead}
              onChange={() => handleFilterChange('showRead')}
              size="small" />

            }
            label="Read" />

          <FormControlLabel
            control={
            <Switch
              checked={filters.showUnread}
              onChange={() => handleFilterChange('showUnread')}
              size="small" />

            }
            label="Unread" />

        </Box>
      </Popover>
      
      
      <Popover
        open={Boolean(settingsAnchorEl)}
        anchorEl={settingsAnchorEl}
        onClose={handleSettingsClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right'
        }}>

        <Box sx={{ p: 2, width: 280 }}>
          <Typography variant="subtitle2" gutterBottom>Notification Settings</Typography>
          <FormControlLabel
            control={
            <Switch
              checked={preferences.enableRealTimeNotifications}
              onChange={() => handlePreferenceChange('enableRealTimeNotifications')}
              size="small" />

            }
            label="Real-time notifications" />

          <FormControlLabel
            control={
            <Switch
              checked={preferences.notificationSound}
              onChange={() => handlePreferenceChange('notificationSound')}
              size="small" />

            }
            label="Play sound for new notifications" />

          <FormControlLabel
            control={
            <Switch
              checked={preferences.desktopNotifications}
              onChange={() => handlePreferenceChange('desktopNotifications')}
              size="small" />

            }
            label="Desktop notifications" />

          <FormControlLabel
            control={
            <Switch
              checked={preferences.groupSimilarNotifications}
              onChange={() => handlePreferenceChange('groupSimilarNotifications')}
              size="small" />

            }
            label="Group notifications by date" />

        </Box>
      </Popover>
    </>);

};

export default NotificationCenter;