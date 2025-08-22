import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Box, Toolbar, useMediaQuery, useTheme, Container, CssBaseline } from '@mui/material';
import Header from '../components/navigation/Header';
import Sidebar from '../components/navigation/Sidebar';
import useResponsive from '../hooks/useResponsive';
import { SkipToContent, Announcer } from '../utils/accessibility';
import useKeyboardShortcuts, { ShortcutMap, KeyboardShortcut } from '../utils/keyboardShortcuts';
import KeyboardShortcutsDialog from '../components/common/KeyboardShortcutsDialog';
import PerformanceMonitor from '../components/common/PerformanceMonitor';
import usePerformanceMonitor from '../hooks/usePerformanceMonitor';
import RealtimeNotifications from '../components/notifications/RealtimeNotifications';
import { useAuth } from '../hooks/useAuth';
import { useSelector } from 'react-redux';
import TopBar from '../components/navigation/TopBar';
import Footer from '../components/layout/Footer';
import NotificationCenter from '../components/notifications/NotificationCenter';
import { RootState } from '../redux/store';

/**
 * Main layout component with proper ARIA landmarks
 * Provides the application shell with navigation, header, and footer
 */
const MainLayout: React.FC = () => {
  const theme = useTheme();
  const isMobileOrTablet = useMediaQuery(theme.breakpoints.down('md'));
  const { isAuthenticated } = useAuth();
  const { user } = useSelector((state: RootState) => state.auth);

  // Performance monitoring
  const performance = usePerformanceMonitor('MainLayout', true);

  // Drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(!isMobileOrTablet);

  // Keyboard shortcuts dialog state
  const [shortcutsDialogOpen, setShortcutsDialogOpen] = useState(false);

  // Update drawer state when screen size changes
  useEffect(() => {
    setIsDrawerOpen(!isMobileOrTablet);
  }, [isMobileOrTablet]);

  // Toggle drawer
  const handleDrawerToggle = () => {
    const startTime = performance.startInteractionTimer();
    setIsDrawerOpen((prev) => !prev);
    performance.measureInteraction('toggle-drawer', startTime);
  };

  // Close drawer (for mobile)
  const handleDrawerClose = () => {
    if (isMobileOrTablet) {
      setIsDrawerOpen(false);
    }
  };

  // Setup keyboard shortcuts
  const customShortcuts: ShortcutMap = {
    'show-shortcuts': {
      key: '?',
      description: 'Show keyboard shortcuts',
      action: () => setShortcutsDialogOpen(true),
      scope: 'global'
    } as KeyboardShortcut
  };

  // Initialize keyboard shortcuts
  useKeyboardShortcuts(customShortcuts);

  // Handle escape key events
  useEffect(() => {
    const handleEscapeEvent = () => {
      if (shortcutsDialogOpen) {
        setShortcutsDialogOpen(false);
      }
    };

    document.addEventListener('app:escape', handleEscapeEvent);

    return () => {
      document.removeEventListener('app:escape', handleEscapeEvent);
    };
  }, [shortcutsDialogOpen]);

  // Mark component as loaded
  useEffect(() => {
    performance.markLoad();
  }, []);

  // Get customer ID if the user is a customer
  const customerId = user?.role === 'customer' ? (user as any).customerId : undefined;

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <CssBaseline />
      
      
      <header>
        <Header onMenuClick={handleDrawerToggle} isDrawerOpen={isDrawerOpen} />
      </header>
      
      
      <Box component="nav" aria-label="Main navigation">
        <Sidebar
          open={isDrawerOpen}
          onClose={handleDrawerClose}
          onToggle={handleDrawerToggle}
          variant={isMobileOrTablet ? 'temporary' : 'permanent'} />

      </Box>
      
      
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          overflow: 'auto',
          pt: { xs: 8, sm: 9 },
          px: { xs: 2, sm: 4 },
          pb: 4
        }}
        id="main-content"
        tabIndex={-1}
        role="main"
        aria-label="Main content">

        
        <Box id="skip-target" tabIndex={-1} sx={{ position: 'absolute', top: 0 }} />
        
        
        <Container maxWidth="xl" sx={{ mt: 4 }}>
          <TopBar />
          <Outlet />
        </Container>
      </Box>
      
      
      <Box component="footer" role="contentinfo">
        <Footer />
      </Box>
      
      
      <SkipToContent />
      
      
      <Announcer message="" politeness="polite" />
      
      
      {isAuthenticated && <RealtimeNotifications />}
      
      
      <KeyboardShortcutsDialog
        open={shortcutsDialogOpen}
        onClose={() => setShortcutsDialogOpen(false)} />

      
      
      {process.env.NODE_ENV !== 'production' &&
      <PerformanceMonitor position="bottom-right" defaultOpen={false} />
      }
      
      <NotificationCenter />
    </Box>);

};

export default MainLayout;