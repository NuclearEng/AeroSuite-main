import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline, Snackbar, Button } from '@mui/material';
import { createTheme } from '@mui/material/styles';
// Legacy theme removed. This JS App entry is deprecated; use App.tsx with ThemeProvider.
import ResponsiveLayout from './components/layout/ResponsiveLayout';
import Dashboard from './pages/Dashboard';
import SupplierList from './pages/suppliers/SupplierList';
import SupplierDetails from './pages/suppliers/SupplierDetails';
import CustomerList from './pages/customers/CustomerList';
import Login from './pages/auth/Login';
import NotFound from './pages/NotFound';
import AccessibilityTesting from './pages/AccessibilityTesting';
import { registerServiceWorker, ServiceWorkerUpdateNotification } from './utils/serviceWorkerUtils';
import { initializeAccessibility } from './components/common/AccessibilityHelpers';
import useOfflineMode from './hooks/useOfflineMode';

// Mock authentication context for development
const AuthContext = React.createContext({
  isAuthenticated: true,
  user: { name: 'Demo User', email: 'demo@example.com', role: 'admin' },
  login: () => {},
  logout: () => {}
});

// Create an accessible theme with proper color contrast
const accessibleTheme = createTheme({
  ...theme,
  palette: {
    ...theme.palette,
    primary: {
      main: '#1976d2', // WCAG AA compliant
      light: '#4791db',
      dark: '#115293',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#dc004e', // WCAG AA compliant
      light: '#e33371',
      dark: '#9a0036',
      contrastText: '#ffffff',
    },
    error: {
      main: '#d32f2f', // WCAG AA compliant
      light: '#ef5350',
      dark: '#c62828',
      contrastText: '#ffffff',
    },
    warning: {
      main: '#ed6c02', // WCAG AA compliant
      light: '#ff9800',
      dark: '#e65100',
      contrastText: '#ffffff',
    },
    info: {
      main: '#0288d1', // WCAG AA compliant
      light: '#03a9f4',
      dark: '#01579b',
      contrastText: '#ffffff',
    },
    success: {
      main: '#2e7d32', // WCAG AA compliant
      light: '#4caf50',
      dark: '#1b5e20',
      contrastText: '#ffffff',
    },
  },
  components: {
    ...theme.components,
    MuiButton: {
      styleOverrides: {
        root: {
          fontWeight: 600,
        },
        containedPrimary: {
          '&:hover': {
            backgroundColor: '#115293',
          },
        },
      },
    },
    MuiLink: {
      styleOverrides: {
        root: {
          textDecoration: 'underline', // Better for accessibility
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          fontSize: '0.875rem', // Larger font size for readability
          backgroundColor: 'rgba(0, 0, 0, 0.87)', // Higher contrast
        },
      },
    },
  },
  typography: {
    ...theme.typography,
    // Ensure minimum font size for readability
    fontSize: 16,
    body1: {
      fontSize: '1rem',
      lineHeight: 1.5,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
    },
  },
});

const App = () => {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState(null);
  const { isOffline } = useOfflineMode();

  // Register service worker for PWA support
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        registerServiceWorker().then((registration) => {
          // Check for updates
          if (registration) {
            registration.addEventListener('updatefound', () => {
              const newWorker = registration.installing;
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  setUpdateAvailable(true);
                  setWaitingWorker(newWorker);
                }
              });
            });
          }
        });
      });
    }
  }, []);

  // Initialize accessibility features
  useEffect(() => {
    initializeAccessibility();
  }, []);

  // Handle service worker update
  const handleServiceWorkerUpdate = () => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
      setUpdateAvailable(false);
      window.location.reload();
    }
  };

  const dismissUpdate = () => {
    setUpdateAvailable(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated: true, user: { name: 'Demo User' } }}>
      <ThemeProvider theme={accessibleTheme}>
        <CssBaseline />
        {isOffline && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              backgroundColor: '#f44336',
              color: 'white',
              padding: '4px 16px',
              textAlign: 'center',
              zIndex: 2000,
            }}
          >
            You are currently offline. Some features may be limited.
          </div>
        )}
        <Routes>
          <Route path="/" element={<ResponsiveLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="suppliers" element={<SupplierList />} />
            <Route path="suppliers/:id" element={<SupplierDetails />} />
            <Route path="customers" element={<CustomerList />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
        
        {/* Service worker update notification */}
        {updateAvailable && (
          <ServiceWorkerUpdateNotification 
            onAccept={handleServiceWorkerUpdate} 
            onDismiss={dismissUpdate} 
          />
        )}
      </ThemeProvider>
    </AuthContext.Provider>
  );
};

export default App;
export { AuthContext }; 