import React, { createContext, useContext, useMemo, useState, useEffect } from 'react';
import { ThemeProvider as MuiThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { responsiveFontSizes } from '@mui/material/styles';
import { createThemeOptions, ThemeVariant } from './themeConfig';
import { useAppSelector } from '../redux/store';

// Create theme context for direct access to theme methods
type ThemeContextType = {
  mode: 'light' | 'dark';
  variant: ThemeVariant;
  toggleTheme: () => void;
  setMode: (mode: 'light' | 'dark') => void;
  setVariant: (variant: ThemeVariant) => void;
};

const ThemeContext = createContext<ThemeContextType>({
  mode: 'light',
  variant: 'blue',
  toggleTheme: () => {},
  setMode: () => {},
  setVariant: () => {},
});

// Custom hook to use the theme context
export const useThemeContext = () => useContext(ThemeContext);

interface ThemeProviderProps {
  children: React.ReactNode;
}

const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  // Use localStorage for initial theme preference
  const prefersDarkMode = localStorage.getItem('darkMode') === 'true';
  const [mode, setMode] = useState<any>(prefersDarkMode ? 'dark' : 'light');
  
  // Use localStorage for initial theme variant
  const savedVariant = localStorage.getItem('themeVariant') as ThemeVariant | null;
  const [variant, setVariant] = useState<any>(savedVariant || 'blue');
  
  // Use Redux store for persisted theme preference if available
  const uiState = useAppSelector((state) => state.ui);
  
  // Update mode and variant if Redux state is available
  useEffect(() => {
    if (uiState?.darkMode !== undefined) {
      setMode(uiState.darkMode ? 'dark' : 'light');
    }
    if (uiState?.themeVariant) {
      setVariant(uiState.themeVariant);
    }
  }, [uiState]);

  // Listen for system preference changes
  useEffect(() => {
    // If using system preference, set up listener
    if (!localStorage.getItem('darkMode')) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e: MediaQueryListEvent) => {
        setMode(e.matches ? 'dark' : 'light');
      };

      mediaQuery.addEventListener('change', handleChange);
      return () => {
        mediaQuery.removeEventListener('change', handleChange);
      };
    }
  }, []);

  // Create theme switching functions
  const toggleTheme = () => {
    const newMode = mode === 'light' ? 'dark' : 'light';
    setMode(newMode);
    localStorage.setItem('darkMode', newMode === 'dark' ? 'true' : 'false');
  };

  const handleSetMode = (newMode: 'light' | 'dark') => {
    setMode(newMode);
    localStorage.setItem('darkMode', newMode === 'dark' ? 'true' : 'false');
  };
  
  const handleSetVariant = (newVariant: ThemeVariant) => {
    setVariant(newVariant);
    localStorage.setItem('themeVariant', newVariant);
  };

  // Create theme context value
  const themeContextValue = useMemo(
    () => ({
      mode,
      variant,
      toggleTheme,
      setMode: handleSetMode,
      setVariant: handleSetVariant,
    }),
    [mode, variant]
  );

  // Generate theme based on current mode and variant
  const theme = useMemo(() => {
    const themeOptions = createThemeOptions(mode, variant);
    const createdTheme = createTheme(themeOptions);
    return responsiveFontSizes(createdTheme);
  }, [mode, variant]);

  // Expose key theme colors as CSS variables for global CSS usage
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme-mode', mode);
    root.setAttribute('data-theme-variant', variant);
    const palette = theme.palette;
    root.style.setProperty('--color-primary', palette.primary.main);
    root.style.setProperty('--color-secondary', palette.secondary?.main || palette.primary.main);
    root.style.setProperty('--color-error', palette.error.main);
    root.style.setProperty('--color-warning', palette.warning.main);
    root.style.setProperty('--color-info', palette.info.main);
    root.style.setProperty('--color-success', palette.success.main);
    root.style.setProperty('--color-text', palette.text.primary);
    root.style.setProperty('--color-text-secondary', palette.text.secondary);
    root.style.setProperty('--color-bg', palette.background.default);
    root.style.setProperty('--color-paper', palette.background.paper);
  }, [theme, mode, variant]);

  return (
    <ThemeContext.Provider value={themeContextValue}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline enableColorScheme />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};

export default ThemeProvider; 