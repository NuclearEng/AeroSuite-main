import React, { useEffect } from 'react';
import { SnackbarProvider } from 'notistack';
import { HelmetProvider } from 'react-helmet-async';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

// Fix for TypeScript compatibility
const TypedHelmetProvider = HelmetProvider as any;
const TypedSnackbarProvider = SnackbarProvider as any;
import ThemeProvider from './theme/ThemeProvider';
import { Provider } from 'react-redux';
import store from './redux/store';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import ErrorBoundary from './components/common/ErrorBoundary';
import GlobalEnhancements from './components/common/GlobalEnhancements';
import AppRoutes from './routes';
import { queryClient } from './utils/enhance-application';
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
                      <AppRoutes />
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