import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import theme from '../theme';

/**
 * Renders a component wrapped in a ThemeProvider for testing
 * This is necessary for components that use Material-UI hooks like useTheme
 * 
 * @param ui - The component to render
 * @param options - Options for the render function
 * @returns The result of the render function
 */
export function renderWithTheme(
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(
    <ThemeProvider theme={theme}>{ui}</ThemeProvider>,
    options
  );
}

/**
 * Provides a wrapper component for components that use Material-UI theme
 * Useful for testing components that need a ThemeProvider context
 */
export const ThemeWrapper: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
};

export default ThemeWrapper; 