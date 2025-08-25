import React, { useEffect } from 'react';
import { SnackbarProvider } from 'notistack';
import { HelmetProvider } from 'react-helmet-async';
import { BrowserRouter, Outlet, useLocation } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

// Fix for TypeScript compatibility
const TypedHelmetProvider = HelmetProvider as any;
const TypedSnackbarProvider = SnackbarProvider as any;
import { Provider } from 'react-redux';
import store from './redux/store';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import ErrorBoundary from './components/common/ErrorBoundary';
import GlobalEnhancements from './components/common/GlobalEnhancements';
import AppRoutes from './routes';
import { queryClient } from './utils/enhance-application';
import './i18n';
import { ThemeProvider } from '@mui/material/styles';
import { lightTheme, darkTheme } from './theme';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useMemo, useState } from 'react';
import { Button } from '@mui/material';
// Ensure import is correct
import { AnimatePresence, motion } from 'framer-motion';


if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js');
  });
}

// Create manifest.json in public/ with AeroSuite details

function App() {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const [mode, setMode] = useState(localStorage.getItem('theme') as 'light' | 'dark' ?? (prefersDarkMode ? 'dark' : 'light'));

  const theme = useMemo(() => mode === 'dark' ? darkTheme : lightTheme, [mode]);

  const toggleTheme = () => {
    const newMode = mode === 'light' ? 'dark' : 'light';
    setMode(newMode);
    localStorage.setItem('theme', newMode);
  };

  useEffect(() => {
    // Remove server-side injected CSS if present
    const jssStyles = document.querySelector('#jss-server-side');
    if (jssStyles && jssStyles.parentElement) {
      jssStyles.parentElement.removeChild(jssStyles);
    }
  }, []);

  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        {/* Add a toggle button in the header or settings */}
        <Button onClick={toggleTheme}>Toggle Theme</Button>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <TypedHelmetProvider>
          
            
            
            
            <TypedSnackbarProvider
              maxSnack={5}
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'right'
              }}
              autoHideDuration={5000}>

              <QueryClientProvider client={queryClient}>
                <BrowserRouter>
                  <ErrorBoundary>
                    <GlobalEnhancements>
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={location.pathname}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ duration: 0.3 }}
                        >
                          <Outlet />
                        </motion.div>
                      </AnimatePresence>
                    </GlobalEnhancements>
                  </ErrorBoundary>
                  {process.env.NODE_ENV === 'development' && <ReactQueryDevtools />}
                </BrowserRouter>
              </QueryClientProvider>
            </TypedSnackbarProvider>
                      </TypedHelmetProvider>
        </LocalizationProvider>
      </ThemeProvider>
    </Provider>);

};

export default App;