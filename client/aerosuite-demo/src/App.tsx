import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import {
  CssBaseline,
  Box,
  AppBar,
  Toolbar,
  Typography,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Divider,
  useMediaQuery,
  Button,
  Avatar,
  Menu,
  MenuItem } from
'@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Assignment as InspectionsIcon,
  Business as CustomersIcon,
  Factory as SuppliersIcon,
  Person as ProfileIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon } from
'@mui/icons-material';

// Import pages
import Dashboard from './pages/Dashboard';
import InspectionList from './pages/inspections/InspectionList';
import InspectionDetail from './pages/inspections/InspectionDetail';
import ScheduleInspection from './pages/inspections/ScheduleInspection';
import ConductInspection from './pages/inspections/ConductInspection';
import CustomerList from './pages/customers/CustomerList';
import CustomerDetail from './pages/customers/CustomerDetail';
import SupplierList from './pages/suppliers/SupplierList';
import SupplierDetail from './pages/suppliers/SupplierDetail';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';
import InspectionsRoutes from './pages/inspections';
import AddCustomer from './pages/customers/AddCustomer';
import AddSupplier from './pages/suppliers/AddSupplier';
import SupplierNetwork from './pages/suppliers/SupplierNetwork';
import SupplierAnalytics from './pages/suppliers/SupplierAnalytics';
import SupplierRiskAssessment from './pages/suppliers/SupplierRiskAssessment';
import PerformanceDashboard from './pages/ai-analysis/performance-dashboard';

// Set up the drawer width
const drawerWidth = 240;

