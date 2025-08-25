import React, { useState, useRef } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Box,
  CssBaseline,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Button,
  useTheme,
  Container,
  BottomNavigation,
  BottomNavigationAction
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Business as SupplierIcon,
  Person as CustomerIcon,
  Assessment as ReportsIcon,
  Settings as SettingsIcon,
  ChevronLeft as ChevronLeftIcon
} from '@mui/icons-material';
import useResponsive from '../../hooks/useResponsive';
import useOfflineMode from '../../hooks/useOfflineMode';
import NotificationCenter from '../common/NotificationCenter';
import InspectionNavigation from '../navigation/InspectionNavigation';

const drawerWidth = 240;

const navItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
  { text: 'Suppliers', icon: <SupplierIcon />, path: '/suppliers' },
  { text: 'Customers', icon: <CustomerIcon />, path: '/customers' }
];

const ResponsiveLayout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const { isMobile } = useResponsive();
  const { isOffline } = useOfflineMode();
  const mainContentRef = useRef(null);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { text: 'Suppliers', icon: <SupplierIcon />, path: '/suppliers' },
    { text: 'Customers', icon: <CustomerIcon />, path: '/customers' },
    { text: 'Reports', icon: <ReportsIcon />, path: '/reports' },
    { text: 'Settings', icon: <SettingsIcon />, path: '/settings' },
  ];

  const drawer = (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2 }}>
        <Typography variant="h6" component="div">
          AeroSuite
        </Typography>
        <IconButton onClick={handleDrawerToggle}>
          <ChevronLeftIcon />
        </IconButton>
      </Box>
      <Divider />
      <List>
        {navItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              component={Link}
              to={item.path}
              selected={location.pathname === item.path}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
        <InspectionNavigation />
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <CssBaseline />
      
      {/* Skip to main content link for accessibility */}
      <Box
        component="a"
        href="#main-content"
        sx={{
          position: 'absolute',
          top: '-40px',
          left: 0,
          bgcolor: 'primary.main',
          color: 'white',
          p: 1,
          zIndex: 'tooltip',
          transition: 'top 0.2s',
          '&:focus': {
            top: 0,
          },
        }}
      >
        Skip to main content
      </Box>
      
      {/* Offline banner */}
      {isOffline && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bgcolor: 'warning.main',
            color: 'warning.contrastText',
            p: 0.5,
            textAlign: 'center',
            zIndex: (theme) => theme.zIndex.drawer + 2,
          }}
          role="alert"
        >
          You are offline. Some features may be limited.
        </Box>
      )}
      
      <AppBar position="fixed" sx={{ zIndex: theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            AeroSuite
          </Typography>
          <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
            {menuItems.map((item) => (
              <Button
                key={item.text}
                component={Link}
                to={item.path}
                sx={{ 
                  color: 'white',
                  backgroundColor: location.pathname === item.path ? 'rgba(255, 255, 255, 0.2)' : 'transparent'
                }}
              >
                {item.text}
              </Button>
            ))}
          </Box>
          <NotificationCenter />
        </Toolbar>
      </AppBar>
      
      <Box component="nav">
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, position: 'relative' },
            width: drawerWidth,
            flexShrink: 0,
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          mt: '64px', // AppBar height
          mb: isMobile ? '56px' : 0 // Bottom navigation height on mobile
        }}
        ref={mainContentRef}
      >
        <Container maxWidth="lg">
          <Outlet />
        </Container>
      </Box>
      
      {isMobile && (
        <BottomNavigation
          value={navItems.findIndex(item => item.path === location.pathname)}
          onChange={(event, newValue) => {
            const path = navItems[newValue].path;
            navigate(path);
          }}
          showLabels
          sx={{ 
            width: '100%', 
            position: 'fixed', 
            bottom: 0,
            borderTop: '1px solid rgba(0, 0, 0, 0.12)',
            zIndex: theme.zIndex.appBar
          }}
        >
          {navItems.map((item) => (
            <BottomNavigationAction
              key={item.text}
              label={item.text}
              icon={item.icon}
              component={Link}
              to={item.path}
            />
          ))}
        </BottomNavigation>
      )}
    </Box>
  );
};

export default ResponsiveLayout; 