/**
 * Provider Pattern
 * 
 * @task RF015 - Implement component composition patterns
 * 
 * The Provider pattern uses React Context to share state and functionality across components
 * without prop drilling. It creates a provider component that manages state and makes it
 * available to all child components through a custom hook.
 * 
 * Example: A Theme provider that manages theme state
 */

import React, { createContext, useContext, useState, ReactNode } from 'react';

// Available themes
type ThemeType = 'light' | 'dark' | 'system';

// Theme context type
interface ThemeContextType {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
  toggleTheme: () => void;
  isDarkMode: boolean;
}

// Create the context
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Props for the ThemeProvider
interface ThemeProviderProps {
  initialTheme?: ThemeType;
  children: ReactNode;
}

/**
 * Theme Provider Component
 * 
 * Provides theme state and functions to all child components
 */
export const ThemeProvider: React.FC<ThemeProviderProps> = ({ 
  initialTheme = 'system', 
  children 
}) => {
  const [theme, setTheme] = useState<ThemeType>(initialTheme);
  
  // Determine if dark mode is active
  const isDarkMode = React.useMemo(() => {
    if (theme === 'dark') return true;
    if (theme === 'light') return false;
    
    // For 'system' theme, check system preferences
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  }, [theme]);
  
  // Toggle between light and dark themes
  const toggleTheme = () => {
    setTheme(current => {
      if (current === 'light') return 'dark';
      if (current === 'dark') return 'light';
      // If system, set to opposite of current system preference
      return isDarkMode ? 'light' : 'dark';
    });
  };
  
  // Apply theme class to body
  React.useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('dark-theme');
      document.body.classList.remove('light-theme');
    } else {
      document.body.classList.add('light-theme');
      document.body.classList.remove('dark-theme');
    }
  }, [isDarkMode]);
  
  const value = { theme, setTheme, toggleTheme, isDarkMode };
  
  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

/**
 * Custom hook to use the theme context
 */
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

/**
 * Theme Consumer Component
 * 
 * Alternative to using the useTheme hook
 */
export const ThemeConsumer: React.FC<{
  children: (context: ThemeContextType) => ReactNode;
}> = ({ children }) => {
  return (
    <ThemeContext.Consumer>
      {(context) => {
        if (!context) {
          throw new Error('ThemeConsumer must be used within a ThemeProvider');
        }
        return children(context);
      }}
    </ThemeContext.Consumer>
  );
};

export type { ThemeType, ThemeContextType }; 