function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileMenuAnchor, setProfileMenuAnchor] = useState<null | HTMLElement>(null);
  const isMobile = useMediaQuery('(max-width:600px)');

  // Create theme
  const theme = createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
      primary: {
        main: '#1976d2'
      },
      secondary: {
        main: '#dc004e'
      }
    }
  });

  // Toggle drawer
  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  // Profile menu
  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setProfileMenuAnchor(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setProfileMenuAnchor(null);
  };

  // Navigation items
  const navItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
  { text: 'Inspections', icon: <InspectionsIcon />, path: '/inspections' },
  { text: 'Customers', icon: <CustomersIcon />, path: '/customers' },
  { text: 'Suppliers', icon: <SuppliersIcon />, path: '/suppliers' },
  { text: 'Model Performance', icon: <SettingsIcon />, path: '/ai-analysis/performance-dashboard' },
  { text: 'Settings', icon: <SettingsIcon />, path: '/settings' }];


  // Drawer content
  const drawer =
  <>
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
          AeroSuite
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {navItems.map((item) =>
      <ListItem key={item.text} disablePadding>
            <ListItemButton
          component={Link}
          to={item.path}
          onClick={() => isMobile && setMobileOpen(false)}>

              <ListItemIcon>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
      )}
      </List>
    </>;


  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Box sx={{ display: 'flex' }}>
          
          <AppBar
            position="fixed"
            sx={{
              width: { sm: `calc(100% - ${drawerWidth}px)` },
              ml: { sm: `${drawerWidth}px` }
            }}>

            <Toolbar>
              <IconButton
                color="inherit"
                aria-label="open drawer"
                edge="start"
                onClick={handleDrawerToggle}
                sx={{ mr: 2, display: { sm: 'none' } }}>

                <MenuIcon />
              </IconButton>
              <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
                <AppTitle />
              </Typography>
              
              
              <IconButton color="inherit" onClick={() => setDarkMode(!darkMode)}>
                {darkMode ? <LightModeIcon /> : <DarkModeIcon />}
              </IconButton>
              
              
              <IconButton
                color="inherit"
                onClick={handleProfileMenuOpen}
                sx={{ ml: 1 }}>

                <Avatar sx={{ width: 32, height: 32 }}>TC</Avatar>
              </IconButton>
              
              
              <Menu
                anchorEl={profileMenuAnchor}
                open={Boolean(profileMenuAnchor)}
                onClose={handleProfileMenuClose}>

                <MenuItem
                  component={Link}
                  to="/profile"
                  onClick={handleProfileMenuClose}>

                  <ListItemIcon>
                    <ProfileIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Profile</ListItemText>
                </MenuItem>
                <MenuItem
                  component={Link}
                  to="/settings"
                  onClick={handleProfileMenuClose}>

                  <ListItemIcon>
                    <SettingsIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Settings</ListItemText>
                </MenuItem>
                <Divider />
                <MenuItem onClick={handleProfileMenuClose}>
                  <ListItemIcon>
                    <LogoutIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Logout</ListItemText>
                </MenuItem>
              </Menu>
            </Toolbar>
          </AppBar>
          
          
          <Box
            component="nav"
            sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}>

            
            <Drawer
              variant="temporary"
              open={mobileOpen}
              onClose={handleDrawerToggle}
              ModalProps={{
                keepMounted: true // Better open performance on mobile
              }}
              sx={{
                display: { xs: 'block', sm: 'none' },
                '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth }
              }}>

              {drawer}
            </Drawer>
            
            
            <Drawer
              variant="permanent"
              sx={{
                display: { xs: 'none', sm: 'block' },
                '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth }
              }}
              open>

              {drawer}
            </Drawer>
          </Box>
          
          
          <Box
            component="main"
            sx={{
              flexGrow: 1,
              p: 3,
              width: { sm: `calc(100% - ${drawerWidth}px)` },
              mt: 8,
              height: 'calc(100vh - 64px)', // Set height to viewport height minus app bar
              overflowY: 'auto', // Add scrolling for content that exceeds the height
              display: 'flex',
              flexDirection: 'column'
            }}>

            <Box
              sx={{
                maxWidth: '1200px',
                width: '100%',
                mx: 'auto',
                flexGrow: 1,
                display: 'flex',
                flexDirection: 'column'
              }}>

              <Routes>
                <Route path="/" element={<Dashboard />} />
                
                
                <Route path="/inspections/*" element={<InspectionsRoutes />} />
                
                
                <Route path="/customers" element={<CustomerList />} />
                <Route path="/customers/:id" element={<CustomerDetail />} />
                <Route path="/customers/add" element={<AddCustomer />} />
                
                
                <Route path="/suppliers" element={<SupplierList />} />
                <Route path="/suppliers/:id" element={<SupplierDetail />} />
                <Route path="/suppliers/add" element={<AddSupplier />} />
                <Route path="/suppliers/network" element={<SupplierNetwork />} />
                <Route path="/suppliers/analytics" element={<SupplierAnalytics />} />
                <Route path="/suppliers/risk-assessment" element={<SupplierRiskAssessment />} />
                
                
                <Route path="/ai-analysis/performance-dashboard" element={<PerformanceDashboard />} />
                
                
                <Route path="/profile" element={<Profile />} />
                <Route path="/settings" element={<Settings />} />
                
                
                <Route path="/404" element={<NotFound />} />
                <Route path="*" element={<Navigate to="/404" replace />} />
              </Routes>
            </Box>
          </Box>
        </Box>
      </BrowserRouter>
    </ThemeProvider>);

}

// Dynamic app title based on current route
const AppTitle = () => {
  const location = useLocation();

  // Get title based on path
  const getTitle = () => {
    const path = location.pathname;

    if (path === '/') return 'Dashboard';
    if (path.startsWith('/inspections')) return 'Inspections';
    if (path.startsWith('/customers')) return 'Customers';
    if (path.startsWith('/suppliers')) return 'Suppliers';
    if (path === '/profile') return 'Profile';
    if (path === '/settings') return 'Settings';
    if (path === '/404') return 'Page Not Found';

    return 'AeroSuite';
  };

  return (
    <>{getTitle()}</>);

};

export default App;