import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { Provider } from 'react-redux';
import { configureStore, combineReducers, Action } from '@reduxjs/toolkit';
import theme from '../theme/theme';
import CssBaseline from '@mui/material/CssBaseline';
import { SnackbarProvider } from 'notistack';
import { BrowserRouter } from 'react-router-dom';

// Define action type
interface AuthAction extends Action {
  type: 'LOGIN' | 'LOGOUT';
}

// Import reducers - add your reducers as needed
// Using a simple mock reducer for testing
const rootReducer = combineReducers({
  auth: (state = { isAuthenticated: false }, action: AuthAction) => {
    switch (action.type) {
      case 'LOGIN':
        return { ...state, isAuthenticated: true };
      case 'LOGOUT':
        return { ...state, isAuthenticated: false };
      default:
        return state;
    }
  }
});

// Mock store
const mockStore = configureStore({
  reducer: rootReducer
});

// Interface for render options with custom props
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  store?: typeof mockStore;
}

// Custom render function that wraps components with all necessary providers
function CustomRender(
ui: ReactElement,
{
  store = mockStore,
  ...renderOptions
}: CustomRenderOptions = {})
{
  function Wrapper({ children }: {children: React.ReactNode;}) {
    return (
      <Provider store={store}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <SnackbarProvider maxSnack={3}>
            <BrowserRouter>
              {children}
            </BrowserRouter>
          </SnackbarProvider>
        </ThemeProvider>
      </Provider>);

  }
  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

// Re-export everything from testing-library
export * from '@testing-library/react';

// Export both names for backward compatibility
export { CustomRender as render };
export { CustomRender as renderWithProviders };