import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  IconButton,
  Box,
  InputBase,
  Badge,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  ListItemIcon,
  Typography,
  alpha,
  styled,
  useTheme,
  Tooltip,
  Fade
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import SearchIcon from '@mui/icons-material/Search';
import NotificationsIcon from '@mui/icons-material/Notifications';
import MailIcon from '@mui/icons-material/Mail';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import SettingsIcon from '@mui/icons-material/Settings';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import { useNavigate } from 'react-router-dom';
import { useThemeContext } from '../../theme/ThemeProvider';
import { useAppSelector, useAppDispatch, RootState } from '../../redux/store';
import { logout } from '../../redux/slices/auth.slice';
import NotificationItem, { Notification } from './NotificationItem';
import { generateA11yId, AriaProps } from '../../utils/accessibility';
import LanguageSelector from '../common/LanguageSelector';

// Generate unique IDs for ARIA relationships
const notificationsMenuId = generateA11yId('notifications-menu');
const messagesMenuId = generateA11yId('messages-menu');
const userMenuId = generateA11yId('user-menu');
const searchInputId = generateA11yId('search-input');

// Styled search component
const Search = styled('div')(({ theme }) => ({
  position: 'relative',
  borderRadius: 24,
  backgroundColor: alpha(theme.palette.common.white, 0.15),
  '&:hover': {
    backgroundColor: alpha(theme.palette.common.white, 0.25),
  },
  marginRight: theme.spacing(2),
  marginLeft: 0,
  width: '100%',
  [theme.breakpoints.up('sm')]: {
    marginLeft: theme.spacing(3),
    width: 'auto',
  },
  transition: theme.transitions.create('width'),
}));

const SearchIconWrapper = styled('div')(({ theme }) => ({
  padding: theme.spacing(0, 2),
  height: '100%',
  position: 'absolute',
  pointerEvents: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: 'inherit',
  '& .MuiInputBase-input': {
    padding: theme.spacing(1, 1, 1, 0),
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    transition: theme.transitions.create('width'),
    width: '100%',
    [theme.breakpoints.up('md')]: {
      width: '20ch',
      '&:focus': {
        width: '30ch',
      },
    },
  },
}));

// Styled badge for notification indicators
const StyledBadge = styled(Badge)(({ theme }) => ({
  '& .MuiBadge-badge': {
    backgroundColor: theme.palette.error.main,
    color: theme.palette.error.contrastText,
    boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
    '&::after': {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      borderRadius: '50%',
      animation: 'ripple 1.2s infinite ease-in-out',
      border: '1px solid currentColor',
      content: '""',
    },
  },
  '@keyframes ripple': {
    '0%': {
      transform: 'scale(.8)',
      opacity: 1,
    },
    '100%': {
      transform: 'scale(2.4)',
      opacity: 0,
    },
  },
}));

// User menu button with animation
const UserMenuButton = styled(IconButton)(({ theme }) => ({
  padding: 4,
  marginLeft: theme.spacing(1),
  transition: theme.transitions.create('transform', {
    duration: theme.transitions.duration.shorter,
    easing: theme.transitions.easing.easeInOut,
  }),
  '&:hover': {
    transform: 'scale(1.1)',
  },
}));

