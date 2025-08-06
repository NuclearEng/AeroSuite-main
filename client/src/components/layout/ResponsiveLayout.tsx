import React, { useState, useEffect } from 'react';
import { Box, Container, useTheme, useMediaQuery, Drawer, IconButton, styled } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import useResponsive from '../../hooks/useResponsive';

// Styled components
const Main = styled(Box)(({ theme }) => ({
  flexGrow: 1,
  padding: theme.spacing(3),
  transition: theme.transitions.create('margin', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen
  })
}));

const MobileHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(2),
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
  position: 'sticky',
  top: 0,
  zIndex: 1100
}));

const MobileMenuButton = styled(IconButton)(({ theme }) => ({
  marginRight: theme.spacing(2),
  color: theme.palette.primary.contrastText
}));

const DrawerHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: theme.spacing(2),
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.primary.contrastText
}));

interface ResponsiveLayoutProps {
  sidebar: React.ReactNode;
  header: React.ReactNode;
  children: React.ReactNode;
  title?: string;
  sidebarWidth?: number;
  fullWidth?: boolean;
}

/**
 * A responsive layout component that adapts to different screen sizes.
 * On mobile devices, it shows a drawer for the sidebar.
 * On larger screens, it shows a fixed sidebar.
 */
const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = ({
  sidebar,
  header,
  children,
  title = 'AeroSuite',
  sidebarWidth = 240,
  fullWidth = false
}) => {
  const theme = useTheme();
  const { isMobile, isTablet } = useResponsive();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Handle drawer toggle
  const toggleDrawer = () => {
    setDrawerOpen(!drawerOpen);
  };

  // Close drawer when changing from mobile to desktop
  useEffect(() => {
    if (!isMobile && drawerOpen) {
      setDrawerOpen(false);
    }
  }, [isMobile, drawerOpen]);

  // Mobile layout
  if (isMobile) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        
        <MobileHeader>
          <MobileMenuButton
            edge="start"
            color="inherit"
            aria-label="menu"
            onClick={toggleDrawer}>

            <MenuIcon />
          </MobileMenuButton>
          <Box sx={{ flexGrow: 1 }}>{title}</Box>
        </MobileHeader>

        
        <Drawer
          anchor="left"
          open={drawerOpen}
          onClose={toggleDrawer}
          sx={{
            width: sidebarWidth,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: sidebarWidth,
              boxSizing: 'border-box'
            }
          }}>

          <DrawerHeader>
            <Box>{title}</Box>
            <IconButton onClick={toggleDrawer} sx={{ color: 'inherit' }}>
              <CloseIcon />
            </IconButton>
          </DrawerHeader>
          {sidebar}
        </Drawer>

        
        <Main component="main" sx={{ flexGrow: 1 }}>
          <Box sx={{ mb: 2 }}>{header}</Box>
          <Container maxWidth={fullWidth ? false : 'lg'} disableGutters={fullWidth}>
            {children}
          </Container>
        </Main>
      </Box>);

  }

  // Tablet and Desktop layout
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      
      <Box
        component="nav"
        sx={{
          width: { sm: sidebarWidth },
          flexShrink: 0,
          display: { xs: 'none', sm: 'block' }
        }}>

        <Box
          sx={{
            width: sidebarWidth,
            height: '100vh',
            position: 'fixed',
            overflowY: 'auto',
            borderRight: `1px solid ${theme.palette.divider}`
          }}>

          {sidebar}
        </Box>
      </Box>

      
      <Main
        component="main"
        sx={{
          flexGrow: 1,
          width: { sm: `calc(100% - ${sidebarWidth}px)` },
          ml: { sm: `${sidebarWidth}px` }
        }}>

        <Box sx={{ mb: 3 }}>{header}</Box>
        <Container maxWidth={fullWidth ? false : 'lg'} disableGutters={fullWidth}>
          {children}
        </Container>
      </Main>
    </Box>);

};

export default ResponsiveLayout;