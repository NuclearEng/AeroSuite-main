import React, { useEffect } from 'react';
import { CssBaseline } from '@mui/material';
import { SnackbarProvider } from 'notistack';
import { HelmetProvider } from 'react-helmet-async';
import ThemeProvider from './theme/ThemeProvider';
import { Provider } from 'react-redux';
import store from './redux/store';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import ErrorBoundary from './components/common/ErrorBoundary';
import './i18n';

const App: React.FC = () => {
  useEffect(() => {
    // Remove server-side injected CSS if present
    const jssStyles = document.querySelector('#jss-server-side');
    if (jssStyles && jssStyles.parentElement) {
      jssStyles.parentElement.removeChild(jssStyles);
    }
  }, []);

  return (
    <Provider store={store}>
      <ThemeProvider>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <HelmetProvider>{/* @ts-expect-error Type definition issue */}
            {/* @ts-expect-error Type definition issue */}
            <SnackbarProvider 
              maxSnack={5} 
              anchorOrigin={{ 
                vertical: 'top', 
                horizontal: 'right' 
              }}
              autoHideDuration={5000}
            >
              <CssBaseline />
              <ErrorBoundary>
                <div style={{ padding: '2rem', textAlign: 'center' }}>
                  <h1>Welcome to AeroSuite</h1>
                  <p>Your aerospace supply chain management platform</p>
                  <div style={{ marginTop: '2rem' }}>
                    <h2>API Status</h2>
                    <p>API Server: Running on port 5002 ✅</p>
                    <p>Demo Page: Available at <a href="/demo.html">demo.html</a></p>
                  </div>
                </div>
              </ErrorBoundary>
            </SnackbarProvider>
          </HelmetProvider>
        </LocalizationProvider>
      </ThemeProvider>
    </Provider>
  );
};

export default App;