// Props for the Header component
interface HeaderProps {
  onMenuClick: () => void;
  isDrawerOpen: boolean;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick, isDrawerOpen }) => {
  const theme = useTheme();
  const { mode, toggleTheme } = useThemeContext();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  
  // User data from Redux store
  const user = useAppSelector((state: RootState) => state.auth.user);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearching, setIsSearching] = useState<boolean>(false);
  
  // Sample notifications (in a real app, these would come from a Redux store or API)
  const notifications: Notification[] = [
    {
      id: 1,
      title: 'New Inspection Scheduled',
      message: 'A new inspection has been scheduled for Supplier ABC',
      time: '10 minutes ago',
      read: false,
      type: 'info',
    },
    {
      id: 2,
      title: 'Inspection Overdue',
      message: 'Inspection #1234 is overdue for completion',
      time: '1 hour ago',
      read: false,
      type: 'warning',
    },
    {
      id: 3,
      title: 'New Report Available',
      message: 'Monthly compliance report is now available for review',
      time: '3 hours ago',
      read: true,
      type: 'success',
    },
  ];
  
  // State for managing menu anchors
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null);
  const [notificationsAnchor, setNotificationsAnchor] = useState<null | HTMLElement>(null);
  const [messagesAnchor, setMessagesAnchor] = useState<null | HTMLElement>(null);
  
  // Boolean states for menu open status
  const isUserMenuOpen = Boolean(userMenuAnchor);
  const isNotificationsOpen = Boolean(notificationsAnchor);
  const isMessagesOpen = Boolean(messagesAnchor);
  
  // Handle opening and closing menus
  const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setUserMenuAnchor(event.currentTarget);
  };
  
  const handleNotificationsOpen = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationsAnchor(event.currentTarget);
  };
  
  const handleMessagesOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMessagesAnchor(event.currentTarget);
  };
  
  const handleCloseMenus = () => {
    setUserMenuAnchor(null);
    setNotificationsAnchor(null);
    setMessagesAnchor(null);
  };
  
  // Handle logging out
  const handleLogout = () => {
    handleCloseMenus();
    dispatch(logout());
    navigate('/auth/login');
  };
  
  // Handle navigation to profile
  const handleNavigateToProfile = () => {
    handleCloseMenus();
    navigate('/profile');
  };
  
  // Handle navigation to settings
  const handleNavigateToSettings = () => {
    handleCloseMenus();
    navigate('/settings');
  };
  
  // Handle navigation to help
  const handleNavigateToHelp = () => {
    handleCloseMenus();
    navigate('/help');
  };
  
  // Handle navigation to all notifications
  const handleViewAllNotifications = () => {
    handleCloseMenus();
    navigate('/notifications');
  };
  
  // Handle navigation to all messages
  const handleViewAllMessages = () => {
    handleCloseMenus();
    navigate('/messages');
  };
  
  // Handle navigation to specific message/conversation
  const handleNavigateToMessage = (messageId: string) => {
    handleCloseMenus();
    navigate(`/messages/${messageId}`);
  };
  
  // Handle search
  const handleSearch = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && searchQuery.trim()) {
      setIsSearching(true);
      // Navigate to search results page with query
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      // Optionally clear search after navigation
      setTimeout(() => {
        setIsSearching(false);
      }, 500);
    }
  };
  
  // Handle search input change
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };
  
  // Get the number of unread notifications and messages
  const unreadNotifications = notifications.filter(n => !n.read).length;
  const unreadMessages = 4; // In a real app, this would come from the state/API
  
  return (
    <AppBar 
      position="fixed" 
      color="default"
      component="header"
      role="banner"
      aria-label="Application header"
      sx={{
        zIndex: theme.zIndex.drawer + 1,
        boxShadow: theme.shadows[3],
        background: theme.palette.background.paper,
        backdropFilter: 'blur(8px)',
        borderBottom: `1px solid ${theme.palette.divider}`,
      }}
    >
      <Toolbar>
        <IconButton
          color="inherit"
          aria-label={isDrawerOpen ? "close sidebar" : "open sidebar"}
          onClick={onMenuClick}
          edge="start"
          sx={{
            marginRight: 0.5,
            transition: (theme) => theme.transitions.create('transform', {
              duration: theme.transitions.duration.shorter,
              easing: theme.transitions.easing.easeInOut,
            }),
            transform: isDrawerOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        >
          <MenuIcon />
        </IconButton>
        
        <Search role="search" aria-label="Application search">
          <SearchIconWrapper>
            <SearchIcon aria-hidden="true" />
          </SearchIconWrapper>
          <StyledInputBase
            placeholder="Search…"
            id={searchInputId}
            value={searchQuery}
            onChange={handleSearchChange}
            onKeyDown={handleSearch}
            disabled={isSearching}
            inputProps={{ 
              'aria-label': 'search application',
              role: 'searchbox'
            }}
          />
        </Search>
        
        <Box sx={{ flexGrow: 1 }} />
        
        <Box sx={{ display: { xs: 'none', md: 'flex' }, mr: 1 }}>
          <LanguageSelector variant="icon" size="small" />
        </Box>
        
        <Tooltip title={mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
          <IconButton onClick={toggleTheme} color="inherit" size="small" sx={{ mr: 1 }}>
            {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
          </IconButton>
        </Tooltip>
        
        <Tooltip title="Notifications">
          <IconButton
            color="inherit"
            aria-label={`show ${unreadNotifications} new notifications`}
            aria-controls={notificationsMenuId}
            aria-haspopup="true"
            onClick={handleNotificationsOpen}
            size="small"
          >
            <StyledBadge badgeContent={unreadNotifications} color="error">
              <NotificationsIcon />
            </StyledBadge>
          </IconButton>
        </Tooltip>
        
        <Tooltip title="Messages">
          <IconButton
            color="inherit"
            aria-label={`show ${unreadMessages} new messages`}
            aria-controls={messagesMenuId}
            aria-haspopup="true"
            onClick={handleMessagesOpen}
            size="small"
            sx={{ mx: 1 }}
          >
            <Badge badgeContent={unreadMessages} color="error">
              <MailIcon />
            </Badge>
          </IconButton>
        </Tooltip>
        
        <Tooltip title="Account settings">
          <UserMenuButton
            edge="end"
            aria-label="account settings"
            aria-controls={userMenuId}
            aria-haspopup="true"
            onClick={handleUserMenuOpen}
            color="inherit"
          >
            {user?.avatar ? (
              <Avatar 
                src={user.avatar} 
                alt={user.name || 'User avatar'} 
                sx={{ width: 32, height: 32 }}
              />
            ) : (
              <AccountCircleIcon />
            )}
          </UserMenuButton>
        </Tooltip>
        
        <Menu
          id={userMenuId}
          anchorEl={userMenuAnchor}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          keepMounted
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          open={isUserMenuOpen}
          onClose={handleCloseMenus}
          TransitionComponent={Fade}
        >
          <Box sx={{ px: 2, py: 1 }}>
            <Typography variant="subtitle1" component="div">
              {user?.name || 'User'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {user?.email || 'user@example.com'}
            </Typography>
          </Box>
          <Divider />
          <MenuItem onClick={handleNavigateToProfile}>
            <ListItemIcon>
              <AccountCircleIcon fontSize="small" />
            </ListItemIcon>
            Profile
          </MenuItem>
          <MenuItem onClick={handleNavigateToSettings}>
            <ListItemIcon>
              <SettingsIcon fontSize="small" />
            </ListItemIcon>
            Settings
          </MenuItem>
          <MenuItem onClick={handleNavigateToHelp}>
            <ListItemIcon>
              <HelpOutlineIcon fontSize="small" />
            </ListItemIcon>
            Help
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleLogout}>
            <ListItemIcon>
              <ExitToAppIcon fontSize="small" />
            </ListItemIcon>
            Logout
          </MenuItem>
        </Menu>
        
        <Menu
          id={notificationsMenuId}
          anchorEl={notificationsAnchor}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          keepMounted
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          open={isNotificationsOpen}
          onClose={handleCloseMenus}
          PaperProps={{
            elevation: 3,
            sx: { width: 360, maxHeight: 400, overflowY: 'auto' }
          }}
        >
          <Typography variant="h6" sx={{ px: 2, py: 1 }}>
            Notifications
          </Typography>
          <Divider />
          {notifications.length > 0 ? (
            notifications.map((notification) => (
              <NotificationItem 
                key={notification.id}
                notification={notification}
                onClick={handleCloseMenus}
              />
            ))
          ) : (
            <MenuItem disabled>
              <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>
                No notifications
              </Typography>
            </MenuItem>
          )}
          <Divider />
          <MenuItem onClick={handleViewAllNotifications} sx={{ justifyContent: 'center' }}>
            <Typography variant="body2" color="primary">
              View all notifications
            </Typography>
          </MenuItem>
        </Menu>
        
        <Menu
          id={messagesMenuId}
          anchorEl={messagesAnchor}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          keepMounted
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          open={isMessagesOpen}
          onClose={handleCloseMenus}
          PaperProps={{
            elevation: 3,
            sx: { width: 360, maxHeight: 400, overflowY: 'auto' }
          }}
        >
          <Typography variant="h6" sx={{ px: 2, py: 1 }}>
            Messages
          </Typography>
          <Divider />
          <MenuItem onClick={() => handleNavigateToMessage('1')}>
            <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
              <Avatar sx={{ mr: 2 }}>JD</Avatar>
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="subtitle2">John Doe</Typography>
                <Typography variant="body2" color="text.secondary" noWrap>
                  Can you review the latest inspection report?
                </Typography>
              </Box>
              <Typography variant="caption" color="text.secondary">
                5m ago
              </Typography>
            </Box>
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleViewAllMessages} sx={{ justifyContent: 'center' }}>
            <Typography variant="body2" color="primary">
              View all messages
            </Typography>
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default Header; 