import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Typography,
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  ListItemSecondaryAction,
  Tabs,
  Tab,
  Badge,
  Divider,
  Chip,
  CircularProgress,
  useTheme,
  useMediaQuery,
  alpha
} from '@mui/material';
import {
  Close as CloseIcon,
  Notifications as NotificationsIcon,
  Delete as DeleteIcon,
  DoneAll as DoneAllIcon,
  Settings as SettingsIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';

// Interface for notification objects
export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string | Date;
  read: boolean;
  type: 'info' | 'warning' | 'success' | 'error';
  link?: string;
  category?: string;
  metadata?: Record<string, any>;
}

interface NotificationModalProps {
  open: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  loading?: boolean;
  onMarkAllRead?: () => void;
  onDeleteAll?: () => void;
  onNotificationClick?: (notification: NotificationItem) => void;
  onNotificationDelete?: (id: string) => void;
  onNotificationRead?: (id: string) => void;
  onFilterChange?: (filters: string[]) => void;
}

const NotificationModal: React.FC<NotificationModalProps> = ({
  open,
  onClose,
  notifications,
  loading = false,
  onMarkAllRead,
  onDeleteAll,
  onNotificationClick,
  onNotificationDelete,
  onNotificationRead,
  onFilterChange
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [activeTab, setActiveTab] = useState(0);
  const [filters, setFilters] = useState<any>([]);

  // Count unread notifications
  const unreadCount = notifications.filter(notification => !notification.read).length;

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  // Handle notification click
  const handleNotificationClick = (notification: NotificationItem) => {
    if (!notification.read && onNotificationRead) {
      onNotificationRead(notification.id);
    }
    
    if (onNotificationClick) {
      onNotificationClick(notification);
    }
  };

  // Handle notification delete
  const handleDelete = (event: React.MouseEvent, id: string) => {
    event.stopPropagation();
    if (onNotificationDelete) {
      onNotificationDelete(id);
    }
  };

  // Filter notifications based on active tab
  const filteredNotifications = notifications.filter(notification => {
    if (activeTab === 0) return true; // All
    if (activeTab === 1) return !notification.read; // Unread
    if (activeTab === 2) return filters.includes(notification.category || 'uncategorized'); // Filtered
    return true;
  });

  // Handle filter change
  const handleFilterChange = (category: string) => {
    const newFilters = filters.includes(category)
      ? filters.filter((f: any) => f !== category)
      : [...filters, category];
    
    setFilters(newFilters);
    
    if (onFilterChange) {
      onFilterChange(newFilters);
    }
  };

  // Get unique categories for filtering
  const categories = Array.from(
    new Set(notifications.map(n => n.category || 'uncategorized'))
  );

  // Format timestamp to relative time
  const formatTimestamp = (timestamp: string | Date): string => {
    const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) return 'just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHour < 24) return `${diffHour}h ago`;
    if (diffDay < 7) return `${diffDay}d ago`;
    
    return date.toLocaleDateString();
  };

  // Get color for notification type
  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      info: theme.palette.info.main,
      warning: theme.palette.warning.main,
      success: theme.palette.success.main,
      error: theme.palette.error.main
    };
    return colors[type] || theme.palette.info.main;
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      fullScreen={isMobile}
      aria-labelledby="notification-modal-title"
    >
      <DialogTitle id="notification-modal-title">
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center">
            <NotificationsIcon sx={{ mr: 1 }} />
            <Typography variant="h6" component="span">
              Notifications
              {unreadCount > 0 && (
                <Badge
                  badgeContent={unreadCount}
                  color="error"
                  sx={{ ml: 1 }}
                />
              )}
            </Typography>
          </Box>
          <IconButton
            edge="end"
            color="inherit"
            onClick={onClose}
            aria-label="close"
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <Box sx={{ px: 2 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          aria-label="notification tabs"
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab 
            label="All" 
            id="notifications-tab-0"
            aria-controls="notifications-tabpanel-0"
          />
          <Tab 
            label={
              <Badge 
                badgeContent={unreadCount} 
                color="error"
                max={99}
                invisible={unreadCount === 0}
              >
                Unread
              </Badge>
            } 
            id="notifications-tab-1"
            aria-controls="notifications-tabpanel-1"
          />
          <Tab 
            label="Filters" 
            icon={
              <Badge 
                badgeContent={filters.length} 
                color="primary"
                invisible={filters.length === 0}
                max={99}
              >
                <FilterIcon fontSize="small" />
              </Badge>
            } 
            iconPosition="end"
            id="notifications-tab-2"
            aria-controls="notifications-tabpanel-2"
          />
        </Tabs>
      </Box>

      <Divider />

      <DialogContent 
        sx={{ 
          p: 0, 
          height: isMobile ? 'auto' : 400,
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" flexGrow={1}>
            <CircularProgress />
          </Box>
        ) : activeTab === 2 ? (
          // Filters tab
          <Box sx={{ p: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Filter by category:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {categories.map((category: any) => (
                <Chip
                  key={category}
                  label={category}
                  color={filters.includes(category) ? "primary" : "default"}
                  onClick={() => handleFilterChange(category)}
                  clickable
                />
              ))}
            </Box>
            
            {filters.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Active filters:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {filters.map((filter: any) => (
                    <Chip
                      key={filter}
                      label={filter}
                      onDelete={() => handleFilterChange(filter)}
                      color="primary"
                    />
                  ))}
                </Box>
              </Box>
            )}
          </Box>
        ) : (
          // All or Unread tab
          <List sx={{ width: '100%', p: 0, overflowY: 'auto' }}>
            {filteredNotifications.length === 0 ? (
              <ListItem>
                <ListItemText
                  primary="No notifications"
                  secondary={activeTab === 1 ? "You've read all your notifications" : "You don't have any notifications yet"}
                />
              </ListItem>
            ) : (
              filteredNotifications.map((notification, index: any) => (
                <React.Fragment key={notification.id}>
                  <ListItem
                    button
                    onClick={() => handleNotificationClick(notification)}
                    sx={{
                      backgroundColor: notification.read 
                        ? 'transparent' 
                        : alpha(theme.palette.primary.light, 0.1),
                      transition: 'background-color 0.2s',
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.primary.light, 0.2),
                      },
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: getTypeColor(notification.type) }}>
                        <NotificationsIcon />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Typography
                          variant="subtitle2"
                          component="span"
                          sx={{
                            fontWeight: notification.read ? 'normal' : 'bold',
                          }}
                        >
                          {notification.title}
                        </Typography>
                      }
                      secondary={
                        <>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            component="span"
                            sx={{
                              display: 'block',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              maxWidth: { xs: '200px', sm: '300px' },
                            }}
                          >
                            {notification.message}
                          </Typography>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            component="span"
                          >
                            {formatTimestamp(notification.timestamp)}
                            {notification.category && (
                              <Chip
                                label={notification.category}
                                size="small"
                                sx={{ ml: 1, height: 20, fontSize: '0.7rem' }}
                              />
                            )}
                          </Typography>
                        </>
                      }
                    />
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        aria-label="delete"
                        onClick={(e) => handleDelete(e, notification.id)}
                        size="small"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                  {index < filteredNotifications.length - 1 && <Divider />}
                </React.Fragment>
              ))
            )}
          </List>
        )}
      </DialogContent>

      <Divider />

      <DialogActions sx={{ px: 2, py: 1, justifyContent: 'space-between' }}>
        <Box>
          <Button
            startIcon={<SettingsIcon />}
            sx={{ textTransform: 'none' }}
            onClick={() => {
              onClose();
              // Would navigate to notification settings in a real implementation
            }}
          >
            Settings
          </Button>
        </Box>
        <Box>
          {notifications.length > 0 && (
            <>
              <Button
                startIcon={<DeleteIcon />}
                onClick={onDeleteAll}
                sx={{ mr: 1 }}
                disabled={notifications.length === 0}
              >
                Clear All
              </Button>
              <Button
                startIcon={<DoneAllIcon />}
                onClick={onMarkAllRead}
                color="primary"
                disabled={unreadCount === 0}
              >
                Mark All Read
              </Button>
            </>
          )}
        </Box>
      </DialogActions>
    </Dialog>
  );
};

export default NotificationModal;