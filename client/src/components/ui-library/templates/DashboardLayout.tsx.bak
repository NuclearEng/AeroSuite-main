import React, { useState } from 'react';
import {
  Box,
  CssBaseline,
  Drawer,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Container,
  useMediaQuery,
  useTheme } from
'@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';

interface DashboardLayoutProps {
  title?: string;
  children: React.ReactNode;
  sidebar?: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
}

const DRAWER_WIDTH = 240;

const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  title = 'Dashboard',
  children,
  sidebar,
  header,
  footer
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [drawerOpen, setDrawerOpen] = useState(!isMobile);

  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      <CssBaseline />
      
      
      <AppBar
        position="fixed"
        sx={{
          zIndex: theme.zIndex.drawer + 1,
          width: { md: drawerOpen ? `calc(100% - ${DRAWER_WIDTH}px)` : '100%' },
          ml: { md: drawerOpen ? `${DRAWER_WIDTH}px` : 0 },
          transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen
          })
        }}>

        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2 }}>

            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {title}
          </Typography>
          {header}
        </Toolbar>
      </AppBar>

      
      <Drawer
        variant={isMobile ? 'temporary' : 'persistent'}
        open={drawerOpen}
        onClose={isMobile ? handleDrawerToggle : undefined}
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box'
          }
        }}>

        <Toolbar />
        <Box sx={{ overflow: 'auto', height: '100%', p: 2 }}>
          {!isMobile &&
          <IconButton onClick={handleDrawerToggle}>
              <ChevronLeftIcon />
            </IconButton>
          }
          {sidebar}
        </Box>
      </Drawer>

      
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${drawerOpen ? DRAWER_WIDTH : 0}px)` },
          transition: theme.transitions.create('margin', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen
          }),
          ml: { md: drawerOpen ? 0 : `-${DRAWER_WIDTH}px` },
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          overflow: 'auto'
        }}>

        <Toolbar />
        <Container maxWidth="xl" sx={{ flexGrow: 1, py: 2 }}>
          {children}
        </Container>
        {footer &&
        <Box component="footer" sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
            {footer}
          </Box>
        }
      </Box>
    </Box>);

};

export default DashboardLayout;